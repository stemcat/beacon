/** GET /api/alerts/confirm?token=... — activate a pending alert (double opt-in). */

import { getSub, html, putSub, redisConfigured } from "../_shared";

export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  if (!redisConfigured()) return html("<h2>Alerts aren't configured yet.</h2>", 503);
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const sub = token ? await getSub(token) : null;
  if (!sub) {
    return html(
      `<h2>This link is no longer valid.</h2><p>The alert may already be removed. You can set up a new one any time at <a href="https://beacontrials.ca">beacontrials.ca</a>.</p>`,
      404,
    );
  }
  if (!sub.confirmed) await putSub(token, { ...sub, confirmed: true });
  const fr = sub.lang === "fr";
  return html(
    fr
      ? `<h2>✅ Alerte confirmée</h2><p>Nous vous écrirons lorsque de nouveaux essais ouvriront pour <strong>${sub.cond}</strong>. Chaque courriel contient un lien pour vous désabonner en un clic.</p><p><a href="https://beacontrials.ca">← Retour à Beacon</a></p>`
      : `<h2>✅ Alert confirmed</h2><p>We'll email you when new trials open for <strong>${sub.cond}</strong>. Every email includes a one-click unsubscribe link.</p><p><a href="https://beacontrials.ca">← Back to Beacon</a></p>`,
  );
}
