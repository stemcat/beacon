import { Disclaimer, PrivacyPromise } from "./components/Disclaimer";
import { ResultsList } from "./components/ResultsList";
import { SavedTrials } from "./components/SavedTrials";
import { SearchWizard } from "./components/SearchWizard";
import { Partners } from "./components/Partners";
import { TrialDetail } from "./components/TrialDetail";
import { WatchedSearches } from "./components/WatchedSearches";
import { setLang, t, useLang, type Lang } from "./lib/i18n";
import { useRoute } from "./lib/router";
import { useSavedTrials } from "./state/saved";

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>
          {t("Somewhere, a trial is looking")} <span className="accent">{t("for you.")}</span>
        </h1>
        <p className="hero-sub">
          {t(
            "Every year, promising treatments stall because trials can't find participants — while patients never hear about studies recruiting nearby. Beacon searches all {n} studies in the official registry and explains them in plain language. Free, for everyone, forever.",
            { n: "590,000+" },
          )}
        </p>
      </section>
      <SearchWizard />
      <WatchedSearches />
      <PrivacyPromise />
      <Disclaimer />
    </div>
  );
}

function About() {
  useLang();
  return (
    <div className="about">
      <h2>{t("Why Beacon exists")}</h2>
      <div className="card detail-section">
        <p>
          {t(
            "Roughly 80% of clinical trials are delayed because they can't recruit enough participants, and fewer than 5% of eligible cancer patients ever join one. That's not a lack of trials or a lack of willing patients — it's a discovery problem. The official registry, ClinicalTrials.gov, is public and complete, but it was built for researchers, not for a person who just got a diagnosis.",
          )}
        </p>
        <p>
          {t(
            "Beacon is the missing translation layer: the same official data, reshaped around the questions patients actually have. Is there a trial for my condition near me? Could I qualify? What would it involve? Who do I call?",
          )}
        </p>
        <p>
          {t(
            "Every patient matched is a trial accelerated — and every trial accelerated is a treatment that arrives sooner for everyone.",
          )}
        </p>
      </div>
      <div className="card detail-section">
        <h3>{t("Our promises")}</h3>
        <ul className="promise-list">
          <li><strong>{t("Free for patients, forever.")}</strong> {t("No accounts, no paywalls.")}</li>
          <li><strong>{t("Your privacy is absolute.")}</strong> {t("Beacon has no servers. Your searches go directly from your browser to the public registry and nowhere else.")}</li>
          <li><strong>{t("No editorializing.")}</strong> {t("We translate jargon; we never hype a treatment or hide a risk. Every trial links to its official record.")}</li>
          <li><strong>{t("Your doctor stays in charge.")}</strong> {t("Beacon prepares you for a conversation — it never replaces one.")}</li>
        </ul>
      </div>
      <div className="card detail-section">
        <h3>{t("Data source")}</h3>
        <p>
          {t(
            "All trial data comes live from ClinicalTrials.gov, the registry run by the U.S. National Library of Medicine, covering studies in more than 200 countries. Location search is powered by OpenStreetMap Nominatim.",
          )}{" "}
          <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer">
            ClinicalTrials.gov ↗
          </a>
        </p>
      </div>
      <Disclaimer />
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const saved = useSavedTrials();
  const lang = useLang();

  let view: React.ReactNode;
  const trialMatch = route.path.match(/^\/trial\/(NCT\d+)$/i);
  if (route.path === "/results") view = <ResultsList />;
  else if (trialMatch) view = <TrialDetail nctId={trialMatch[1].toUpperCase()} />;
  else if (route.path === "/saved") view = <SavedTrials />;
  else if (route.path === "/about") view = <About />;
  else if (route.path === "/partners") view = <Partners />;
  else view = <Home />;

  return (
    <div className="app">
      <header className="topbar no-print">
        <a href="#/" className="logo" aria-label="Beacon home">
          <span className="logo-mark" aria-hidden="true">🔆</span> Beacon
        </a>
        <nav>
          <a href="#/" className={route.path === "/" ? "active" : ""}>{t("Search")}</a>
          <a href="#/saved" className={route.path === "/saved" ? "active" : ""}>
            {t("Saved")}{saved.length > 0 ? ` (${saved.length})` : ""}
          </a>
          <a href="#/about" className={route.path === "/about" ? "active" : ""}>{t("About")}</a>
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            aria-label="Language"
          >
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="es">ES</option>
          </select>
        </nav>
      </header>
      <main>{view}</main>
      <footer className="footer no-print">
        <p>
          Beacon · {t("free clinical trial finder")} · {t("data live from")}{" "}
          <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer">ClinicalTrials.gov</a>{" "}
          · {t("not medical advice")} · {t("no tracking, ever")} ·{" "}
          <a href="#/partners">{t("embed Beacon on your site")}</a>
        </p>
      </footer>
    </div>
  );
}
