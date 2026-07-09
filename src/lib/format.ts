/** Formatting helpers for registry data (statuses, phases, ages, dates). */

import { getLang, t, tn } from "./i18n";
import { getUnit, milesToKm } from "./units";

const STATUS_LABELS: Record<string, string> = {
  RECRUITING: "Recruiting now",
  NOT_YET_RECRUITING: "Opening soon",
  ENROLLING_BY_INVITATION: "By invitation only",
  ACTIVE_NOT_RECRUITING: "Active, not recruiting",
  COMPLETED: "Completed",
  SUSPENDED: "Paused",
  TERMINATED: "Stopped early",
  WITHDRAWN: "Withdrawn",
  UNKNOWN: "Status unknown",
};

export function formatStatus(status: string | undefined): string {
  if (!status) return "Status unknown";
  return t(STATUS_LABELS[status] ?? titleCase(status));
}

export function statusTone(status: string | undefined): "good" | "warn" | "muted" {
  if (status === "RECRUITING") return "good";
  if (status === "NOT_YET_RECRUITING" || status === "ENROLLING_BY_INVITATION") return "warn";
  return "muted";
}

export function formatPhases(phases: string[] | undefined): string | null {
  if (!phases || phases.length === 0) return null;
  const nums = phases
    .map((p) => p.replace(/^(EARLY_)?PHASE/, "").replace(/_/g, "/"))
    .filter((p) => p !== "NA");
  if (nums.length === 0) return null;
  const early = phases.some((p) => p.startsWith("EARLY_"));
  return `${early ? "Early " : ""}Phase ${nums.join("/")}`;
}

/** Parse registry age strings like "18 Years", "6 Months", "N/A" into years. */
export function parseAgeYears(age: string | undefined): number | null {
  if (!age) return null;
  const m = age.match(/^([\d.]+)\s*(year|month|week|day|hour|minute)s?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  switch (m[2].toLowerCase()) {
    case "year":
      return n;
    case "month":
      return n / 12;
    case "week":
      return n / 52;
    default:
      return n / 365;
  }
}

export function formatAgeRange(min: string | undefined, max: string | undefined): string {
  const lo = parseAgeYears(min);
  const hi = parseAgeYears(max);
  if (lo == null && hi == null) return t("All ages");
  if (lo != null && hi == null) return t("{a} and older", { a: formatAgeValue(min!) });
  if (lo == null && hi != null) return t("Up to {a}", { a: formatAgeValue(max!) });
  return t("{a} to {b}", { a: formatAgeValue(min!), b: formatAgeValue(max!) });
}

function formatAgeValue(age: string): string {
  return age.replace(/\s+Years?$/i, "").trim() + (/year/i.test(age) ? "" : ` ${age.split(/\s+/).slice(1).join(" ").toLowerCase()}`);
}

export function formatSex(sex: string | undefined): string {
  if (sex === "MALE") return t("Men");
  if (sex === "FEMALE") return t("Women");
  return t("All sexes");
}

const MONTHS: Record<string, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  es: ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."],
};

/** "2023-10-13" or "2023-10" -> "Oct 2023" (localized month). */
export function formatDate(date: string | undefined): string | null {
  if (!date) return null;
  const m = date.match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return date;
  const months = MONTHS[getLang()] ?? MONTHS.en;
  return m[2] ? `${months[parseInt(m[2], 10) - 1]} ${m[1]}` : m[1];
}

export function formatDistance(miles: number): string {
  if (getUnit() === "km") {
    const km = milesToKm(miles);
    if (km < 1) return t("under 1 km");
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
  }
  if (miles < 1) return t("under 1 mi");
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function titleCase(snake: string): string {
  return snake
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatEnrollment(count: number | undefined): string | null {
  if (!count) return null;
  return tn(count, "{n} participant", "{n} participants");
}
