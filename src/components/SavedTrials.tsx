import { officialUrl } from "../api/ctgov";
import { formatPhases, formatStatus } from "../lib/format";
import { t, useLang } from "../lib/i18n";
import { href } from "../lib/router";
import { removeSaved, useSavedTrials } from "../state/saved";

export function SavedTrials() {
  useLang();
  const saved = useSavedTrials();

  if (saved.length === 0) {
    return (
      <div className="empty-state">
        <h2>{t("No saved trials yet")}</h2>
        <p className="hint">
          When a trial looks promising, tap <strong>☆ Save</strong>. Your list lives only on this
          device and makes a tidy printout to bring to your next appointment.
        </p>
        <a className="btn btn-primary" href="#/">{t("Start a search")}</a>
      </div>
    );
  }

  return (
    <div className="saved">
      <div className="saved-header">
        <h2>{t("Your saved trials")}</h2>
        <button className="btn" onClick={() => window.print()}>
          {t("🖨 Print for your appointment")}
        </button>
      </div>
      <p className="hint no-print">
        Stored only on this device. Print this page — it includes each trial's registry ID so your
        doctor can look them up instantly.
      </p>

      <div className="results-list">
        {saved.map((trial) => (
          <article key={trial.nctId} className="card trial-card">
            <div className="trial-card-badges">
              <span className="badge badge-muted">{trial.nctId}</span>
              {trial.overallStatus && <span className="badge">{formatStatus(trial.overallStatus)}</span>}
              {formatPhases(trial.phases) && <span className="badge">{formatPhases(trial.phases)}</span>}
            </div>
            <h3 className="trial-card-title">
              <a href={href(`/trial/${trial.nctId}`)}>{trial.briefTitle}</a>
            </h3>
            <p className="trial-card-meta">
              {trial.conditions.slice(0, 3).join(" · ")}
              {trial.leadSponsor ? ` — ${trial.leadSponsor}` : ""}
            </p>
            <p className="print-only">Official record: {officialUrl(trial.nctId)}</p>
            <div className="trial-card-footer no-print">
              <a href={href(`/trial/${trial.nctId}`)}>{t("View details")}</a>
              <button className="btn btn-small" onClick={() => removeSaved(trial.nctId)}>
                {t("Remove")}
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
