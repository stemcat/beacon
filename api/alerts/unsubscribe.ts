/** GET /api/alerts/unsubscribe?token=... — delete the subscription entirely. */

import { deleteSub, getSub, html, redisConfigured } from "../_shared.js";


export default async function handler(req: Request): Promise<Response> {
  if (!redisConfigured()) return html("<h2>Alerts aren't configured yet.</h2>", 503);
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const sub = token ? await getSub(token) : null;
  if (sub) await deleteSub(token);
  const fr = sub?.lang === "fr";
  return html(
    fr
      ? `<h2>Désabonnement effectué</h2><p>Cette alerte et votre courriel ont été supprimés de nos systèmes.</p><p><a href="https://beacontrials.ca">← Retour à Beacon</a></p>`
      : `<h2>Unsubscribed</h2><p>This alert and your email address have been deleted from our systems.</p><p><a href="https://beacontrials.ca">← Back to Beacon</a></p>`,
  );
}
