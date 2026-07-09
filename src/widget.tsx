/**
 * Embeddable widget entry: a compact, zero-data trial list for partner sites
 * (advocacy orgs, clinics). Configured entirely by URL params — no cookies,
 * no storage, no tracking. Parents embed via public/embed.js, which handles
 * iframe injection and height syncing.
 */

import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { searchStudies, officialUrl, type Trial } from "./api/ctgov";
import { expandCondition } from "./lib/conditions";
import { formatPhases, formatStatus, statusTone } from "./lib/format";
import "./styles.css";

const params = new URLSearchParams(window.location.search);
const condition = params.get("cond") ?? "";
const limit = Math.min(Math.max(parseInt(params.get("limit") ?? "5", 10) || 5, 1), 10);
// The widget lives at <base>/widget.html; the app is the sibling index.
const appUrl = window.location.href.replace(/widget\.html.*$/, "");

function postHeight() {
  window.parent?.postMessage(
    { type: "beacon-widget-height", height: document.documentElement.scrollHeight },
    "*",
  );
}

function Widget() {
  const [trials, setTrials] = useState<Trial[] | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!condition) return;
    searchStudies({ condition: expandCondition(condition).query, pageSize: limit })
      .then((res) => {
        setTrials(res.trials);
        setTotalCount(res.totalCount);
      })
      .catch(() => setError("Trial data is unavailable right now."));
  }, []);

  useEffect(() => {
    postHeight();
    const t = setTimeout(postHeight, 300);
    return () => clearTimeout(t);
  });

  if (!condition) {
    return <p className="hint">Widget error: no condition configured (data-condition attribute).</p>;
  }

  const searchLink = `${appUrl}#/results?cond=${encodeURIComponent(condition)}`;

  return (
    <div className="widget">
      <h3 className="widget-title">Recruiting clinical trials: {condition}</h3>
      {error && <p className="error">{error}</p>}
      {!trials && !error && <p className="hint">Loading trials…</p>}
      {trials && (
        <ul className="widget-list">
          {trials.map((t) => (
            <li key={t.nctId}>
              <a href={`${appUrl}#/trial/${t.nctId}`} target="_blank" rel="noopener noreferrer">
                {t.briefTitle}
              </a>
              <div className="widget-meta">
                <span className={`badge badge-${statusTone(t.overallStatus)}`}>
                  {formatStatus(t.overallStatus)}
                </span>
                {formatPhases(t.phases) && <span className="badge">{formatPhases(t.phases)}</span>}
                {t.locations.length > 0 && (
                  <span className="badge badge-muted">
                    {t.locations.length} site{t.locations.length === 1 ? "" : "s"}
                  </span>
                )}
                <a
                  className="widget-official"
                  href={officialUrl(t.nctId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  official record ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="widget-footer">
        {totalCount != null && totalCount > limit && (
          <a href={searchLink} target="_blank" rel="noopener noreferrer">
            See all {totalCount.toLocaleString()} trials →
          </a>
        )}{" "}
        <span className="hint">
          Powered by <a href={appUrl} target="_blank" rel="noopener noreferrer">Beacon</a> · data:
          ClinicalTrials.gov · no tracking, ever
        </span>
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Widget />
  </StrictMode>,
);
