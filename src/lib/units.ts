/**
 * Distance units. Canada (and most of the world) is metric; the US uses
 * miles. We infer the default from the browser locale — an on-device signal
 * that never leaves the browser (an IP-geolocation lookup would leak every
 * visitor's IP to a third party, which Beacon promises never to do) — and
 * let the user override with a persistent toggle.
 *
 * The registry API and all internal math stay in miles; only display
 * converts.
 */

import { useSyncExternalStore } from "react";

export type Unit = "km" | "mi";

const STORAGE_KEY = "beacon.unit";
const KM_PER_MILE = 1.60934;

/** Countries whose road distances are customarily in miles. */
const MILE_REGIONS = new Set(["US", "GB", "LR", "MM"]);

export function unitForLocale(locale: string): Unit {
  const region = locale.split("-")[1]?.toUpperCase();
  if (region) return MILE_REGIONS.has(region) ? "mi" : "km";
  // Regionless "en" most often means a US browser; anything else, metric.
  return locale.toLowerCase() === "en" ? "mi" : "km";
}

function detect(): Unit {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Unit | null;
    if (stored === "km" || stored === "mi") return stored;
  } catch { /* storage unavailable */ }
  if (typeof navigator === "undefined") return "mi";
  return unitForLocale(navigator.language || "en");
}

let current: Unit = detect();
const listeners = new Set<() => void>();

export function getUnit(): Unit {
  return current;
}

export function setUnit(unit: Unit) {
  current = unit;
  try {
    localStorage.setItem(STORAGE_KEY, unit);
  } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}

export function useUnit(): Unit {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => current,
  );
}

export function milesToKm(miles: number): number {
  return miles * KM_PER_MILE;
}

/** Round a miles radius to a friendly km label: 25→40, 100→160, 250→400. */
export function radiusKmLabel(miles: number): number {
  return Math.round(milesToKm(miles) / 10) * 10;
}
