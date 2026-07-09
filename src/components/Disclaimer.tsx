export function Disclaimer() {
  return (
    <div className="disclaimer" role="note">
      <strong>Beacon is an information tool, not medical advice.</strong> Whether a trial is right
      for you is a decision for you, your doctor, and the study team. Joining a trial is always
      voluntary, and you can leave one at any time. Trial details come from the official U.S.
      registry, ClinicalTrials.gov, and may change — always confirm with the study team.
    </div>
  );
}

export function PrivacyPromise() {
  return (
    <p className="privacy-promise">
      🔒 <strong>Your privacy is absolute.</strong> Beacon runs entirely in your browser. Your
      condition, age, and location are sent only to the public registry to run your search — never
      to us. We have no servers, no accounts, and no tracking.
    </p>
  );
}
