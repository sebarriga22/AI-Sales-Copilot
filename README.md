
# AI Sales Email Generator — Starter

Beginner-friendly starter to build a “few inputs in → tailored, conversational, professional email out” tool in **~1–2 hours**.

## 0) Prereqs
- Install **Node.js 18+** (https://nodejs.org)
- Create an account + **API key** with one provider that supports an **OpenAI-compatible Chat Completions** endpoint (e.g., OpenAI, OpenRouter, Together, Groq).

## 1) Get the code running
```bash
# 1) Unzip this project
# 2) Enter the folder
cd ai-email-generator-starter

# 3) Install deps
npm install

# 4) Copy env template → .env and fill in BASE_URL, MODEL, API_KEY
cp .env.example .env

# 5) Start the server
npm run start
# → Open http://localhost:3000
```

> If the page loads but generation fails, the API credentials or model name are usually the culprit.
> Double-check `BASE_URL`, `MODEL`, and `API_KEY` in `.env`.

## 2) What this does
- Serves a single-page form (public/index.html).
- Calls `/generate` (server.js), which forwards your inputs to your LLM provider.
- The prompt **forces JSON output** with `{ subject, opening_line, body, cta }`.
- The server **validates length** and required fields before returning the result.

## 3) Customizing your email
Open `server.js` and edit:
- `SYSTEM_PROMPT`: tone and rules.
- `MAX_WORDS`: shorten/lengthen the body.
- `buildUserContent(...)`: add/remove inputs (e.g., “competitor in use”, “stack”, “region”).

## 4) Guardrails (recommended)
- Add a “facts whitelist” and pass it in `proof` or a new field; instruct the model to use only those facts.
- Reject outputs that mention banned words or make forbidden claims:
  ```js
  const banned = [/guarantee/i, /no risk/i, /100%/i];
  if (banned.some(rx => rx.test(emailJson.body))) throw new Error("Banned phrase detected");
  ```
- Keep temperature around **0.5–0.7** for controlled creativity.

## 5) Quick eval loop
Create a small CSV of 10–15 scenarios and try them. Score each 0–2 on:
- Relevance, Clarity, Tone, CTA clarity, Length.
Iterate prompts once or twice until most are ≥8/10 total.

## 6) Optional niceties
- Subject-line variants: call the endpoint twice with a different instruction.
- A/B tones: add `style = "casual" | "formal"` and branch a prompt line.
- Add a PS line with social proof.
- Add a copy button (already included) and a “Regenerate” button.
- Add per-user presets: keep JSON in localStorage.

## 7) Ready for deployment (later)
- **Do not** ship API keys to the browser; keep them on the server.
- Add basic rate limiting and request size limits.
- Deploy to your favorite host; set env vars securely.
- If you plan to **send emails**, handle compliance (opt-outs, cadence), and integrate with CRM later.

## Troubleshooting
- **401/403**: Wrong or missing API key or bad model name.
- **400 with "did not return valid JSON"**: Set `response_format: { type: "json_object" }` and refine the prompt.
- **Timeouts**: Try a smaller/faster model or reduce context.
- **Too generic**: Force one specific pain point and remove buzzwords in the prompt.

---

Happy building! Start the server and try this example:

- Role/industry: `VP Finance, mid-market SaaS`
- Pain point: `Reconciliation drags past month-end`
- Value prop: `Cut close time by ~30% via automated tie-outs`
- Proof (optional): `Used by 120+ SaaS finance teams`
- CTA style: `soft_call`
```