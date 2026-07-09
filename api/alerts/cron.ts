/**
 * GET /api/alerts/cron — daily job (vercel.json crons): for each confirmed
 * subscription, re-run the watched search, diff trial IDs, email new ones.
 * Vercel authenticates cron invocations with `Authorization: Bearer CRON_SECRET`.
 */

import {
  deleteSub,
  emailConfigured,
  env,
  fetchRecruitingIds,
  getSub,
  json,
  putSub,
  redis,
  sendEmail,
  SUBS_SET,
  type AlertSub,
} from "../_shared";

export const config = { runtime: "edge" };

const T = {
  en: {
    subject: (n: number, cond: string) => `${n} new clinical trial${n === 1 ? "" : "s"} for ${cond}`,
    intro: (cond: string, where: string) => `New trials are recruiting for <strong>${cond}</strong>${where}:`,
    where: (loc: string) => ` near ${loc}`,
    view: "View in plain language",
    unsub: "Unsubscribe from this alert",
    footer: "Beacon · beacontrials.ca · not medical advice — always confirm details with the study team.",
  },
  fr: {
    subject: (n: number, cond: string) => `${n} nouvel${n === 1 ? " essai clinique" : "s essais cliniques"} pour ${cond}`,
    intro: (cond: string, where: string) => `De nouveaux essais recrutent pour <strong>${cond}</strong>${where} :`,
    where: (loc: string) => ` près de ${loc}`,
    view: "Voir en langage clair",
    unsub: "Se désabonner de cette alerte",
    footer: "Beacon · beacontrials.ca · ne constitue pas un avis médical — confirmez toujours les détails avec l'équipe de l'étude.",
  },
  es: {
    subject: (n: number, cond: string) => `${n} nuevo${n === 1 ? " ensayo clínico" : "s ensayos clínicos"} para ${cond}`,
    intro: (cond: string, where: string) => `Nuevos ensayos están reclutando para <strong>${cond}</strong>${where}:`,
    where: (loc: string) => ` cerca de ${loc}`,
    view: "Ver en lenguaje sencillo",
    unsub: "Cancelar esta alerta",
    footer: "Beacon · beacontrials.ca · no es consejo médico — confirme siempre los detalles con el equipo del estudio.",
  },
};

async function fetchTitles(ids: string[]): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  if (ids.length === 0) return titles;
  const q = new URLSearchParams();
  q.set("filter.ids", ids.slice(0, 25).join(","));
  q.set("fields", "NCTId,BriefTitle");
  q.set("pageSize", "25");
  const res = await fetch(`https://clinicaltrials.gov/api/v2/studies?${q}`);
  if (!res.ok) return titles;
  const data = (await res.json()) as { studies?: Array<{ protocolSection?: { identificationModule?: { nctId?: string; briefTitle?: string } } }> };
  for (const s of data.studies ?? []) {
    const id = s.protocolSection?.identificationModule?.nctId;
    if (id) titles.set(id, s.protocolSection?.identificationModule?.briefTitle ?? id);
  }
  return titles;
}

export default async function handler(req: Request): Promise<Response> {
  const secret = env("CRON_SECRET");
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ error: "unauthorized" }, 401);
  }
  if (!emailConfigured()) return json({ error: "not_configured" }, 503);

  const base = env("BEACON_BASE_URL") ?? "https://beacontrials.ca";
  const tokens = ((await redis(["SMEMBERS", SUBS_SET])) as string[] | null) ?? [];
  let checked = 0, emailed = 0, purged = 0;

  for (const token of tokens) {
    try {
      const sub = await getSub(token);
      if (!sub) {
        await redis(["SREM", SUBS_SET, token]);
        continue;
      }
      // Purge unconfirmed subscriptions older than 7 days — double opt-in
      // means unconfirmed emails must not be retained indefinitely.
      if (!sub.confirmed) {
        if (Date.now() - new Date(sub.createdAt).getTime() > 7 * 86_400_000) {
          await deleteSub(token);
          purged++;
        }
        continue;
      }

      const ids = await fetchRecruitingIds(sub);
      checked++;
      const known = new Set(sub.knownIds);
      const fresh = ids.filter((id) => !known.has(id));

      const updated: AlertSub = {
        ...sub,
        knownIds: [...new Set([...sub.knownIds, ...ids])],
        lastChecked: new Date().toISOString(),
      };
      await putSub(token, updated);

      if (fresh.length === 0) continue;

      const t = T[sub.lang];
      const titles = await fetchTitles(fresh);
      const where = sub.loc && sub.radius ? t.where(sub.loc) : "";
      const items = fresh
        .slice(0, 25)
        .map(
          (id) =>
            `<li style="margin:10px 0"><strong>${titles.get(id) ?? id}</strong><br>
             <a href="${base}/#/trial/${id}">${t.view}</a> · <span style="color:#667">${id}</span></li>`,
        )
        .join("");
      const more = fresh.length > 25 ? `<p>+ ${fresh.length - 25} more — see them all at <a href="${base}">beacontrials.ca</a>.</p>` : "";

      await sendEmail(
        sub.email,
        t.subject(fresh.length, sub.cond),
        `<p>${t.intro(sub.cond, where)}</p><ul style="padding-left:18px">${items}</ul>${more}
         <p style="color:#667;font-size:13px">${t.footer}<br>
         <a href="${base}/api/alerts/unsubscribe?token=${token}">${t.unsub}</a></p>`,
      );
      emailed++;
    } catch {
      // One bad subscription must not break the rest of the run.
    }
  }

  return json({ ok: true, subscriptions: tokens.length, checked, emailed, purged });
}
