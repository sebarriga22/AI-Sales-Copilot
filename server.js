
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const BASE_URL = process.env.BASE_URL; // e.g., https://api.openai.com/v1
const API_KEY = process.env.API_KEY;
const MODEL = process.env.MODEL;
const PORT = process.env.PORT || 3000;
const TEMPERATURE = Number(process.env.TEMPERATURE || 0.6);
const MAX_WORDS = Number(process.env.MAX_WORDS || 150);

// Basic input validation
function reqField(obj, field, msg) {
  if (!obj[field] || String(obj[field]).trim().length === 0) {
    throw new Error(msg || `Missing field: ${field}`);
  }
}

function wordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

function validateOutput(jsonOut) {
  const required = ["subject", "opening_line", "body", "cta"];
  for (const k of required) {
    if (typeof jsonOut[k] !== "string" || jsonOut[k].trim() === "") {
      throw new Error(`Model output missing or invalid field: ${k}`);
    }
  }
  if (wordCount(jsonOut.body) > MAX_WORDS) {
    throw new Error(`Email body too long: ${wordCount(jsonOut.body)} words (limit ${MAX_WORDS})`);
  }
}

// Core prompt pieces
const SYSTEM_PROMPT = `You are a B2B SDR writing succinct, warm, professional emails.
- Keep body to 90–${"${MAX_WORDS}"} words unless otherwise stated.
- Be specific and non-hypey.
- Use one clear CTA.
- Do not invent facts or metrics.
- Use plain US English.
Return ONLY valid JSON matching the schema with no extra commentary.`;

// Format the user content as structured instructions + facts whitelist
function buildUserContent({ roleIndustry, painPoint, valueProp, proof = "none", ctaStyle = "soft_call" }) {
  return `
Prospect role/industry: ${"${roleIndustry}"}
Pain point: ${"${painPoint}"}
Value proposition: ${"${valueProp}"}
Proof allowed to reference: ${"${proof}"}
CTA style: ${"${ctaStyle}"}

Constraints:
- 2–3 short paragraphs (or 4–6 short sentences).
- One action to take, clear and simple.
- Avoid buzzwords like "industry-leading", "cutting-edge".
- No placeholders.

JSON schema to return:
{
  "subject": "5–7 words",
  "opening_line": "1 sentence",
  "body": "90–${"${MAX_WORDS}"} words",
  "cta": "1 sentence with a single action"
}
`.trim();
}

// Healthcheck
app.get("/health", (_, res) => {
  res.json({ ok: true });
});

// Generation endpoint
app.post("/generate", async (req, res) => {
  try {
    const { roleIndustry, painPoint, valueProp, proof, ctaStyle } = req.body || {};
    reqField({ roleIndustry }, "roleIndustry", "Please provide role/industry (e.g., 'VP Finance, SaaS')");
    reqField({ painPoint }, "painPoint", "Please provide one pain point");
    reqField({ valueProp }, "valueProp", "Please provide your value prop");
    if (!BASE_URL || !API_KEY || !MODEL) {
      throw new Error("Server is missing BASE_URL, API_KEY, or MODEL. Check your .env");
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserContent({ roleIndustry, painPoint, valueProp, proof, ctaStyle }) }
    ];

    // OpenAI-compatible Chat Completions request
    const r = await fetch(`${"${BASE_URL}"}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${"${API_KEY}"}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: TEMPERATURE,
        // Many providers ignore this, but OpenAI-compatible supports it:
        response_format: { type: "json_object" }
      })
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Upstream error (${r.status}): ${t}`);
    }

    const data = await r.json();
    // Try to parse content; different providers may return different shapes
    const raw = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message || "";
    let emailJson;
    try {
      emailJson = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      // If the model didn't follow json_object, try to extract
      const match = String(raw).match(/\{[\s\S]*\}/);
      if (match) emailJson = JSON.parse(match[0]);
    }

    if (!emailJson) throw new Error("Model did not return valid JSON. Adjust prompt or try again.");
    validateOutput(emailJson);

    res.json({ ok: true, model: MODEL, email: emailJson });
  } catch (err) {
    res.status(400).json({ ok: false, error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`AI Email Generator server listening on http://localhost:${"${PORT}"}`);
});
