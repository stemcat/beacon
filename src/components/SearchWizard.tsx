import { useState } from "react";
import { getBrowserLocation, geocodeSearch, type GeocodeResult } from "../api/geocode";
import { suggestConditions } from "../lib/conditions";
import { t, useLang } from "../lib/i18n";
import { navigate } from "../lib/router";
import { radiusKmLabel, useUnit } from "../lib/units";
import { UnitToggle } from "./UnitToggle";

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

const RADII_MILES = [25, 50, 100, 250];

export function SearchWizard() {
  useLang(); // re-render on language change
  const unit = useUnit();
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
            {t(label)}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="wizard-step">
          <h2>{t("What condition are you looking into?")}</h2>
          <p className="hint">
            {t("This can be for yourself or someone you care for. Type a condition, or pick a common one below.")}
          </p>
          <input
            type="text"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && condition.trim() && setStep(1)}
            placeholder={t("e.g. breast cancer, type 2 diabetes, ALS…")}
            aria-label="Medical condition"
            list="condition-suggestions"
            autoFocus
          />
          <datalist id="condition-suggestions">
            {suggestConditions(condition).map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
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
              {t("Next")}
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="wizard-step">
          <h2>{t("A little about the patient")}</h2>
          <p className="hint">
            {t("Optional — this helps us flag trials whose age or sex requirements don't match. Nothing you enter leaves your device except to run the search.")}
          </p>
          <label className="field">
            <span>{t("Age")}</span>
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
            <legend>{t("Sex assigned at birth")}</legend>
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
                  {t(label)}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="wizard-nav">
            <button className="btn" onClick={() => setStep(0)}>
              {t("Back")}
            </button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              {t("Next")}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step">
          <h2>{t("Where should we look?")}</h2>
          <p className="hint">{t("Trials often require regular visits, so distance matters.")}</p>
          <label className="field">
            <span>
              {t("How far could you travel?")} <UnitToggle />
            </span>
            <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} aria-label="Search radius">
              {RADII_MILES.map((mi) => (
                <option key={mi} value={mi}>
                  {unit === "km"
                    ? t("Within {n} km", { n: radiusKmLabel(mi) })
                    : t("Within {n} miles", { n: mi })}
                </option>
              ))}
              <option value={0}>{t("Anywhere in the world")}</option>
            </select>
          </label>

          {radius !== 0 && (
            <>
              <button className="btn btn-primary btn-wide" onClick={useMyLocation} disabled={busy}>
                {t("📍 Use my current location & search")}
              </button>
              <div className="or-divider">{t("or")}</div>
              <div className="field-row">
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchLocation()}
                  placeholder={t("City or postal code, e.g. Montreal")}
                  aria-label="City or postal code"
                />
                <button className="btn" onClick={searchLocation} disabled={busy || !locationQuery.trim()}>
                  {t("Find")}
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
              {t("Search everywhere")}
            </button>
          )}

          {error && <p className="error" role="alert">{error}</p>}
          {busy && <p className="hint">{t("Working…")}</p>}

          <div className="wizard-nav">
            <button className="btn" onClick={() => setStep(1)}>
              {t("Back")}
            </button>
            <span />
          </div>
        </div>
      )}
    </div>
  );
}
