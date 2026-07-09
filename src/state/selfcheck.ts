/**
 * Self-check marks on eligibility criteria ("true for me / not true / not
 * sure"), stored per trial in localStorage only. Criteria are keyed by a hash
 * of their text so marks survive re-renders but reset if the study team
 * rewrites a criterion — which is the safe behavior.
 */

import { useSyncExternalStore } from "react";

export type Mark = "yes" | "no" | "unsure";
export type TrialMarks = Record<string, Mark>;

const STORAGE_KEY = "beacon.selfcheck.v1";

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: Record<string, TrialMarks> | null = null;

export function criterionKey(text: string): string {
  const norm = text.toLowerCase().replace(/\s+/g, " ").trim();
  let h = 5381;
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function load(): Record<string, TrialMarks> {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

function persist(next: Record<string, TrialMarks>) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable; in-memory marks still work for the session.
  }
  listeners.forEach((l) => l());
}

export function setMark(nctId: string, key: string, mark: Mark | null) {
  const all = load();
  const trial: TrialMarks = { ...(all[nctId] ?? {}) };
  if (mark === null) delete trial[key];
  else trial[key] = mark;
  persist({ ...all, [nctId]: trial });
}

export function clearMarks(nctId: string) {
  const all = { ...load() };
  delete all[nctId];
  persist(all);
}

const EMPTY: TrialMarks = {};

export function useSelfCheck(nctId: string): TrialMarks {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => load()[nctId] ?? EMPTY,
    () => EMPTY,
  );
}
