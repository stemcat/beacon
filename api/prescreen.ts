/**
 * AI pre-screen questionnaire: GET /api/prescreen?nct=NCT01234567&lang=fr
 *
 * Privacy architecture — the model NEVER sees the patient. Its only input is
 * the trial's public eligibility text from ClinicalTrials.gov; it returns a
 * plain-language yes/no questionnaire. The patient's answers stay in their
 * browser, where the matching logic runs. Results are cached in Redis keyed
 * by a hash of the criteria text, so each trial is translated once per
 * language, ever — cost scales with unique trials viewed, not users.
 */

import Anthropic from "@anthropic-ai/sdk";
import { clientIp, env, json, rateLimit, redis, redisConfigured } from "./_shared.js";


const CACHE_VERSION = "v1";
const MAX_CRITERIA_CHARS = 20_000;
const DAILY_IP_LIMIT = 60;

const QUESTIONNAIRE_SCHEMA = {
  type: "object" as const,
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        required: ["question", "kind", "yesMeans", "criterion"],
        properties: {
          question: { type: "string" as const, description: "Plain-language yes/no question a patient can answer about themselves" },
          kind: { type: "string" as const, enum: ["inclusion", "exclusion"] },
          yesMeans: {
            type: "string" as const,
            enum: ["meets", "conflicts"],
            description: "Whether answering YES means the patient meets this criterion or conflicts with it",
          },
          criterion: { type: "string" as const, description: "Short quote or paraphrase of the original criterion this question checks" },
        },
      },
    },
  },
};

const LANG_NAMES: Record<string, string> = { en: "English", fr: "French (Canadian)", es: "Spanish" };

function systemPrompt(lang: string): string {
  return `You convert clinical trial eligibility criteria into a short plain-language questionnaire that a patient can answer about themselves at home.

Rules:
- Write each question in ${LANG_NAMES[lang] ?? "English"}, at the reading level of a nervous family member with no medical training. Expand or explain any unavoidable medical term in parentheses.
- Every question must be answerable yes/no by a typical patient from what they know about themselves (age, diagnosis, treatments received, pregnancy, other conditions, medications, ability to attend visits).
- SKIP criteria a patient cannot self-assess (lab values like ANC/creatinine thresholds, ECOG scores, imaging measurements, biomarker status they may not know) — the study team checks those. Do not invent questions for them.
- Set yesMeans correctly: for an inclusion criterion, YES usually means "meets"; for an exclusion criterion, YES usually means "conflicts". Phrase questions so this mapping is natural.
- At most 20 questions. Prefer the criteria most likely to determine eligibility.
- Neutral, warm, non-alarming tone. Never imply the patient is or is not eligible.`;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  if (!env("ANTHROPIC_API_KEY")) return json({ error: "not_configured" }, 503);

  const url = new URL(req.url);
  const nct = (url.searchParams.get("nct") ?? "").trim().toUpperCase();
  const lang = ["en", "fr", "es"].includes(url.searchParams.get("lang") ?? "") ? url.searchParams.get("lang")! : "en";
  if (!/^NCT\d{8}$/.test(nct)) return json({ error: "invalid_nct" }, 400);

  if (!(await rateLimit("prescreen", clientIp(req), DAILY_IP_LIMIT))) {
    return json({ error: "rate_limited" }, 429);
  }

  // Fetch the PUBLIC criteria text server-side (never anything about the user).
  const regRes = await fetch(
    `https://clinicaltrials.gov/api/v2/studies/${nct}?fields=EligibilityCriteria,Condition,BriefTitle`,
  );
  if (!regRes.ok) return json({ error: "trial_not_found" }, regRes.status === 404 ? 404 : 502);
  const study = (await regRes.json()) as {
    protocolSection?: {
      eligibilityModule?: { eligibilityCriteria?: string };
      conditionsModule?: { conditions?: string[] };
      identificationModule?: { briefTitle?: string };
    };
  };
  const criteria = study.protocolSection?.eligibilityModule?.eligibilityCriteria;
  if (!criteria) return json({ error: "no_criteria" }, 404);

  const cacheKey = `ps:${CACHE_VERSION}:${lang}:${nct}:${await sha256(criteria)}`;
  if (redisConfigured()) {
    try {
      const cached = (await redis(["GET", cacheKey])) as string | null;
      if (cached) return json({ nct, lang, cached: true, ...JSON.parse(cached) });
    } catch {
      // Cache unavailable — fall through to a live generation.
    }
  }

  const client = new Anthropic({ apiKey: env("ANTHROPIC_API_KEY")! });
  const model = env("PRESCREEN_MODEL") ?? "claude-opus-4-8";
  const conditions = study.protocolSection?.conditionsModule?.conditions?.slice(0, 5).join(", ") ?? "";

  const response = await client.messages.create({
    model,
    max_tokens: 6000,
    system: systemPrompt(lang),
    output_config: { format: { type: "json_schema", schema: QUESTIONNAIRE_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Trial ${nct} (${conditions}). Eligibility criteria:\n\n${criteria.slice(0, MAX_CRITERIA_CHARS)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") return json({ error: "generation_declined" }, 502);
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return json({ error: "generation_failed" }, 502);

  let payload: { items: unknown[] };
  try {
    payload = JSON.parse(textBlock.text) as { items: unknown[] };
  } catch {
    return json({ error: "generation_failed" }, 502);
  }

  if (redisConfigured()) {
    try {
      await redis(["SET", cacheKey, JSON.stringify(payload)]);
    } catch {
      // Best effort — next request regenerates.
    }
  }

  return json({ nct, lang, cached: false, ...payload });
}
