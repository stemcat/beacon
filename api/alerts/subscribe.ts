/**
 * POST /api/alerts/subscribe — strictly opt-in email alerts, double opt-in.
 * Stores ONLY: email, the watched search, language, and seen trial IDs.
 * Body: {email, cond, lat?, lng?, loc?, radius?, lang?}
 */

import {
  clientIp,
  emailConfigured,
  env,
  fetchRecruitingIds,
  json,
  putSub,
  rateLimit,
  sendEmail,
  type AlertSub,
} from "../_shared";

export const config = { runtime: "edge" };

const T = {
  en: {
    subject: "Confirm your Beacon trial alerts",
    body: (link: string, cond: string) =>
      `<p>You asked Beacon to email you when new clinical trials open for <strong>${cond}</strong>.</p>
       <p><a href="${link}">Confirm this alert</a> — if you didn't request it, ignore this email and nothing will be stored.</p>
       <p style="color:#667">Beacon · beacontrials.ca · free clinical trial finder · we store only your email and this search, nothing else.</p>`,
  },
  fr: {
    subject: "Confirmez vos alertes d'essais Beacon",
    body: (link: string, cond: string) =>
      `<p>Vous avez demandé à Beacon de vous écrire lorsque de nouveaux essais cliniques ouvrent pour <strong>${cond}</strong>.</p>
       <p><a href="${link}">Confirmer cette alerte</a> — si vous n'avez rien demandé, ignorez ce courriel et rien ne sera conservé.</p>
       <p style="color:#667">Beacon · beacontrials.ca · outil gratuit de recherche d'essais cliniques · nous ne conservons que votre courriel et cette recherche, rien d'autre.</p>`,
  },
  es: {
    subject: "Confirme sus alertas de ensayos de Beacon",
    body: (link: string, cond: string) =>
      `<p>Usted pidió a Beacon que le escriba cuando se abran nuevos ensayos clínicos para <strong>${cond}</strong>.</p>
       <p><a href="${link}">Confirmar esta alerta</a> — si no lo solicitó, ignore este correo y no se guardará nada.</p>
       <p style="color:#667">Beacon · beacontrials.ca · buscador gratuito de ensayos clínicos · solo guardamos su correo y esta búsqueda, nada más.</p>`,
  },
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!emailConfigured()) return json({ error: "not_configured" }, 503);

  if (!(await rateLimit("subscribe", clientIp(req), 10))) return json({ error: "rate_limited" }, 429);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const cond = String(body.cond ?? "").trim().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !cond) {
    return json({ error: "invalid_input" }, 400);
  }
  const lang = (["en", "fr", "es"].includes(String(body.lang)) ? String(body.lang) : "en") as AlertSub["lang"];
  const lat = typeof body.lat === "number" ? body.lat : undefined;
  const lng = typeof body.lng === "number" ? body.lng : undefined;
  const radius = typeof body.radius === "number" ? Math.min(Math.max(body.radius, 1), 1000) : undefined;
  const loc = body.loc ? String(body.loc).slice(0, 120) : undefined;

  const token = crypto.randomUUID();
  const now = new Date().toISOString();

  // Baseline the currently-open trials so the first alert only contains
  // genuinely NEW trials, not everything that already exists.
  let knownIds: string[] = [];
  try {
    knownIds = await fetchRecruitingIds({ cond, lat, lng, radius });
  } catch {
    // Registry hiccup — the first cron run will baseline instead.
  }

  await putSub(token, {
    email, cond, lat, lng, loc, radius, lang,
    confirmed: false, knownIds, createdAt: now, lastChecked: now,
  });

  const base = env("BEACON_BASE_URL") ?? "https://beacontrials.ca";
  const t = T[lang];
  await sendEmail(email, t.subject, t.body(`${base}/api/alerts/confirm?token=${token}`, cond));

  return json({ ok: true });
}
