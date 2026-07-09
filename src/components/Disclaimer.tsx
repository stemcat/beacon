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
        "Beacon runs entirely in your browser. Your condition, age, and location are sent only to the public registry to run your search — never to us. We have no servers, no accounts, and no tracking.",
      )}
    </p>
  );
}
