// --- Canonical minimal server (ESM) ---
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";

dotenv.config();

// Accept either API_KEY or OPENAI_API_KEY (Render often uses OPENAI_API_KEY)
const API_KEY = process.env.API_KEY || process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Missing API key. Set API_KEY or OPENAI_API_KEY in your environment.");
  process.exit(1);
}

// OpenAI client
const openai = new OpenAI({ apiKey: API_KEY });

// App + middleware
const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---------- Helpers ----------
function safeJSONParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ---------- /generate ----------
app.post("/generate", async (req, res) => {
  try {
    const {
      roleIndustry = "Advisory / CAS Practice Leader",
      painPoint = "Manual data entry for client reconciliation is consuming staff time.",
      valueProp = "Canopy provides a single source of truth for all client data, eliminating data entry and errors.",
      proof = "",
      ctaStyle = "soft_call",
      tone = "conversational-professional",
      variants = 1
    } = req.body || {};

    const prompt = `
Return a single JSON object with this shape:

{
  "emails": [{
    "subject": "string",
    "opening_line": "string",
    "body": "string",
    "cta": "string",
    "competitor_analysis": "string"
  }]
}

Write exactly ${variants || 1} email(s) tailored to:
- Persona: ${roleIndustry}
- Pain point: ${painPoint}
- Value prop: ${valueProp}
- Tone: ${tone}
- CTA style: ${ctaStyle}
- Competitor: ${proof || "None"}
`;

const resp = await openai.responses.create({
  model: "gpt-4o-mini",
  input: prompt,
  // No response_format needed — the model will return text by default
});

    const text = resp.output_text || "";
    const parsed = safeJSONParse(text);

    if (!parsed || !Array.isArray(parsed.emails)) {
      const fallback = {
        emails: [{
          subject: "Unlock time savings for your team",
          opening_line: "Noticed your team spends a lot on manual reconciliation.",
          body: "With Canopy, firms centralize client data and remove repetitive entry — freeing hours each week while improving accuracy.",
          cta: "Open to a quick 10-min intro next week?",
          competitor_analysis: proof ? `Position vs ${proof}` : "No competitor focus."
        }]
      };
      return res.json({ ok: true, model: "gpt-4o-mini", emails: fallback.emails });
    }

    return res.json({ ok: true, model: "gpt-4o-mini", emails: parsed.emails });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || err) });
  }
});

// ---------- /rewrite ----------
app.post("/rewrite", async (req, res) => {
  try {
    const { prompt = "Tighten and shorten by ~15%", email_text = "" } = req.body || {};

    const r = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `Rewrite the email below according to this instruction: "${prompt}".
Return plain text that begins with "Subject:" then the body.

EMAIL:
${email_text}`
    });

    const rewritten_text = r.output_text?.trim() || email_text;
    const new_persona = "Advisory / CAS Practice Leader";

    return res.json({ ok: true, rewritten_text, new_persona });
  } catch (err) {
    return res.status(400).json({ ok: false, error: String(err?.message || err) });
  }
});

// ---------- Start ----------
const PORT = process.env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on 0.0.0.0:${PORT}`);
});
