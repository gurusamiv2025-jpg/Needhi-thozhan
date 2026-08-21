# NEEDHI THOZHAN — GODMODE MASTER REFERENCE

Full project analysis + the definitive additive-only ruleset for any future work

Paste PART 2 of this document as your system/first instruction whenever you brief any AI tool — Claude, Gemini, Antigravity, or a future session of any of them — to work on this project. PART 1 is the analysis that justifies every rule in PART 2; read it first so you understand why the rules exist, not just what they say.

## PART 1 — FULL PROJECT ANALYSIS

### 1.1 The core idea (this is the one thing that must never change)
Needhi Thozhan (நீதி தோழன் — "Justice Friend") exists to solve one specific problem: most Indians cannot afford a lawyer and cannot parse legal language, and the gap between "the law exists" and "an ordinary, possibly scared, possibly non-English-speaking citizen can act on it" is where real harm happens. Everything in this app — every feature, every design choice, every safety guardrail — serves that one gap. The India-wide statistic worth remembering: 76.1% of prison inmates in India are undertrials, not convicted of any crime, frequently because they didn't know their rights or couldn't access legal help (NCRB Prison Statistics Report). That is the problem this product answers.

The product's own self-description, arrived at through this entire build: "The intelligence is commoditized. What we built is the last mile." Claude, ChatGPT, Gemini can all answer legal questions. Needhi Thozhan is the layer between "an AI that knows the law" and "a frightened citizen who can actually use it" — guided document generation instead of prose, hardcoded safety guardrails instead of general-purpose neutrality, tap-to-select instead of prompting, and every answer routed back to a real, free, human institution (NALSA, DLSA, emergency services).

### 1.2 Architecture as it stands
Browser (React/Vite, src/NeedhiThozhan.jsx)
        │  POST /api/chat  (never talks to Groq/Tavily directly)
        ▼
Express server (server.js, holds all secrets)
        │
        ├─→ Groq API (openai/gpt-oss-120b) — the only thing that reasons and writes answers
        ├─→ Tavily API — triggered only for "latest/recent/2024-2029/amendment"-type questions
        └─→ Postgres (pgvector) — Vector RAG embeddings:
              • ipc-facts.json
              • rights-articles.json
              • gov-services.json
              • tn-local-services.json
              • current-facts.json (strict verification)

### 1.3 Complete feature inventory (what exists and is confirmed working)
- **Three modes**: Ask a question (structured JSON chat), Draft a document (RTI, rent deposit notice, etc., exports to True DOCX), Find legal aid.
- **Accessibility**: 12-language support (UI fully translated), voice input, voice output, mobile slide-in sidebar.
- **Trust and safety**: Click-to-call, crisis banner, lawyer escalation flow (Needs Professional Counsel card), feedback logged to Postgres, verified facts block.
- **Reliability engineering**: Self-repair, graceful aborts, sliding conversation-history window.
- **Efficiency tuning**: Per-mode reasoning effort, low temps for deterministic generation.

### 1.4 Design language (visual identity)
Navy/gold/cream palette drawn from the illuminated original Constitution of India manuscript. A 24-spoke Ashoka Chakra as logo and loading indicator. Fraunces serif for display type, Inter for body.

### 1.5 Hard-won lessons from this build
- **Stale-file bugs**: The browser kept running old cached copies because of wrong folder placement. Full file delete-and-replace, plus a hard browser refresh works best.
- **Secrets**: live API keys must never be pasted into chat.
- **Translations**: Translation completeness regressed as features were added quickly.
- **Honesty**: Every "we don't have verified data" moment was turned into an honest, visible product decision.

---

## PART 2 — THE GODMODE PROMPT (paste this to brief any AI tool)

You are being given access to an existing, working, tested, deployed product called
Needhi Thozhan (நீதி தோழன் — "Justice Friend"), a constitutional-rights and legal-aid
assistant for India. It is not a prototype you are building from scratch — it is a real
system with real users in mind, built through many hours of careful, tested iteration.
Your role is STRICTLY ADDITIVE. Read every rule below before touching anything.

═══════════════════════════════════════════════════════════════
ABSOLUTE RULE 1 — THE CORE NEVER CHANGES WITHOUT EXPLICIT PERMISSION
═══════════════════════════════════════════════════════════════
The following are the CORE and are OFF LIMITS for redesign, replacement, or "improvement"
unless the person explicitly asks you to change that specific thing by name:

- The mission: helping people who can't afford a lawyer and can't parse legal language
  understand their rights and take real action. Every feature must serve this directly.
- The three-mode structure: Ask a question / Draft a document / Find legal aid.
- The visual identity: navy/gold/cream palette, the Ashoka Chakra motif, Fraunces serif
  display type. Do not replace this with a generic template aesthetic.
- The safety principles: never invent Article/Section numbers or legal citations: never
  state a current officeholder or contact detail from model memory alone; never fabricate
  a phone number or address that hasn't been verified; always route back to a real
  institution (NALSA 15100, emergency 112); Draft-mode must placeholder-mark missing
  info, never invent it.
- Every existing feature listed in Section 1.3 above. If you are not certain a feature
  still works after your change, TEST IT — do not assume.
- The architecture boundary: the browser must NEVER call Groq or Tavily directly — only
  through the Express backend, which holds the secrets.

═══════════════════════════════════════════════════════════════
ABSOLUTE RULE 2 — EVERY NEW FEATURE IS AN ADD-ON, NEVER A REPLACEMENT
═══════════════════════════════════════════════════════════════
When asked to add something new:
1. Identify the smallest possible change that achieves the request.
2. Prefer NEW functions/components/files over editing existing working logic.
3. If a new feature genuinely requires touching existing code (e.g., adding a new prop
   to a shared component), make the change backward-compatible — existing callers must
   keep working exactly as before unless the person explicitly asked to change that
   specific existing behavior.
4. NEVER perform a "while I'm in here" cleanup, refactor, or restyle of unrelated code.
   If you notice something that looks improvable, mention it — do not touch it uninvited.
5. NEVER remove a feature to make room for a new one unless explicitly told to.

═══════════════════════════════════════════════════════════════
ABSOLUTE RULE 3 — TEST BEFORE CLAIMING SOMETHING WORKS
═══════════════════════════════════════════════════════════════
- Compile-check every code change before presenting it.
- For anything with real logic (parsing, matching, retry behavior, scoring), write and
  run an actual test against realistic inputs — including deliberately adversarial or
  edge-case inputs — before calling it done. "It compiles" is not "it works."
- After any change, verify the SPECIFIC feature requested AND spot-check 2-3 unrelated
  existing features to catch silent regressions (this project has a real history of
  changes accidentally breaking things elsewhere — e.g., a data-search regex change
  once accidentally deleted an unrelated array declaration).
- If you cannot fully test something (e.g., it needs a live API key you don't have,
  or a mobile device), say so explicitly rather than implying it's fully verified.

═══════════════════════════════════════════════════════════════
ABSOLUTE RULE 4 — HONESTY OVER APPARENT COMPLETENESS
═══════════════════════════════════════════════════════════════
This product's credibility rests on never faking what isn't verified. If a requested
feature would require inventing data you can't confirm (a phone number, an address, a
current fact that changes over time), do NOT invent it. Instead: implement the honest
version (state what's genuinely known, clearly flag what isn't, point to an authoritative
source) — the same pattern already used throughout this app. This is not a fallback
behavior, it is a design principle. Explain this tradeoff to the person rather than
silently picking the confident-but-fake option.

═══════════════════════════════════════════════════════════════
ABSOLUTE RULE 5 — RESPECT THE KNOWN FRAGILE POINTS
═══════════════════════════════════════════════════════════════
- File delivery: when handing back a changed file, make clear it needs a FULL replace,
  not a partial paste — this project has lost significant time to stale-file bugs.
- Secrets: never write a real API key into any file that isn't the person's own local
  .env. Never suggest committing .env. If you see a real-looking key anywhere in context,
  flag it and recommend rotation, once, plainly, without belaboring it.
- Token budget: this app's system prompt is already large (multiple grounding sources
  stacked). If your addition meaningfully grows it further, say so and consider whether
  it should be conditionally included (like the existing search-gated datasets) rather
  than always-on (like the small current-facts block).
- Translations: if you add ANY new user-facing string, translate it into all currently
  supported UI languages (English, Hindi, Tamil have full UI coverage) in the SAME
  change — never "will translate later."

═══════════════════════════════════════════════════════════════
WHAT A GOOD ADD-ON LOOKS LIKE (reference pattern)
═══════════════════════════════════════════════════════════════
Every feature added to this project so far followed this shape: a new, isolated function
or component → wired into exactly the necessary integration points → new translation
entries added alongside the code, not after → tested with both realistic and adversarial
inputs → a clear explanation to the person of what changed, how to install it (full file
replace), and how to verify it. Follow this shape for anything you add.

═══════════════════════════════════════════════════════════════
BEFORE YOU START ANY WORK
═══════════════════════════════════════════════════════════════
State back, in your own words, what you understand the CORE to be and what you understand
the specific requested ADD-ON to be, and confirm these are cleanly separable. If they are
not — if the request actually requires touching the core — say so explicitly and ask for
confirmation before proceeding, rather than quietly reinterpreting "add-on" to include a
core change.
