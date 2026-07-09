import { useState } from "react";
import { getBrowserLocation, geocodeSearch, type GeocodeResult } from "../api/geocode";
import { navigate } from "../lib/router";

const COMMON_CONDITIONS = [
  "Breast cancer",
  "Lung cancer",
  "Prostate cancer",
  "Melanoma",
  "Colorectal cancer",
  "Type 2 diabetes",
  "Alzheimer's disease",
  "Parkinson's disease",
  "Depression",
  "Multiple sclerosis",
  "Rheumatoid arthritis",
  "Heart failure",
];

const RADII = [
  { value: 25, label: "Within 25 miles" },
  { value: 50, label: "Within 50 miles" },
  { value: 100, label: "Within 100 miles" },
  { value: 250, label: "Within 250 miles" },
  { value: 0, label: "Anywhere in the world" },
];

export function SearchWizard() {
  const [step, setStep] = useState(0);
  const [condition, setCondition] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [radius, setRadius] = useState(100);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<GeocodeResult[]>([]);
  const [chosenLocation, setChosenLocation] = useState<GeocodeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const runSearch = (loc: GeocodeResult | null, radiusOverride?: number) => {
    const r = radiusOverride ?? radius;
    navigate("/results", {
      cond: condition.trim(),
      age: age || undefined,
      sex: sex || undefined,
      lat: loc && r ? loc.lat.toFixed(4) : undefined,
      lng: loc && r ? loc.lng.toFixed(4) : undefined,
      loc: loc && r ? loc.displayName : undefined,
      radius: loc && r ? r : undefined,
    });
  };

  const useMyLocation = async () => {
    setBusy(true);
    setError("");
    try {
      const point = await getBrowserLocation();
      const loc = { ...point, displayName: "your location" };
      setChosenLocation(loc);
      runSearch(loc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong getting your location.");
    } finally {
      setBusy(false);
    }
  };

  const searchLocation = async () => {
    if (!locationQuery.trim()) return;
    setBusy(true);
    setError("");
    try {
      const results = await geocodeSearch(locationQuery.trim());
      if (results.length === 0) {
        setError("We couldn't find that place. Try a city name or postal code.");
      } else {
        setLocationResults(results);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Location search failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wizard card">
      <div className="wizard-progress" aria-hidden="true">
        {["Condition", "About you", "Location"].map((label, i) => (
          <div key={label} className={`wizard-step-dot ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
            <span className="dot" />
            {label}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="wizard-step">
          <h2>What condition are you looking into?</h2>
          <p className="hint">
            This can be for yourself or someone you care for. Type a condition, or pick a common
            one below.
          </p>
          <input
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && condition.trim() && setStep(1)}
            placeholder="e.g. breast cancer, type 2 diabetes, ALS…"
            aria-label="Medical condition"
            autoFocus
          />
          <div className="chips">
            {COMMON_CONDITIONS.map((c) => (
              <button
                key={c}
                className={`chip ${condition === c ? "chip-active" : ""}`}
                onClick={() => setCondition(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="wizard-nav">
            <span />
            <button className="btn btn-primary" disabled={!condition.trim()} onClick={() => setStep(1)}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="wizard-step">
          <h2>A little about the patient</h2>
          <p className="hint">
            Optional — this helps us flag trials whose age or sex requirements don't match. Nothing
            you enter leaves your device except to run the search.
          </p>
          <label className="field">
            <span>Age</span>
            <input
              type="number"
              min="0"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 54"
              aria-label="Age in years"
            />
          </label>
          <fieldset className="field">
            <legend>Sex assigned at birth</legend>
            <div className="chips">
              {[
                ["", "Prefer not to say"],
                ["FEMALE", "Female"],
                ["MALE", "Male"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`chip ${sex === value ? "chip-active" : ""}`}
                  onClick={() => setSex(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="wizard-nav">
            <button className="btn" onClick={() => setStep(0)}>
              Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <h2>Where should we look?</h2>
          <p className="hint">Trials often require regular visits, so distance matters.</p>
          <label className="field">
            <span>How far could you travel?</span>
            <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} aria-label="Search radius">
              {RADII.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {radius !== 0 && (
            <>
              <button className="btn btn-primary btn-wide" onClick={useMyLocation} disabled={busy}>
                📍 Use my current location & search
              </button>
              <div className="or-divider">or</div>
              <div className="field-row">
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchLocation()}
                  placeholder="City or postal code, e.g. Montreal"
                  aria-label="City or postal code"
                />
                <button className="btn" onClick={searchLocation} disabled={busy || !locationQuery.trim()}>
                  Find
                </button>
              </div>
              {locationResults.length > 0 && (
                <ul className="location-results">
                  {locationResults.map((r, i) => (
                    <li key={i}>
                      <button
                        className={`location-option ${chosenLocation === r ? "chip-active" : ""}`}
                        onClick={() => runSearch(r)}
                      >
                        {r.displayName}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {radius === 0 && (
            <button className="btn btn-primary btn-wide" onClick={() => runSearch(null, 0)}>
              Search everywhere
            </button>
          )}

          {error && <p className="error" role="alert">{error}</p>}
          {busy && <p className="hint">Working…</p>}

          <div className="wizard-nav">
            <button className="btn" onClick={() => setStep(1)}>
              Back
            </button>
            <span />
          </div>
        </div>
      )}
    </div>
  );
}
