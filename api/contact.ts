/**
 * POST /api/contact — relays the About-page contact form to Kevin's inbox
 * via Resend. Nothing is stored by Beacon; Reply-To is the sender, so
 * replying works naturally. Honeypot + per-IP rate limit against bots.
 */

import { asVercel, clientIp, emailConfigured, env, json, rateLimit, sendEmail } from "./_shared.js";

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!emailConfigured()) return json({ error: "not_configured" }, 503);

  if (!(await rateLimit("contact", clientIp(req), 5))) return json({ error: "rate_limited" }, 429);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  // Honeypot: real users never see this field; bots fill it. Pretend success.
  if (typeof body.website === "string" && body.website.trim() !== "") return json({ ok: true });

  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const message = String(body.message ?? "").trim().slice(0, 5000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 5) {
    return json({ error: "invalid_input" }, 400);
  }

  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  await sendEmail(
    env("CONTACT_TO_EMAIL") ?? "domonkevin@gmail.com",
    `Beacon contact — ${name || email}`,
    `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
     <p style="white-space:pre-wrap">${esc(message)}</p>
     <p style="color:#667;font-size:13px">Sent from the beacontrials.ca contact form. Reply to answer directly.</p>`,
    email,
  );

  return json({ ok: true });
}

export default asVercel(handler);
