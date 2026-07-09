import { useState } from "react";

/**
 * "For organizations" page: copy-paste embed snippet with live preview.
 * The pitch to advocacy orgs and clinics: because the widget collects zero
 * data, adopting it requires no privacy or legal review.
 */
export function Partners() {
  const [condition, setCondition] = useState("lupus");
  const [copied, setCopied] = useState(false);
  const base = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, "")}`;
  const snippet = `<script src="${base}embed.js"\n        data-condition="${condition}"\n        data-limit="5" async></script>`;

  return (
    <div className="partners">
      <h2>Put a trial finder on your site — free, in one minute</h2>
      <div className="card detail-section">
        <p>
          If you run a patient advocacy organization, clinic, or health community, you can embed
          Beacon's live trial list for your condition. It updates itself from ClinicalTrials.gov,
          costs nothing, and — because it collects <strong>zero data</strong> about your visitors
          (no cookies, no accounts, no analytics) — there's nothing for your privacy or legal team
          to review.
        </p>
        <label className="field">
          <span>Condition to feature</span>
          <input
            type="text"
            value={condition}
            onChange={(e) => {
              setCondition(e.target.value);
              setCopied(false);
            }}
            aria-label="Condition to feature in the widget"
          />
        </label>
        <p className="hint">Copy this into your page's HTML where the widget should appear:</p>
        <pre className="embed-snippet">{snippet}</pre>
        <button
          className="btn btn-small"
          onClick={() => {
            navigator.clipboard?.writeText(snippet);
            setCopied(true);
          }}
        >
          {copied ? "✓ Copied" : "Copy snippet"}
        </button>
        {condition.trim() && (
          <div className="embed-preview">
            <p className="hint">Live preview:</p>
            <iframe
              src={`${base}widget.html?cond=${encodeURIComponent(condition)}&limit=3`}
              style={{ width: "100%", border: 0, height: 320 }}
              title="Beacon widget preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}
