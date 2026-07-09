/** Formatting helpers for registry data (statuses, phases, ages, dates). */

import { t } from "./i18n";

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
  if (lo == null && hi == null) return "All ages";
  if (lo != null && hi == null) return `${formatAgeValue(min!)} and older`;
  if (lo == null && hi != null) return `Up to ${formatAgeValue(max!)}`;
  return `${formatAgeValue(min!)} to ${formatAgeValue(max!)}`;
}

function formatAgeValue(age: string): string {
  return age.replace(/\s+Years?$/i, "").trim() + (/year/i.test(age) ? "" : ` ${age.split(/\s+/).slice(1).join(" ").toLowerCase()}`);
}

export function formatSex(sex: string | undefined): string {
  if (sex === "MALE") return "Men";
  if (sex === "FEMALE") return "Women";
  return "All sexes";
}

/** "2023-10-13" or "2023-10" -> "Oct 2023". */
export function formatDate(date: string | undefined): string | null {
  if (!date) return null;
  const m = date.match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return date;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return m[2] ? `${months[parseInt(m[2], 10) - 1]} ${m[1]}` : m[1];
}

export function formatDistance(miles: number): string {
  if (miles < 1) return "under 1 mi";
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
  return `${count.toLocaleString()} participant${count === 1 ? "" : "s"}`;
}
