/**
 * Client side of the AI pre-screen. The questionnaire is generated
 * server-side from the trial's PUBLIC criteria only; the patient's answers
 * never leave this module — matching happens right here in the browser.
 */

export interface PreScreenItem {
  question: string;
  kind: "inclusion" | "exclusion";
  yesMeans: "meets" | "conflicts";
  criterion: string;
}

export type PreScreenAnswer = "yes" | "no" | "unsure";
export type ItemStatus = "ok" | "concern" | "unsure";

export async function fetchQuestionnaire(nct: string, lang: string): Promise<PreScreenItem[]> {
  const res = await fetch(`/api/prescreen?nct=${encodeURIComponent(nct)}&lang=${encodeURIComponent(lang)}`);
  if (res.status === 503) throw new Error("not_configured");
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error("failed");
  const data = (await res.json()) as { items?: PreScreenItem[] };
  if (!Array.isArray(data.items)) throw new Error("failed");
  return data.items.filter(
    (i) =>
      typeof i.question === "string" &&
      (i.kind === "inclusion" || i.kind === "exclusion") &&
      (i.yesMeans === "meets" || i.yesMeans === "conflicts"),
  );
}

/** How one answered question relates to the criterion — never a verdict. */
export function itemStatus(item: PreScreenItem, answer: PreScreenAnswer): ItemStatus {
  if (answer === "unsure") return "unsure";
  const meets = answer === "yes" ? item.yesMeans === "meets" : item.yesMeans === "conflicts";
  return meets ? "ok" : "concern";
}

export interface PreScreenSummary {
  answered: number;
  total: number;
  ok: number;
  concerns: number;
  unsure: number;
  concernItems: PreScreenItem[];
  unsureItems: PreScreenItem[];
}

export function summarize(items: PreScreenItem[], answers: Record<number, PreScreenAnswer>): PreScreenSummary {
  const s: PreScreenSummary = {
    answered: 0, total: items.length, ok: 0, concerns: 0, unsure: 0,
    concernItems: [], unsureItems: [],
  };
  items.forEach((item, i) => {
    const a = answers[i];
    if (!a) return;
    s.answered++;
    const status = itemStatus(item, a);
    if (status === "ok") s.ok++;
    else if (status === "concern") {
      s.concerns++;
      s.concernItems.push(item);
    } else {
      s.unsure++;
      s.unsureItems.push(item);
    }
  });
  return s;
}

// ---------- localStorage persistence (device-only, like everything else) ----------

const STORAGE_KEY = "beacon.prescreen.v1";

export function loadAnswers(nctId: string): Record<number, PreScreenAnswer> {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, Record<number, PreScreenAnswer>>;
    return all[nctId] ?? {};
  } catch {
    return {};
  }
}

export function saveAnswers(nctId: string, answers: Record<number, PreScreenAnswer>) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    all[nctId] = answers;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable — answers survive in component state for the session.
  }
}
