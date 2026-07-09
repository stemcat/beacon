import { officialUrl } from "../api/ctgov";
import { formatPhases, formatStatus } from "../lib/format";
import { href } from "../lib/router";
import { removeSaved, useSavedTrials } from "../state/saved";

export function SavedTrials() {
  const saved = useSavedTrials();

  if (saved.length === 0) {
    return (
      <div className="empty-state">
        <h2>No saved trials yet</h2>
        <p className="hint">
          When a trial looks promising, tap <strong>☆ Save</strong>. Your list lives only on this
          device and makes a tidy printout to bring to your next appointment.
        </p>
        <a className="btn btn-primary" href="#/">Start a search</a>
      </div>
    );
  }

  return (
    <div className="saved">
      <div className="saved-header">
        <h2>Your saved trials</h2>
        <button className="btn" onClick={() => window.print()}>
          🖨 Print for your appointment
        </button>
      </div>
      <p className="hint no-print">
        Stored only on this device. Print this page — it includes each trial's registry ID so your
        doctor can look them up instantly.
      </p>

      <div className="results-list">
        {saved.map((t) => (
          <article key={t.nctId} className="card trial-card">
            <div className="trial-card-badges">
              <span className="badge badge-muted">{t.nctId}</span>
              {t.overallStatus && <span className="badge">{formatStatus(t.overallStatus)}</span>}
              {formatPhases(t.phases) && <span className="badge">{formatPhases(t.phases)}</span>}
            </div>
            <h3 className="trial-card-title">
              <a href={href(`/trial/${t.nctId}`)}>{t.briefTitle}</a>
            </h3>
            <p className="trial-card-meta">
              {t.conditions.slice(0, 3).join(" · ")}
              {t.leadSponsor ? ` — ${t.leadSponsor}` : ""}
            </p>
            <p className="print-only">Official record: {officialUrl(t.nctId)}</p>
            <div className="trial-card-footer no-print">
              <a href={href(`/trial/${t.nctId}`)}>View details</a>
              <button className="btn btn-small" onClick={() => removeSaved(t.nctId)}>
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="print-only print-footer">
        <p>
          Printed from Beacon — a free clinical trial finder. Data source: ClinicalTrials.gov.
          This is informational only, not medical advice.
        </p>
      </div>
    </div>
  );
}
