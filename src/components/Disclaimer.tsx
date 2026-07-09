import { t, useLang } from "../lib/i18n";

export function Disclaimer() {
  useLang();
  return (
    <div className="disclaimer" role="note">
      <strong>{t("Beacon is an information tool, not medical advice.")}</strong>{" "}
      {t(
        "Whether a trial is right for you is a decision for you, your doctor, and the study team. Joining a trial is always voluntary, and you can leave one at any time. Trial details come from the official U.S. registry, ClinicalTrials.gov, and may change — always confirm with the study team.",
      )}
    </div>
  );
}

export function PrivacyPromise() {
  useLang();
  return (
    <p className="privacy-promise">
      🔒 <strong>{t("Your privacy is absolute.")}</strong>{" "}
      {t(
        "The search runs entirely in your browser — your condition, age, and location go only to the public registry, never to us. No accounts, no tracking. The one exception is a feature you explicitly opt into: email alerts store your email and the watched search — nothing else.",
      )}
    </p>
  );
}
