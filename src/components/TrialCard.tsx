import type { Trial } from "../api/ctgov";
import { haversineMiles, type GeoPoint } from "../api/geocode";
import {
  formatAgeRange,
  formatDistance,
  formatPhases,
  formatSex,
  formatStatus,
  parseAgeYears,
  statusTone,
} from "../lib/format";
import { href } from "../lib/router";
import { isSaved, toggleSaved, useSavedTrials } from "../state/saved";

export function nearestSite(trial: Trial, from: GeoPoint | null) {
  if (!from) return null;
  let best: { miles: number; label: string } | null = null;
  for (const loc of trial.locations) {
    if (loc.lat == null || loc.lng == null) continue;
    const miles = haversineMiles(from, { lat: loc.lat, lng: loc.lng });
    if (!best || miles < best.miles) {
      const label = [loc.city, loc.state ?? loc.country].filter(Boolean).join(", ");
      best = { miles, label };
    }
  }
  return best;
}

/** Reasons this trial's requirements may not match the user's details. */
export function mismatchReasons(trial: Trial, age: number | null, sex: string): string[] {
  const reasons: string[] = [];
  if (age != null) {
    const min = parseAgeYears(trial.minimumAge);
    const max = parseAgeYears(trial.maximumAge);
    if ((min != null && age < min) || (max != null && age > max)) {
      reasons.push(`ages ${formatAgeRange(trial.minimumAge, trial.maximumAge).toLowerCase()}`);
    }
  }
  if (sex && trial.sex && trial.sex !== "ALL" && trial.sex !== sex) {
    reasons.push(`${formatSex(trial.sex).toLowerCase()} only`);
  }
  return reasons;
}

interface Props {
  trial: Trial;
  from: GeoPoint | null;
  age: number | null;
  sex: string;
  backParams: Record<string, string>;
}

export function TrialCard({ trial, from, age, sex, backParams }: Props) {
  useSavedTrials(); // re-render when saves change
  const phase = formatPhases(trial.phases);
  const site = nearestSite(trial, from);
  const mismatches = mismatchReasons(trial, age, sex);
  const saved = isSaved(trial.nctId);
  const summary = trial.briefSummary
    ? trial.briefSummary.length > 260
      ? trial.briefSummary.slice(0, 260).replace(/\s+\S*$/, "") + "…"
      : trial.briefSummary
    : null;

  return (
    <article className={`card trial-card ${mismatches.length ? "trial-card-dim" : ""}`}>
      <div className="trial-card-badges">
        <span className={`badge badge-${statusTone(trial.overallStatus)}`}>
          {formatStatus(trial.overallStatus)}
        </span>
        {phase && <span className="badge">{phase}</span>}
        {trial.studyType === "OBSERVATIONAL" && <span className="badge">Observational</span>}
        {site && <span className="badge badge-distance">📍 {formatDistance(site.miles)} — {site.label}</span>}
      </div>

      <h3 className="trial-card-title">
        <a href={href(`/trial/${trial.nctId}`, backParams)}>{trial.briefTitle}</a>
      </h3>

      {summary && <p className="trial-card-summary">{summary}</p>}

      {mismatches.length > 0 && (
        <p className="mismatch-note">
          ⚠️ May not match your details — this trial accepts {mismatches.join("; ")}.
        </p>
      )}

      <div className="trial-card-footer">
        <span className="trial-card-meta">
          {trial.conditions.slice(0, 3).join(" · ")}
          {trial.leadSponsor ? ` — ${trial.leadSponsor}` : ""}
        </span>
        <button
          className={`btn btn-small ${saved ? "btn-saved" : ""}`}
          onClick={() =>
            toggleSaved({
              nctId: trial.nctId,
              briefTitle: trial.briefTitle,
              conditions: trial.conditions,
              phases: trial.phases,
              overallStatus: trial.overallStatus,
              leadSponsor: trial.leadSponsor,
            })
          }
          aria-pressed={saved}
        >
          {saved ? "★ Saved" : "☆ Save"}
        </button>
      </div>
    </article>
  );
}
