import { useEffect, useState } from "react";
import { getStudy, officialUrl, type Trial } from "../api/ctgov";
import { haversineMiles, type GeoPoint } from "../api/geocode";
import {
  formatAgeRange,
  formatDate,
  formatDistance,
  formatEnrollment,
  formatPhases,
  formatSex,
  formatStatus,
  statusTone,
  titleCase,
} from "../lib/format";
import { getLang, t, tn, useLang } from "../lib/i18n";
import { href, useRoute } from "../lib/router";
import { isSaved, toggleSaved, useSavedTrials } from "../state/saved";
import { Disclaimer } from "./Disclaimer";
import { EligibilityChecklist } from "./EligibilityChecklist";
import { AnnotatedText } from "./GlossaryTerm";

/** Questions worth asking, tailored to what the study record says. */
function doctorQuestions(trial: Trial): string[] {
  const q = [
    t("Based on my health history, do you think I might qualify for this trial?"),
    t("How would this trial compare to my current treatment options?"),
    t("What are the possible risks and side effects for someone like me?"),
    t("How often would I need to visit, and for how long?"),
  ];
  const criteria = (trial.eligibilityCriteria ?? "").toLowerCase();
  const summary = (trial.briefSummary ?? "").toLowerCase();
  if (summary.includes("placebo") || criteria.includes("placebo")) {
    q.push(t("Could I receive a placebo instead of the study treatment, and what happens if I do?"));
  }
  if (trial.phases.some((p) => p.includes("PHASE1"))) {
    q.push(t("This is an early-phase trial focused on safety — what is known about this treatment so far?"));
  }
  if (criteria.includes("washout")) {
    q.push(t("Would I need to stop any of my current medicines before joining, and is that safe for me?"));
  }
  q.push(t("If the treatment helps me, can I keep receiving it after the trial ends?"));
  q.push(t("What costs, if any, would I or my insurance be responsible for?"));
  return q;
}

export function TrialDetail({ nctId }: { nctId: string }) {
  useLang();
  const { params } = useRoute();
  useSavedTrials();
  const [trial, setTrial] = useState<Trial | null>(null);
  const [error, setError] = useState("");

  const lat = params.get("lat");
  const lng = params.get("lng");
  const from: GeoPoint | null = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;

  useEffect(() => {
    setTrial(null);
    setError("");
    getStudy(nctId)
      .then(setTrial)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load this study."));
  }, [nctId]);

  if (error) {
    return (
      <div className="empty-state">
        <p className="error" role="alert">{error}</p>
        <a className="btn" href="#/">Back to search</a>
      </div>
    );
  }
  if (!trial) return <div className="loading" role="status">{t("Loading study details…")}</div>;

  const phase = formatPhases(trial.phases);
  const saved = isSaved(trial.nctId);
  const recruitingSites = trial.locations.filter(
    (l) => !l.status || l.status === "RECRUITING" || l.status === "NOT_YET_RECRUITING",
  );
  const sites = (recruitingSites.length > 0 ? recruitingSites : trial.locations)
    .map((l) => ({
      ...l,
      miles: from && l.lat != null && l.lng != null ? haversineMiles(from, { lat: l.lat, lng: l.lng }) : null,
    }))
    .sort((a, b) => (a.miles ?? Infinity) - (b.miles ?? Infinity));

  const backHref = params.get("cond") ? href("/results", Object.fromEntries(params)) : "#/";

  return (
    <div className="trial-detail">
      <a href={backHref} className="back-link">{t("← Back to results")}</a>

      <div className="trial-card-badges">
        <span className={`badge badge-${statusTone(trial.overallStatus)}`}>{formatStatus(trial.overallStatus)}</span>
        {phase && <span className="badge">{phase}</span>}
        {trial.studyType && <span className="badge">{t(titleCase(trial.studyType))}</span>}
        <span className="badge badge-muted">{trial.nctId}</span>
      </div>

      <h2 className="trial-title">{trial.briefTitle}</h2>
      <p className="trial-sponsor">
        {t("Run by")} {trial.leadSponsor ?? t("unknown sponsor")}
        {trial.startDate ? ` · ${t("started")} ${formatDate(trial.startDate)}` : ""}
        {trial.lastUpdateDate ? ` · ${t("updated")} ${formatDate(trial.lastUpdateDate)}` : ""}
      </p>

      <div className="trial-actions">
        <button
          className={`btn ${saved ? "btn-saved" : "btn-primary"}`}
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
          {saved ? t("★ Saved") : t("☆ Save this trial")}
        </button>
        <a className="btn" href={officialUrl(trial.nctId)} target="_blank" rel="noopener noreferrer">
          {t("View official record ↗")}
        </a>
      </div>

      {getLang() !== "en" && (
        <p className="hint">{t("Trial information from the registry is shown in English.")}</p>
      )}

      {trial.briefSummary && (
        <section className="card detail-section">
          <h3>{t("What this study is about")}</h3>
          <p className="summary-text">
            <AnnotatedText text={trial.briefSummary} />
          </p>
        </section>
      )}

      <section className="card detail-section">
        <h3>{t("At a glance")}</h3>
        <dl className="facts">
          <div><dt>{t("Who can join")}</dt><dd>{formatAgeRange(trial.minimumAge, trial.maximumAge)} · {formatSex(trial.sex)}{trial.healthyVolunteers ? ` · ${t("accepts healthy volunteers")}` : ""}</dd></div>
          {trial.conditions.length > 0 && <div><dt>{t("Conditions")}</dt><dd>{trial.conditions.join(", ")}</dd></div>}
          {trial.interventions.length > 0 && (
            <div>
              <dt>{t("What's being tested")}</dt>
              <dd>
                {trial.interventions.slice(0, 6).map((i, idx) => (
                  <span key={idx} className="intervention">
                    {i.type ? `${titleCase(i.type)}: ` : ""}{i.name}
                    {idx < Math.min(trial.interventions.length, 6) - 1 ? "; " : ""}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {formatEnrollment(trial.enrollment) && <div><dt>{t("Study size")}</dt><dd>{formatEnrollment(trial.enrollment)}</dd></div>}
          {trial.primaryCompletionDate && <div><dt>{t("Main results expected")}</dt><dd>{formatDate(trial.primaryCompletionDate)}</dd></div>}
        </dl>
      </section>

      {trial.eligibilityCriteria && (
        <section className="card detail-section">
          <h3>{t("Can I join? Things the study team will check")}</h3>
          <EligibilityChecklist criteria={trial.eligibilityCriteria} nctId={trial.nctId} />
        </section>
      )}

      <section className="card detail-section">
        <h3>{t("Where this trial is running")} {sites.length > 0 ? `(${tn(sites.length, "{n} site", "{n} sites")})` : ""}</h3>
        {sites.length === 0 && <p className="hint">{t("No site locations are listed yet. Contact the study team below.")}</p>}
        <ul className="site-list">
          {sites.slice(0, 12).map((l, i) => (
            <li key={i} className="site">
              <div className="site-name">
                {l.facility ?? t("Study site")}
                {l.miles != null && <span className="badge badge-distance">{formatDistance(l.miles)}</span>}
              </div>
              <div className="site-place">{[l.city, l.state, l.country].filter(Boolean).join(", ")}</div>
              {l.contacts.length > 0 && (
                <div className="site-contact">
                  {l.contacts[0].name}
                  {l.contacts[0].phone && <> · <a href={`tel:${l.contacts[0].phone}`}>{l.contacts[0].phone}</a></>}
                  {l.contacts[0].email && <> · <a href={`mailto:${l.contacts[0].email}`}>{l.contacts[0].email}</a></>}
                </div>
              )}
            </li>
          ))}
        </ul>
        {sites.length > 12 && (
          <p className="hint">
            {t("+ {n} more sites — see the", { n: sites.length - 12 })}{" "}
            <a href={officialUrl(trial.nctId)} target="_blank" rel="noopener noreferrer">{t("official record")}</a>.
          </p>
        )}
      </section>

      {trial.centralContacts.length > 0 && (
        <section className="card detail-section">
          <h3>{t("Who to contact")}</h3>
          <ul className="contact-list">
            {trial.centralContacts.map((c, i) => (
              <li key={i}>
                <strong>{c.name}</strong>
                {c.role ? ` (${titleCase(c.role)})` : ""}
                {c.phone && <> · <a href={`tel:${c.phone}`}>{c.phone}</a></>}
                {c.email && <> · <a href={`mailto:${c.email}`}>{c.email}</a></>}
              </li>
            ))}
          </ul>
          <p className="hint">
            {t("It's completely normal to call and ask questions before deciding anything. Mention the study ID:")}{" "}
            <strong>{trial.nctId}</strong>.
          </p>
        </section>
      )}

      <section className="card detail-section">
        <h3>{t("Questions to bring to your doctor")}</h3>
        <ol className="question-list">
          {doctorQuestions(trial).map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
        <button
          className="btn btn-small"
          onClick={() => {
            const text = `Questions about clinical trial ${trial.nctId} (${trial.briefTitle}):\n\n` +
              doctorQuestions(trial).map((q, i) => `${i + 1}. ${q}`).join("\n");
            navigator.clipboard?.writeText(text);
          }}
        >
          {t("Copy questions")}
        </button>
      </section>

      <Disclaimer />
    </div>
  );
}
