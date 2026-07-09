/**
 * Saved trials, persisted in localStorage only. Nothing here ever leaves the
 * user's device — that privacy guarantee is a core product promise.
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "beacon.savedTrials.v1";

export interface SavedTrial {
  nctId: string;
  briefTitle: string;
  conditions: string[];
  phases: string[];
  overallStatus?: string;
  leadSponsor?: string;
  savedAt: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: SavedTrial[] | null = null;

function load(): SavedTrial[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as SavedTrial[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function persist(next: SavedTrial[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked; keep the in-memory copy so the session works.
  }
  listeners.forEach((l) => l());
}

export function getSavedTrials(): SavedTrial[] {
  return load();
}

export function isSaved(nctId: string): boolean {
  return load().some((t) => t.nctId === nctId);
}

export function toggleSaved(trial: Omit<SavedTrial, "savedAt">) {
  const current = load();
  if (current.some((t) => t.nctId === trial.nctId)) {
    persist(current.filter((t) => t.nctId !== trial.nctId));
  } else {
    persist([{ ...trial, savedAt: new Date().toISOString() }, ...current]);
  }
}

export function removeSaved(nctId: string) {
  persist(load().filter((t) => t.nctId !== nctId));
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSavedTrials(): SavedTrial[] {
  return useSyncExternalStore(subscribe, getSavedTrials, () => []);
}
