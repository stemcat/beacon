/**
 * Shared helpers for Beacon's minimal backend (Vercel Functions (Node runtime)).
 *
 * Design constraints, in order: (1) the core product stays zero-data — these
 * endpoints exist only for strictly opt-in email alerts and for the AI
 * pre-screen, which reads ONLY public registry text, never patient input;
 * (2) every external service is optional — endpoints degrade to 503
 * "not configured" instead of crashing when env vars are absent.
 *
 * Env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (storage),
 * RESEND_API_KEY, ALERTS_FROM_EMAIL (email), ANTHROPIC_API_KEY (+ optional
 * PRESCREEN_MODEL) for the pre-screen, CRON_SECRET (cron auth).
 */


declare const process: { env: Record<string, string | undefined> };

export const env = (name: string): string | undefined => process.env[name];

/**
 * Adapt a web-standard (Request → Response) handler to Vercel's classic
 * Node function signature — plain Vercel projects don't support web
 * handlers on the Node runtime.
 */
export function asVercel(h: (req: Request) => Promise<Response>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: any, res: any): Promise<void> => {
    const proto = req.headers["x-forwarded-proto"] ?? "https";
    const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers as Record<string, string | string[]>)) {
      headers.set(k, Array.isArray(v) ? v.join(", ") : String(v));
    }
    const method: string = req.method ?? "GET";
    const body =
      method === "GET" || method === "HEAD"
        ? undefined
        : typeof req.body === "string"
          ? req.body
          : req.body != null
            ? JSON.stringify(req.body)
            : undefined;
    const response = await h(new Request(`${proto}://${host}${req.url}`, { method, headers, body }));
    res.statusCode = response.status;
    response.headers.forEach((value: string, key: string) => res.setHeader(key, value));
    res.end(new Uint8Array(await response.arrayBuffer()));
  };
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

export function html(body: string, status = 200): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Beacon</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#faf9f6;color:#1f2933;display:grid;place-items:center;min-height:90vh;margin:0;padding:20px;text-align:center;line-height:1.6}div{max-width:480px}a{color:#0f766e}</style></head><body><div>${body}</div></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}

// ---------- Upstash Redis (REST, no SDK) ----------

export function redisConfigured(): boolean {
  return Boolean(env("UPSTASH_REDIS_REST_URL") && env("UPSTASH_REDIS_REST_TOKEN"));
}

export async function redis(command: (string | number)[]): Promise<unknown> {
  const res = await fetch(env("UPSTASH_REDIS_REST_URL")!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("UPSTASH_REDIS_REST_TOKEN")!}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  const data = (await res.json()) as { result: unknown };
  return data.result;
}

/** Simple fixed-window daily rate limit per key. Fails open if Redis is down. */
export async function rateLimit(bucket: string, key: string, limit: number): Promise<boolean> {
  if (!redisConfigured()) return true;
  try {
    const day = new Date().toISOString().slice(0, 10);
    const k = `rl:${bucket}:${key}:${day}`;
    const count = (await redis(["INCR", k])) as number;
    if (count === 1) await redis(["EXPIRE", k, 86_400]);
    return count <= limit;
  } catch {
    return true;
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

// ---------- Email via Resend ----------

export function emailConfigured(): boolean {
  return Boolean(env("RESEND_API_KEY") && redisConfigured());
}

export async function sendEmail(to: string, subject: string, htmlBody: string, replyTo?: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")!}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env("ALERTS_FROM_EMAIL") ?? "Beacon <alerts@beacontrials.ca>",
      to: [to],
      subject,
      html: htmlBody,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}

// ---------- Alert subscriptions ----------

export interface AlertSub {
  email: string;
  cond: string;
  lat?: number;
  lng?: number;
  loc?: string;
  radius?: number;
  lang: "en" | "fr" | "es";
  confirmed: boolean;
  knownIds: string[];
  createdAt: string;
  lastChecked: string;
}

export const subKey = (token: string) => `sub:${token}`;
export const SUBS_SET = "subs";

export async function getSub(token: string): Promise<AlertSub | null> {
  const raw = (await redis(["GET", subKey(token)])) as string | null;
  return raw ? (JSON.parse(raw) as AlertSub) : null;
}

export async function putSub(token: string, sub: AlertSub): Promise<void> {
  await redis(["SET", subKey(token), JSON.stringify(sub)]);
  await redis(["SADD", SUBS_SET, token]);
}

export async function deleteSub(token: string): Promise<void> {
  await redis(["DEL", subKey(token)]);
  await redis(["SREM", SUBS_SET, token]);
}

// ---------- Registry (server-side, same public API the client uses) ----------

export async function fetchRecruitingIds(sub: Pick<AlertSub, "cond" | "lat" | "lng" | "radius">): Promise<string[]> {
  const q = new URLSearchParams();
  q.set("query.cond", sub.cond);
  q.set("filter.overallStatus", "RECRUITING,NOT_YET_RECRUITING");
  if (sub.lat != null && sub.lng != null && sub.radius) {
    q.set("filter.geo", `distance(${sub.lat.toFixed(4)},${sub.lng.toFixed(4)},${sub.radius}mi)`);
  }
  q.set("fields", "NCTId");
  q.set("pageSize", "200");
  const res = await fetch(`https://clinicaltrials.gov/api/v2/studies?${q}`);
  if (!res.ok) throw new Error(`Registry error ${res.status}`);
  const data = (await res.json()) as { studies?: Array<{ protocolSection?: { identificationModule?: { nctId?: string } } }> };
  return (data.studies ?? []).map((s) => s.protocolSection?.identificationModule?.nctId).filter(Boolean) as string[];
}
