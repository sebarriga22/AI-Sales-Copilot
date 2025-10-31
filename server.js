// --- Canonical header (keep this) ---
import * as dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';

dotenv.config();

// File path setup for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env & defaults
const {
  BASE_URL = 'https://api.openai.com/v1',
  MODEL = 'gpt-4o-mini',
  TEMPERATURE = '0.6',
  MAX_WORDS = '150',
  PORT = 3000,
} = process.env;

// Accept either API_KEY or OPENAI_API_KEY (Render uses OPENAI_API_KEY)
const API_KEY = process.env.API_KEY || process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Missing API key. Set API_KEY or OPENAI_API_KEY in your environment.');
  process.exit(1);
}

// OpenAI client (SDK is fine even if you call fetch later)
const openai = new OpenAI({ apiKey: API_KEY });

const app = express();

// Core middleware & static
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));
// --- end canonical header ---


// ---- Helpers ----
// --- CANOPY KNOWLEDGE BASE (EXPANDED FEATURE) ---
const PERSONA_KNOWLEDGE = {
    'Advisory / CAS Practice Leader': {
        goals: [
            'Scale CAS practice delivering predictable recurring revenue and improved margins.',
            'Standardize bookkeeping, reporting and advisory workflows for consistency.',
            'Shift client conversations to proactive advice ("what will we do next").'
        ],
        pain_points: [
            'Delegation & Bandwidth: Juggling execution, staffing, process, tech and strategy.',
            'Inconsistent Data & Workflow: Variability in internal processes slows advisory progress.',
            'Tool & Tech Overload: Too many disconnected tools and complex integrations.'
        ],
        messaging_themes: [
            'Empathy: Acknowledge they are running dual engines (delivery and transformation).',
            'Credible realism: "We won’t promise impossible integrations, but we will simplify your path."',
            'Outcome-orientation: Focus on clean data, streamlined processes, and client clarity.'
        ],
        description: 'Director / Partner / Practice Lead focused on scaling and operationalizing Client Advisory Services (CAS). Goal is margin improvement and strategic focus over operations.'
    },
    'Firm Owner, Small CPA Firm': {
        goals: [
            'Improve efficiency to handle more clients without hiring more staff.',
            'Reduce administrative time spent on document management and email tracking.',
        ],
        pain_points: [
            'Staff burnout due to manual, repetitive tasks (admin drag).',
            'Inconsistent collection process leading to cash flow uncertainty.',
        ],
        messaging_themes: [
            'Focus on time savings and capacity creation.',
            'Emphasize automation of low-value administrative tasks.',
            'Theme: "Get back to doing client work, not paper work."'
        ],
        description: 'Firm owner focused on efficiency, profitability, and reducing administrative overhead in a small firm.'
    },
    'CFO, Mid-Sized Business': {
        goals: [
            'Ensure compliance and reliable financial reporting.',
            'Maximize team efficiency by automating month-end close processes.',
        ],
        pain_points: [
            'Slow, error-prone month-end close process.',
            'Data silos between departments (sales, finance) resulting in poor forecasting.',
        ],
        messaging_themes: [
            'Theme: Financial reliability and speed.',
            'Focus on accurate, consolidated data for compliance.',
        ],
        description: 'CFO concerned with compliance, internal efficiency, and accurate forecasting in a growing organization.'
    },
    'Tax Manager / Partner': {
        goals: [
            'Streamline tax data gathering and client portal usage.',
            'Reduce risk of compliance errors related to document handling.',
        ],
        pain_points: [
            'Clients failing to submit documents on time or using insecure email.',
            'Tracking status of K-1s, 1099s, and source documents across multiple tools.',
        ],
        messaging_themes: [
            'Theme: Security, speed, and client compliance.',
            'Focus on centralized document collection and secure portal technology.',
        ],
        description: 'Tax professional seeking efficiency and security for document exchange and compliance work.'
    },
    'Operations Lead, Accounting Firm': {
        goals: [
            'Standardize firm-wide workflows and client onboarding.',
            'Improve inter-team communication and hand-offs (e.g., between Tax and Audit).',
        ],
        pain_points: [
            'Inconsistent processes across different departments.',
            'Staff reverting to inefficient tools (email, spreadsheets) due to clunky software.',
        ],
        messaging_themes: [
            'Theme: Standardization, adoption, and internal clarity.',
            'Focus on easy-to-configure, mandatory workflows.',
        ],
        description: 'Leader responsible for firm process standardization, technology adoption, and operational efficiency.'
    },
    'IT/Tech Leader, Accounting Firm': {
        goals: [
            'Reduce the total number of applications in the firm’s stack (tool consolidation).',
            'Ensure all client data meets modern security and compliance standards.',
        ],
        pain_points: [
            'Managing too many disparate software contracts and licenses.',
            'Security risks associated with shadow IT (staff using unapproved apps).',
        ],
        messaging_themes: [
            'Theme: Security, simplicity, and vendor consolidation.',
            'Focus on cloud-native security and unified client portals.',
        ],
        description: 'IT leader focused on security, compliance, and reducing tech stack complexity across the firm.'
    },
    'Bookkeeper / Staff Accountant': {
        goals: [
            'Streamline daily data entry and reconciliation tasks.',
            'Get client questions answered quickly to minimize blockages.',
        ],
        pain_points: [
            'Chasing clients for missing documents and information.',
            'Wasting time on manual data entry due to poor integrations.',
        ],
        messaging_themes: [
            'Theme: Clarity, speed, and reduced friction in daily work.',
            'Focus on easy communication and automated reminders.',
        ],
        description: 'Staff member focused on day-to-day execution, seeking clarity and efficiency in routine bookkeeping tasks.'
    },
    'Managing Partner / CEO': {
        goals: [
            'Grow firm revenue by 15-20% annually.',
            'Improve firm valuation and attract top talent.',
        ],
        pain_points: [
            'Fear of falling behind competitors in technology adoption.',
            'Difficulty attracting and retaining high-quality young talent.',
        ],
        messaging_themes: [
            'Theme: Growth, firm valuation, and talent retention.',
            'Focus on modernizing the firm brand and improving operational margin.',
        ],
        description: 'Executive focused on overall firm strategy, growth, and profitability.'
    },
    'Small Business Client (End User)': {
        goals: [
            'Easily share documents and communicate securely with their CPA.',
            'Know the status of their tax/accounting work without calling the firm.',
        ],
        pain_points: [
            'Forgetting where to upload documents (email, Dropbox, portal).',
            'Lack of visibility into project status.',
        ],
        messaging_themes: [
            'Theme: Simplicity, convenience, and transparency.',
            'Focus on a single, secure, mobile-friendly client experience.',
        ],
        description: 'The person who ultimately uses the client portal, seeking simplicity and transparency.'
    },
    'Marketing Director / Lead': { // Retained, but will not be used in the new UI
        goals: [
            'Modernize the firm’s brand and online presence.',
            'Generate high-quality leads for advisory services.',
        ],
        pain_points: [
            'Marketing messaging is inconsistent with the firm’s actual technology stack.',
            'Difficulty gathering client success stories and testimonials.',
        ],
        messaging_themes: [
            'Theme: Brand consistency, modernization, and lead generation.',
            'Focus on client experience as a marketing asset.',
        ],
        description: 'Marketing professional focused on brand, lead quality, and digital presence.'
    },
};


// --- Canopy Competitors for Battle Card Analysis ---
const COMPETITORS = [
  'Karbon', 'Taxdome', 'Financial Cents', 'Firm360', 
  'Ignition', 'Drake Firm Portal', 'Mango', 'CCH Axcess', 'Practice CS'
];
const COMPETITOR_LIST = COMPETITORS.join(', ');

const TONE_PRESETS = {
  'conversational-professional': {
    name: 'Conversational, professional',
    rules: [
      'Maintain a balanced, warm, and concise tone.',
      'Use contractions naturally (we’re, it’s).',
      'Focus on one concrete value point after a soft opening.',
      'Structure: Opening, Value, Soft CTA.'
    ]
  },
  'formal': {
    name: 'Formal',
    rules: [
      'Maintain a precise and respectful tone; avoid contractions.',
      'Use formal sentence structure and vocabulary.',
      'Structure: Direct Opening, Structured Value Proposition, Direct Call-to-Action (CTA).'
    ]
  },
  'friendly': {
    name: 'Friendly',
    rules: [
      'Maintain a light, upbeat, and accessible tone; use simple language.',
      'Use short, punchy sentences and break up paragraphs often.',
      'Start with a quick, easy-to-read personal observation.',
      'Structure: Short Personalization, Quick Benefit Summary, Low-friction Invitation/CTA.'
    ]
  },
  'data-driven': {
    name: 'Data-Driven',
    rules: [
      'Lead with 1 metric or quantified outcome.',
      'Prioritize evidence and numbers over subjective claims.',
      'CTA focused on evaluating impact or a quick diagnostic.'
    ]
  },
  'story': {
    name: 'Storytelling',
    rules: [
      'Open with a 1–2 sentence vignette that mirrors the pain or a shared challenge.',
      'Bridge the story to the value in concrete terms.',
      'CTA invites a discussion to explore the fit of the solution.'
    ]
  },
  'challenger': {
    name: 'Challenger',
    rules: [
      'Challenge the status quo respectfully with 1 insight.',
      'Be crisp and avoid hype.',
      'CTA proposes a brief walk-through of a different approach.'
    ]
  }
};

function toneBlock(tone) {
  const key = tone && TONE_PRESETS[tone] ? tone : 'conversational-professional';
  const t = TONE_PRESETS[key];
  return `Tone: ${t.name}
Style rules:
- ${t.rules.join('\n- ')}`;
}

function baseGuards(maxWords) {
  return `Quality & guardrails
- Keep body under ${maxWords} words.
- 2–3 short paragraphs, one clear CTA.
- Do NOT invent metrics. Only use numbers from the input or the facts whitelist.
- Remove filler and hype (“industry-leading”, “cutting-edge”, “guaranteed”, “100%”).
- US English. Output MUST be valid JSON.`;
}

>>>>>>> 42e76a2 (Final working logic with 11 Personas and Refinement Fix)
function reqField(obj, field, msg) {
  if (!obj[field] || String(obj[field]).trim().length === 0) {
    throw new Error(msg || `Missing field: ${field}`);
  }
}

function wordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

<<<<<<< HEAD
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
=======
async function llmJson({ system, user, n = 1, temperature = Number(TEMPERATURE) }) {
  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      top_p: 1,
      n,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Upstream error ${r.status}: ${t}`);
  }
  const data = await r.json();
  const outs = [];
  for (const choice of data?.choices ?? []) {
    const raw = choice?.message?.content ?? '';
    try {
      outs.push(JSON.parse(raw));
    } catch {
      const m = String(raw).match(/\{[\s\S]*\}/);
      outs.push(m ? JSON.parse(m[0]) : {});
    }
  }
  return outs;
}

// ---- Generate new email (multiple variants + competitor analysis) ----
app.post('/generate', async (req, res) => {
  try {
    const {
      roleIndustry = req.body.roleIndustry || '',
      painPoint = req.body.painPoint || '',
      valueProp = req.body.valueProp || '',
      proof = req.body.proof || '',
      ctaStyle = req.body.ctaStyle || 'soft_call',
      tone = req.body.tone || 'conversational-professional',
      maxWords = Number(req.body.maxWords || 150),
      variants = 1
    } = req.body || {};
    
    if (!roleIndustry || !painPoint || !valueProp) {
      throw new Error('Please provide roleIndustry, painPoint, and valueProp.');
    }

    let personaContext = '';
    const personaData = PERSONA_KNOWLEDGE[roleIndustry];
    if (personaData) {
      personaContext = `
Specific Persona Context (${roleIndustry}):
- Primary Goal: ${personaData.goals.join('; ')}
- Biggest Pain: ${personaData.pain_points.join('; ')}
- Messaging Themes: ${personaData.messaging_themes.join('; ')}
(Crucially, use these themes to inform the tone and structure of the email, prioritizing competitor insight if applicable.)
`;
    }

    const system = `${toneBlock(tone)}${baseGuards(maxWords)}
Return JSON with keys: subject, opening_line, body, cta, competitor_analysis.`;
    
    const user = `
Prospect context:
- Role & industry: ${roleIndustry}
- Pain point: ${painPoint}
- Value proposition: ${valueProp}
- Proof (optional): ${proof || '—'}

CTA style: ${ctaStyle === 'firm_call' ? 'Firm' : 'Soft'}

Competitor Context:
- Your product: Canopy
- Competitors: ${COMPETITOR_LIST}

${personaContext.trim()}

Instructions for AI Personalization Panel:
1. Analyze the 'Pain point' and **ONLY** the competitor named in 'Proof (optional)'.
2. Provide a 2-3 sentence analysis showing why the selected competitor is inadequate for this specific pain point. **DO NOT mention other competitors.**
3. Provide a 2-3 sentence statement explaining how Canopy uniquely solves the pain point better than the selected competitor.
4. Return this focused analysis in the 'competitor_analysis' field of the JSON.

JSON schema:
{
  "subject": "<= 9 words, truthful, no clickbait",
  "opening_line": "1 sentence personalized opener, no name if not provided",
  "body": "2–3 short paragraphs, <= ${maxWords} words total",
  "cta": "one sentence CTA",
  "competitor_analysis": "2-3 sentences of competitor critique + 2-3 sentences of Canopy advantage."
}
`.trim();

    const temp = Math.min(0.9, Number(TEMPERATURE) + (variants > 1 ? 0.15 : 0));

    const outs = await llmJson({ system, user, n: Math.max(1, Math.min(3, Number(variants))), temperature: temp });

    const banned = [/industry[-\s]?leading/i, /cutting[-\s]?edge/i, /\bguarantee(d)?\b/i, /\b100%\b/i];
    const emails = outs
      .map((e) => ({
        subject: e?.subject ?? '',
        opening_line: e?.opening_line ?? '',
        body: e?.body ?? '',
        cta: e?.cta ?? '',
        competitor_analysis: e?.competitor_analysis ?? '',
      }))
      .filter((e) => {
        const text = `${e.subject}\n${e.opening_line}\n${e.body}\n${e.cta}`;
        if (banned.some((rx) => rx.test(text))) return false;
        const words = (e.body || '').trim().split(/\s+/).filter(Boolean).length;
        return words <= maxWords;
      });

    if (!emails.length) throw new Error('Model returned no valid variants. Try again.');

    res.json({ ok: true, model: MODEL, emails });
>>>>>>> 42e76a2 (Final working logic with 11 Personas and Refinement Fix)
  } catch (err) {
    res.status(400).json({ ok: false, error: String(err?.message || err) });
  }
});

<<<<<<< HEAD
app.listen(PORT, () => {
=======
// --- API Endpoint for REWRITE/REFINEMENT ---
app.post('/rewrite', async (req, res) => {
  const { prompt, email_text } = req.body || {};

  if (!prompt || !email_text) {
    return res.json({ ok: false, error: 'Missing refinement prompt or email content.' });
  }

  const rewritePrompt = `
  You are an expert sales email editor.
  Your task is to take the provided existing email content and rewrite it based on the user's refinement prompt.

  ---
  Existing Email Content:
  ${email_text}
  ---
  
  Refinement Prompt: "${prompt}"

  ---
  Instructions:
  1. Apply the refinement requested by the user.
  2. Analyze the 'Refinement Prompt' and extract the specific target role or persona (e.g., 'Director of Operations (25-50 Firm)', 'Auditor', 'IT Leader / Tech Partner'). If no persona is mentioned, return the original persona from the email.
  3. The final output MUST be in the following JSON format. Do not use any other text.

  Required Output Format:
  {
    "rewritten_text": "[The full, newly written email in the required plain text format]",
    "new_persona": "[The specific persona identified from the prompt (e.g., 'Owner / Partner (4-9 Firm)')]"
  }
  `;

  try {
    const r = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an email editor. Rewrite the email and extract the persona. Output must be in the required JSON format only.' },
          { role: 'user', content: rewritePrompt }
        ]
      })
    });
    
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(`Upstream error (${r.status}): ${t}`);
    }

    const data = await r.json();
    const result = data?.choices?.[0]?.message?.content || '{}';
    let outputJson;

    try {
        outputJson = JSON.parse(result);
    } catch {
        const match = String(result).match(/\{[\s\S]*\}/);
        outputJson = match ? JSON.parse(match[0]) : {};
    }
    
    res.json({ ok: true, 
               rewritten_text: outputJson.rewritten_text || '', 
               new_persona: outputJson.new_persona || '' 
    });

  } catch (error) {
    console.error('AI Rewrite Error:', error.message);
    res.status(500).json({ ok: false, error: String(error?.message || error) });
  }
});


app.listen(Number(PORT), () => {
>>>>>>> 42e76a2 (Final working logic with 11 Personas and Refinement Fix)
  console.log(`AI Email Generator server listening on http://localhost:${PORT}`);
});
