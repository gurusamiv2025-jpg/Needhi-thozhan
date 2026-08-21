import fs from 'fs';

const oldServer = fs.readFileSync('server.js', 'utf8');

let newServer = oldServer.replace(
  /let ipcFacts = \[\];[\s\S]*?const tnLocalDocFreq = buildDocFreq\(tnLocalServices\);/g,
  `import pkg from 'pg';\nconst { Pool } = pkg;\nimport { pipeline } from '@xenova/transformers';\n\nconst pool = new Pool({\n  connectionString: process.env.DATABASE_URL,\n  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false\n});\n\nlet extractor = null;\nasync function initExtractor() {\n  if (!extractor) {\n    extractor = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2', { quantized: true });\n  }\n}\ninitExtractor();\n\nasync function embedText(text) {\n  await initExtractor();\n  const output = await extractor(text, { pooling: 'mean', normalize: true });\n  return Array.from(output.data);\n}`
);

newServer = newServer.replace(
  /function searchDataset\([\s\S]*?return block;\n}/g,
  `async function buildGroundingBlock(userText) {\n  if (!userText || userText.trim().length === 0) return "";\n  \n  try {\n    const embedding = await embedText(userText);\n    const embeddingStr = \`[\${embedding.join(',')}]\`;\n    \n    const client = await pool.connect();\n    try {\n      const result = await client.query(\`\n        SELECT category, title, content, metadata\n        FROM documents\n        ORDER BY embedding <-> $1\n        LIMIT 5\n      \`, [embeddingStr]);\n      \n      if (result.rows.length === 0) return "";\n      \n      let block = "\\n\\nDATASET GROUNDING (auto-retrieved based on the user's question — use only what's relevant, in your own words; never dump this raw):\\n";\n      for (const row of result.rows) {\n        block += \`- [\${row.category}] \${row.content}\\n\`;\n      }\n      return block;\n    } finally {\n      client.release();\n    }\n  } catch (err) {\n    console.error("Vector search failed:", err);\n    return "";\n  }\n}`
);

newServer = newServer.replace(
  /function buildCurrentFactsBlock\(\) {[\s\S]*?=== END CURRENT FACTS ===\`;\n}/g,
  `async function buildCurrentFactsBlock() {\n  try {\n    const client = await pool.connect();\n    try {\n      const result = await client.query('SELECT fact, value, as_of_date, note FROM current_facts');\n      if (result.rows.length === 0) return "";\n      \n      const lines = result.rows.map((f) => \`- \${f.fact} (as of \${new Date(f.as_of_date).toISOString().slice(0,10)}): \${f.value} — \${f.note}\`).join("\\n");\n      return \`\\n\\n=== CURRENT FACTS — READ THIS BEFORE ANSWERING ANY QUESTION ABOUT CURRENT OFFICEHOLDERS OR HELPLINE NUMBERS ===\\n\${lines}\\n\\nHOW TO USE THIS — exactly two cases, follow the matching one:\\n\\nCASE 1 — the fact IS listed above (e.g. Chief Minister, Governor, TNSLSA contact, NALSA/Women's/Child helplines): STATE IT DIRECTLY AND CONFIDENTLY, exactly as written above, as a plain fact. Do NOT hedge, do NOT add disclaimers, do NOT say you're unsure, do NOT refuse — you HAVE this fact, so just answer it. Example: asked "who is the chief minister of Tamil Nadu" → answer "C. Joseph Vijay" directly, the same way you'd state any other fact you're confident about.\\n\\nCASE 2 — the fact is NOT listed above (any other office, person, or number not mentioned): say plainly you don't have a verified current answer for that specific detail, and point them to check the official government website — if you mention a website, put it in the "resources" array (with its URL as the "contact" field) rather than only in the reply text, so it renders as a clickable link.\\n\\nDo not confuse these two cases — most questions about the facts listed above fall under CASE 1 and should get a direct, confident answer, not a refusal. Refusal (CASE 2) is only for facts genuinely absent from the list.\\n\\nSeparately, and for ALL topics, not just current facts: never rely on your own training knowledge for who currently holds a role (these change; your training data may be outdated) — e.g. do not answer "M. K. Stalin" for Tamil Nadu's Chief Minister; he was replaced in May 2026 and the current facts above list his successor.\\n=== END CURRENT FACTS ===\`;\n    } finally {\n      client.release();\n    }\n  } catch (err) {\n    console.error("Failed to fetch current facts:", err);\n    return "";\n  }\n}`
);

newServer = newServer.replace(
  /const grounding = lastUser \? buildGroundingBlock\(lastUser\.content\) : "";/g,
  `const grounding = lastUser ? await buildGroundingBlock(lastUser.content) : "";`
);

newServer = newServer.replace(
  /const currentFactsBlock = buildCurrentFactsBlock\(\);/g,
  `const currentFactsBlock = await buildCurrentFactsBlock();`
);

// Remove the old initializations in console.log
newServer = newServer.replace(
  /console\.log\(\`  Dataset grounding[\s\S]*?NOT loaded"\}\`\);\n/g,
  `console.log(\`  Database connected: \${process.env.DATABASE_URL ? 'Yes' : 'No'}\`);\n`
);

// Add feedback endpoint
newServer = newServer.replace(
  /app\.post\("\/api\/chat"/g,
  `app.post("/api/feedback", async (req, res) => {
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

app.post("/api/chat"`
);

fs.writeFileSync('server.js', newServer);
console.log('server.js updated successfully!');
