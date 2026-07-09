import { useEffect } from "react";
import { t, useLang } from "../lib/i18n";
import { href, navigate } from "../lib/router";
import {
  checkWatchedSearches,
  markSearchSeen,
  unwatchSearch,
  useWatchedSearches,
  type WatchedSearch,
} from "../state/searches";

function searchHref(w: WatchedSearch): string {
  return href("/results", {
    cond: w.cond,
    lat: w.lat?.toFixed(4),
    lng: w.lng?.toFixed(4),
    loc: w.loc,
    radius: w.radius,
    age: w.age,
    sex: w.sex,
  });
}

export function WatchedSearches() {
  useLang();
  const watched = useWatchedSearches();

  useEffect(() => {
    checkWatchedSearches();
  }, []);

  if (watched.length === 0) return null;

  return (
    <section className="watched card">
      <h3>{t("Searches you're watching")}</h3>
      <p className="hint">
        Beacon re-checks these when you visit — right here in your browser, so nobody else knows
        what you're watching. New trials open every week.
      </p>
      <ul className="watched-list">
        {watched.map((w) => (
          <li key={w.id}>
            <a
              href={searchHref(w)}
              onClick={(e) => {
                e.preventDefault();
                markSearchSeen(w.id);
                navigate("/results", {
                  cond: w.cond,
                  lat: w.lat?.toFixed(4),
                  lng: w.lng?.toFixed(4),
                  loc: w.loc,
                  radius: w.radius,
                  age: w.age,
                  sex: w.sex,
                });
              }}
            >
              <strong>{w.cond}</strong>
              {w.loc && w.radius ? ` within ${w.radius} mi of ${w.loc === "your location" ? "you" : w.loc}` : " — worldwide"}
            </a>
            {w.newIds.length > 0 && (
              <span className="badge badge-new">
                {w.newIds.length} new trial{w.newIds.length === 1 ? "" : "s"}
              </span>
            )}
            <button
              className="btn btn-small"
              onClick={() => unwatchSearch(w.id)}
              aria-label={`Stop watching ${w.cond}`}
            >
              {t("Stop watching")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
