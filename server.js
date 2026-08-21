// Needhi Thozhan · நீதி தோழன் — backend proxy.
// Holds the Groq API key server-side (never exposed to the browser) and
// forwards chat requests to Groq's OpenAI-compatible endpoint.

import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "1mb" }));

// ── Dataset grounding: IPC sections + Act titles (from Kaggle), plus a hand-curated
// set of constitutional articles, government services, and TN-specific guidance. ──
import pkg from 'pg';
const { Pool } = pkg;
import { pipeline } from '@xenova/transformers';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let extractor = null;
async function initExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', { quantized: true });
  }
}
initExtractor();

async function embedText(text) {
  await initExtractor();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

async function buildGroundingBlock(userText) {
  if (!userText || userText.trim().length === 0) return { text: "", sources: [] };
  
  try {
    const embedding = await embedText(userText);
    const embeddingStr = `[${embedding.join(',')}]`;
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT category, title, content, metadata
        FROM documents
        ORDER BY embedding <-> $1
        LIMIT 5
      `, [embeddingStr]);
      
      if (result.rows.length === 0) return { text: "", sources: [] };
      
      let block = "\n\nDATASET GROUNDING (auto-retrieved based on the user's question — use only what's relevant, in your own words; never dump this raw):\n";
      const sources = [];
      for (const row of result.rows) {
        block += `- [${row.category}] ${row.content}\n`;
        // Deduplicate sources by title
        if (row.title && !sources.some(s => s.title === row.title)) {
          sources.push({ category: row.category, title: row.title });
        }
      }
      return { text: block, sources };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Vector search failed:", err);
    return { text: "", sources: [] };
  }
}

// Small, hand-curated facts about things that genuinely change over time — current
// officeholders, contact numbers — where a model's training data is a real hallucination
// risk (roles change; elections happen; a confident guess from stale memory is worse than
// admitting uncertainty). This block is always included (it's tiny) with a strict
// instruction: for THIS category of question, the model must use ONLY this data, never
// its own training knowledge, and must say so plainly if the specific fact isn't listed.
async function buildCurrentFactsBlock() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT fact, value, as_of_date, note FROM current_facts');
      if (result.rows.length === 0) return "";
      
      const lines = result.rows.map((f) => `- ${f.fact} (as of ${new Date(f.as_of_date).toISOString().slice(0,10)}): ${f.value} — ${f.note}`).join("\n");
      return `\n\n=== CURRENT FACTS — READ THIS BEFORE ANSWERING ANY QUESTION ABOUT CURRENT OFFICEHOLDERS OR HELPLINE NUMBERS ===\n${lines}\n\nHOW TO USE THIS — exactly two cases, follow the matching one:\n\nCASE 1 — the fact IS listed above (e.g. Chief Minister, Governor, TNSLSA contact, NALSA/Women's/Child helplines): STATE IT DIRECTLY AND CONFIDENTLY, exactly as written above, as a plain fact. Do NOT hedge, do NOT add disclaimers, do NOT say you're unsure, do NOT refuse — you HAVE this fact, so just answer it. Example: asked "who is the chief minister of Tamil Nadu" → answer "C. Joseph Vijay" directly, the same way you'd state any other fact you're confident about.\n\nCASE 2 — the fact is NOT listed above (any other office, person, or number not mentioned): say plainly you don't have a verified current answer for that specific detail, and point them to check the official government website — if you mention a website, put it in the "resources" array (with its URL as the "contact" field) rather than only in the reply text, so it renders as a clickable link.\n\nDo not confuse these two cases — most questions about the facts listed above fall under CASE 1 and should get a direct, confident answer, not a refusal. Refusal (CASE 2) is only for facts genuinely absent from the list.\n\nSeparately, and for ALL topics, not just current facts: never rely on your own training knowledge for who currently holds a role (these change; your training data may be outdated) — e.g. do not answer "M. K. Stalin" for Tamil Nadu's Chief Minister; he was replaced in May 2026 and the current facts above list his successor.\n=== END CURRENT FACTS ===`;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Failed to fetch current facts:", err);
    return "";
  }
}

// ── Live web search, for genuinely time-sensitive questions only (new/updated laws). ──
// Uses Tavily (a search API built for feeding LLMs — clean pre-parsed results, no HTML
// scraping to maintain, nothing that can break mid-demo). Only fires when the question
// itself signals recency; every other question is unaffected and unslowed.
const TAVILY_URL = "https://api.tavily.com/search";

function needsWebSearch(text) {
  return /\b(latest|recent(ly)?|new law|newly passed|just passed|update(d|s)?|amendment|amended|202[4-9]|current law|new rule|new act)\b/i.test(String(text || ""));
}

async function webSearch(query) {
  if (!process.env.TAVILY_API_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000); // bounded — never let this stall the whole request
  try {
    const r = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 3,
        search_depth: "basic",
        include_answer: false,
      }),
      signal: controller.signal,
    });
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data.results) ? data.results : null;
  } catch {
    return null; // network hiccup, timeout, bad key, whatever — fail silently, never break the chat
  } finally {
    clearTimeout(timeout);
  }
}

function buildWebSearchBlock(results, query) {
  if (!results || results.length === 0) return "";
  const today = new Date().toISOString().slice(0, 10);
  let block = `\n\nLIVE WEB SEARCH RESULTS (fetched just now, ${today}, for: "${query}"):\n`;
  for (const r of results.slice(0, 3)) {
    const snippet = String(r.content || "").slice(0, 300);
    block += `- ${r.title} (${r.url}): ${snippet}\n`;
  }
  block += `\nUse these ONLY if genuinely relevant to the user's question, in your own words — never quote long passages verbatim. This is recent web information, not something independently verified by us, so present it as "recent reports suggest..." rather than stated fact, and still point the user to confirm anything important with an official source or NALSA (15100). If these results don't actually answer the question, say so rather than forcing an answer from them.`;
  return block;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// llama-3.3-70b-versatile was retired by Groq on Aug 16, 2026. Their recommended
// replacement is openai/gpt-oss-120b (strong reasoning, supports JSON mode).
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const VALID_EFFORTS = new Set(["low", "medium", "high"]);

async function groqComplete({ system, messages, jsonMode = true, effort = "low", temp = 0.2, modelOverride }) {
  // Clamp to a safe range — legal accuracy needs low variance everywhere, but we still
  // let modes differ slightly: Ask a touch more natural (0.3), Draft/Find near-deterministic
  // (0.15-0.2) since they're closer to format-following tasks than open explanation.
  const safeTemp = Math.min(Math.max(Number(temp) || 0.2, 0), 0.6);
  const body = {
    model: modelOverride || MODEL,
    temperature: safeTemp,
    max_tokens: 2200,          // documents (Draft mode) need more room than chat replies
    messages: [...(system ? [{ role: "system", content: system }] : []), ...messages],
  };
  
  if (!modelOverride) {
    body.reasoning_effort = VALID_EFFORTS.has(effort) ? effort : "low";
  }
  // JSON mode guarantees a parseable object (the app expects structured JSON).
  if (jsonMode) body.response_format = { type: "json_object" };
  return fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
}

app.post("/api/feedback", async (req, res) => {
  try {
    const { query, response_summary, feedback_type } = req.body;
    const client = await pool.connect();
    try {
      await client.query(
        "INSERT INTO user_feedback (query, response_summary, feedback_type) VALUES ($1, $2, $3)",
        [query, response_summary, feedback_type]
      );
      res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Feedback error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/feedback", async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const r = await client.query("SELECT * FROM user_feedback ORDER BY created_at DESC LIMIT 100");
      res.json(r.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Fetch feedback error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/health", async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    res.json({ status: "healthy", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "unhealthy", database: "disconnected" });
  }
});

// Simple in-memory rate limiter for /api/chat
const rateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 15;

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const now = Date.now();
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }
  const entry = rateLimits.get(ip);
  if (now > entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + RATE_LIMIT_WINDOW_MS;
    return next();
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: "Too many requests. Please wait a moment." });
  }
  next();
}
app.post("/api/analyze-document", rateLimitMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Server is missing GROQ_API_KEY." });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const { system, messages, effort, temp } = JSON.parse(req.body.payload || "{}");
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Request must include a messages array." });
    }

    const lastUserMsg = messages[messages.length - 1];
    if (!lastUserMsg || lastUserMsg.role !== "user") {
      return res.status(400).json({ error: "Last message must be from user." });
    }

    const currentFactsBlock = await buildCurrentFactsBlock();
    const groundedSystem = currentFactsBlock + (system || "");

    let modelOverride = undefined;
    let jsonMode = true;

    if (file.mimetype === "application/pdf") {
      const pdfData = await pdfParse(file.buffer);
      lastUserMsg.content = `[UPLOADED PDF DOCUMENT CONTENT]\n\n${pdfData.text}\n\n[USER INSTRUCTION]\n${lastUserMsg.content}`;
    } else if (file.mimetype.startsWith("image/")) {
      const base64 = file.buffer.toString("base64");
      const imageUrl = `data:${file.mimetype};base64,${base64}`;
      const originalText = lastUserMsg.content;
      
      lastUserMsg.content = [
        { type: "text", text: `[UPLOADED IMAGE]\n\nPlease read and analyze this document. ${originalText}` },
        { type: "image_url", image_url: { url: imageUrl } }
      ];
      // Use Qwen for multimodal input since Llama vision was decommissioned
      modelOverride = "qwen/qwen3.6-27b";
      jsonMode = false; // Vision model often fails with JSON mode enforcement
    } else {
      return res.status(400).json({ error: "Unsupported file type." });
    }

    const r = await groqComplete({ system: groundedSystem, messages, jsonMode, effort, temp, modelOverride });
    
    if (!r.ok) {
       const errText = await r.text();
       console.error("Groq Analysis Error:", errText);
       return res.status(500).json({ error: "LLM Error: " + errText });
    }

    const data = await r.json();
    let content = data?.choices?.[0]?.message?.content ?? "{}";
    
    if (!jsonMode) {
      const firstBrace = content.indexOf("{");
      const lastBrace = content.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1) {
        content = content.slice(firstBrace, lastBrace + 1);
      }
    }
    
    res.json({ content, sources: [] });
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chat", rateLimitMiddleware, async (req, res) => {
  try {
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Server is missing GROQ_API_KEY. Copy .env.example to .env and add your key." });
    }
    const { system, messages, effort, temp } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Request must include a messages array." });
    }

    // Ground the AI's instructions with any relevant dataset facts for THIS specific
    // question — purely additive to the existing system prompt, skipped silently if
    // nothing relevant is found.
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const groundingObj = lastUser ? await buildGroundingBlock(lastUser.content) : { text: "", sources: [] };
    const currentFactsBlock = await buildCurrentFactsBlock(); // always included — small, and this is the category most worth being strict about

    // Only for questions that actually signal "new/updated/recent law" — a live web
    // search, not a scraper. Skipped entirely (zero added latency) for ordinary questions.
    let webBlock = "";
    if (lastUser && needsWebSearch(lastUser.content)) {
      const results = await webSearch(lastUser.content);
      webBlock = buildWebSearchBlock(results, lastUser.content);
    }

    const groundedSystem = groundingObj.text || currentFactsBlock || webBlock ? `${currentFactsBlock}${system || ""}${groundingObj.text}${webBlock}` : system;

    let r = await groqComplete({ system: groundedSystem, messages, jsonMode: true, effort, temp });

    // Some models don't support JSON mode — retry once without it.
    if (!r.ok) {
      const errText = await r.text();
      if (r.status === 400 && /response_format|json/i.test(errText)) {
        r = await groqComplete({ system: groundedSystem, messages, jsonMode: false, effort, temp });
        if (!r.ok) {
          const t2 = await r.text();
          return res.status(r.status).json({ error: "Groq API error", detail: t2.slice(0, 400) });
        }
      } else {
        return res.status(r.status).json({ error: "Groq API error", detail: errText.slice(0, 400) });
      }
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return res.json({ content, sources: groundingObj.sources });

  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e?.message || e).slice(0, 300) });
  }
});

// In production (after `npm run build`), serve the compiled frontend.
const dist = path.join(__dirname, "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`\n  Needhi Thozhan · நீதி தோழன்`);
  console.log(`  → http://localhost:${port}`);
  console.log(`  Model: ${MODEL}`);
  console.log(`  Database connected: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
  console.log(`  Live web search: ${process.env.TAVILY_API_KEY ? "enabled (Tavily key found)" : "disabled — no TAVILY_API_KEY set, questions about new/recent laws will answer from datasets only"}`);
  if (!process.env.GROQ_API_KEY) console.log("  ⚠  GROQ_API_KEY is not set — add it to .env\n");
  else console.log("");
});
