# Needhi Thozhan · நீதி தோழன்

An empathetic, multilingual companion that helps ordinary citizens in India
understand their **constitutional rights** and access **free legal aid** — in plain
language. Three modes: **Ask** a question, **Draft** a document (RTI, complaints,
legal notices), and **Find** free legal aid near you.

Powered by [Groq](https://groq.com). The Groq API key stays on a small backend
server, so it is **never exposed in the browser**.

---

## How it's put together

```
Browser (React app)  ──POST /api/chat──▶  Express server  ──▶  Groq API
   src/                                     server.js            (key lives here)
```

- **Frontend** — Vite + React (`index.html`, `src/`). Calls only `/api/chat`.
- **Backend** — `server.js`. Holds `GROQ_API_KEY`, forwards to Groq's
  OpenAI-compatible endpoint, and (in production) serves the built frontend.

Because the browser never talks to Groq directly, your key can't be stolen from
the page source.

---

## Run it locally

**1. Prerequisites:** [Node.js](https://nodejs.org) 18 or newer.

**2. Install:**

```bash
npm install
```

**3. Add your key:** copy the template and paste in a free Groq key from
<https://console.groq.com/keys>:

```bash
cp .env.example .env
# then edit .env and set GROQ_API_KEY=...
```

**4. Start (frontend + backend together):**

```bash
npm run dev
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` calls to the
Express backend on port 3001.

---

## Build & run for production

```bash
npm run build     # compiles the React app into dist/
npm start         # Express serves dist/ AND the /api proxy on one port
```

Then open <http://localhost:3001> (or your `PORT`).

---

## Configuration (`.env`)

| Variable        | Required | Default                    | Notes |
|-----------------|----------|----------------------------|-------|
| `GROQ_API_KEY`  | yes      | —                          | From the Groq console. |
| `GROQ_MODEL`    | no       | `llama-3.3-70b-versatile`  | `llama-3.1-8b-instant` is faster/cheaper. |
| `PORT`          | no       | `3001`                     | Server port. |

`llama-3.3-70b-versatile` is recommended here — its stronger reasoning gives
more reliable legal explanations and better non-English output.

---

## Deploying (make it a real, live website)

This is a standard Node app, so most hosts work. In every case, set the
environment variables (`GROQ_API_KEY`, optionally `GROQ_MODEL`) in the host's
dashboard — **do not** commit `.env`.

**Render / Railway / Fly.io / a VPS:**
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Add `GROQ_API_KEY` as an environment variable.

**Vercel / Netlify:** these favour serverless functions. The simplest path is
still the single-server setup above on a Node host; if you prefer serverless,
move the handler in `server.js` into an `/api/chat` function and deploy the
`dist/` folder as static output.

---

## A note on responsible use

Needhi Thozhan gives **general legal information, not legal advice**, and is not a
lawyer. It is designed to explain rights plainly and route people to real, free
help (NALSA · **15100**, emergency · **112**). Keep the in-app disclaimer visible,
and treat generated drafts as starting points to review — not filed documents.

Language and citation quality vary by model; open-weight models can occasionally
get a detail wrong, so the app is instructed to avoid inventing citations and to
point users to a District Legal Services Authority for anything specific to their
case.
