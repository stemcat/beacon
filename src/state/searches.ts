/**
 * Watched searches: privacy-preserving "alerts". The search definition and
 * the set of already-seen trial IDs live in localStorage; on revisit, Beacon
 * re-runs each watched search in the browser and diffs the IDs. No server
 * ever knows what anyone is watching.
 */

import { useSyncExternalStore } from "react";
import { searchStudyIds } from "../api/ctgov";
import { expandCondition } from "../lib/conditions";

export interface WatchedSearch {
  id: string;
  cond: string;
  lat?: number;
  lng?: number;
  loc?: string;
  radius?: number;
  age?: string;
  sex?: string;
  knownIds: string[];
  newIds: string[];
  lastChecked: string;
  createdAt: string;
}

const STORAGE_KEY = "beacon.watchedSearches.v1";
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // re-check at most every 6 hours

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: WatchedSearch[] | null = null;

function load(): WatchedSearch[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function persist(next: WatchedSearch[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable; keep in-memory state for the session.
  }
  listeners.forEach((l) => l());
}

export function watchKey(params: { cond: string; lat?: string | null; lng?: string | null; radius?: string | null }): string {
  return [params.cond.toLowerCase().trim(), params.lat ?? "", params.lng ?? "", params.radius ?? ""].join("|");
}

export function isWatched(key: string): boolean {
  return load().some((w) => w.id === key);
}

export async function watchSearch(params: {
  cond: string;
  lat?: string | null;
  lng?: string | null;
  loc?: string | null;
  radius?: string | null;
  age?: string | null;
  sex?: string | null;
}): Promise<void> {
  const id = watchKey(params);
  if (isWatched(id)) return;
  let knownIds: string[] = [];
  try {
    knownIds = await searchStudyIds({
      condition: expandCondition(params.cond).query,
      lat: params.lat ? parseFloat(params.lat) : undefined,
      lng: params.lng ? parseFloat(params.lng) : undefined,
      radiusMiles: params.radius ? parseInt(params.radius, 10) : undefined,
    });
  } catch {
    // Baseline fetch failed; start empty — the next check will fill it.
  }
  const now = new Date().toISOString();
  persist([
    {
      id,
      cond: params.cond,
      lat: params.lat ? parseFloat(params.lat) : undefined,
      lng: params.lng ? parseFloat(params.lng) : undefined,
      loc: params.loc ?? undefined,
      radius: params.radius ? parseInt(params.radius, 10) : undefined,
      age: params.age ?? undefined,
      sex: params.sex ?? undefined,
      knownIds,
      newIds: [],
      lastChecked: now,
      createdAt: now,
    },
    ...load(),
  ]);
}

export function unwatchSearch(id: string) {
  persist(load().filter((w) => w.id !== id));
}

/** Merge new IDs into known and clear the badge (user has seen the results). */
export function markSearchSeen(id: string) {
  persist(
    load().map((w) =>
      w.id === id ? { ...w, knownIds: [...new Set([...w.knownIds, ...w.newIds])], newIds: [] } : w,
    ),
  );
}

let checking = false;

/** Re-run stale watched searches and diff for new trials. Throttled to 6h. */
export async function checkWatchedSearches(force = false): Promise<void> {
  if (checking) return;
  const now = Date.now();
  const stale = load().filter(
    (w) => force || now - new Date(w.lastChecked).getTime() > CHECK_INTERVAL_MS,
  );
  if (stale.length === 0) return;
  checking = true;
  try {
    for (const w of stale) {
      try {
        const ids = await searchStudyIds({
          condition: expandCondition(w.cond).query,
          lat: w.lat,
          lng: w.lng,
          radiusMiles: w.radius,
        });
        const known = new Set(w.knownIds);
        const fresh = ids.filter((id) => !known.has(id));
        persist(
          load().map((x) =>
            x.id === w.id
              ? {
                  ...x,
                  newIds: [...new Set([...x.newIds, ...fresh])],
                  lastChecked: new Date().toISOString(),
                }
              : x,
          ),
        );
      } catch {
        // Network hiccup on one search shouldn't break the others.
      }
    }
  } finally {
    checking = false;
  }
}

export function useWatchedSearches(): WatchedSearch[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => [],
  );
}
