import { useEffect, useRef, useState } from "react";
import { searchStudies, type Trial } from "../api/ctgov";
import type { GeoPoint } from "../api/geocode";
import { expandCondition } from "../lib/conditions";
import { getLang, t, tn, useLang } from "../lib/i18n";
import { href, useRoute } from "../lib/router";
import { radiusKmLabel, useUnit } from "../lib/units";
import { isWatched, unwatchSearch, watchKey, watchSearch, useWatchedSearches } from "../state/searches";
import { AlertSubscribe } from "./AlertSubscribe";
import { TrialCard } from "./TrialCard";
import { UnitToggle } from "./UnitToggle";

function WatchButton() {
  const { params } = useRoute();
  useWatchedSearches(); // re-render when watch state changes
  const cond = params.get("cond") ?? "";
  if (!cond) return null;
  const p = {
    cond,
    lat: params.get("lat"),
    lng: params.get("lng"),
    loc: params.get("loc"),
    radius: params.get("radius"),
    age: params.get("age"),
    sex: params.get("sex"),
  };
  const key = watchKey(p);
  const watched = isWatched(key);
  return (
    <button
      className={`btn btn-small ${watched ? "btn-saved" : ""}`}
      aria-pressed={watched}
      onClick={() => (watched ? unwatchSearch(key) : void watchSearch(p))}
      title="Beacon re-checks watched searches in your browser when you visit — nothing is sent to any server."
    >
      {watched ? t("🔔 Watching") : t("🔔 Watch this search")}
    </button>
  );
}

export function ResultsList() {
  useLang();
  const unit = useUnit();
  const { params } = useRoute();
  const condition = params.get("cond") ?? "";
  const lat = params.get("lat");
  const lng = params.get("lng");
  const radius = params.get("radius");
  const locLabel = params.get("loc");
  const ageParam = params.get("age");
  const sex = params.get("sex") ?? "";

  const from: GeoPoint | null =
    lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
  const age = ageParam ? parseInt(ageParam, 10) : null;

  const [trials, setTrials] = useState<Trial[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestKey = useRef("");

  const expanded = expandCondition(condition);
  const searchKey = [condition, lat, lng, radius].join("|");

  useEffect(() => {
    if (!condition) return;
    requestKey.current = searchKey;
    setLoading(true);
    setError("");
    setTrials([]);
    setNextToken(null);
    setTotalCount(null);
    searchStudies({
      condition: expanded.query,
      lat: from?.lat,
      lng: from?.lng,
      radiusMiles: radius ? parseInt(radius, 10) : undefined,
    })
      .then((res) => {
        if (requestKey.current !== searchKey) return;
        setTrials(res.trials);
        setTotalCount(res.totalCount);
        setNextToken(res.nextPageToken);
      })
      .catch((e) => {
        if (requestKey.current !== searchKey) return;
        setError(e instanceof Error ? e.message : "Search failed. Please try again.");
      })
      .finally(() => {
        if (requestKey.current === searchKey) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  const loadMore = async () => {
    if (!nextToken) return;
    setLoadingMore(true);
    try {
      const res = await searchStudies({
        condition: expanded.query,
        lat: from?.lat,
        lng: from?.lng,
        radiusMiles: radius ? parseInt(radius, 10) : undefined,
        pageToken: nextToken,
      });
      setTrials((prev) => [...prev, ...res.trials]);
      setNextToken(res.nextPageToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load more results.");
    } finally {
      setLoadingMore(false);
    }
  };

  if (!condition) {
    return (
      <div className="empty-state">
        <p>{t("No search yet.")}</p>
        <a className="btn btn-primary" href="#/">
          {t("Start a search")}
        </a>
      </div>
    );
  }

  const backParams: Record<string, string> = {};
  params.forEach((v, k) => (backParams[k] = v));

  const place =
    locLabel === "your location" ? t("you (as in: near you)") : locLabel ?? t("your location");
  const whereLabel =
    from && radius
      ? " " +
        (unit === "km"
          ? t("within {r} km of {place}", { r: radiusKmLabel(parseInt(radius, 10)), place })
          : t("within {r} miles of {place}", { r: radius, place }))
      : " " + t("worldwide");

  return (
    <div className="results">
      <div className="results-header">
        <h2>
          {t("Trials for")} <em>{condition}</em>
          {whereLabel}
        </h2>
        <span className="results-header-actions">
          <UnitToggle />
          <WatchButton />
        </span>
      </div>
      <div className="results-header-rest">
        {totalCount != null && (
          <p className="hint">
            {totalCount === 0
              ? t("No recruiting trials found.")
              : tn(totalCount, "{n} recruiting trial found.", "{n} recruiting trials found.")}{" "}
            <a href="#/">{t("Change search")}</a>
          </p>
        )}
        {getLang() !== "en" && (
          <p className="hint">{t("Trial information from the registry is shown in English.")}</p>
        )}
        {totalCount != null && totalCount > 0 && (
          <AlertSubscribe cond={condition} lat={lat} lng={lng} loc={locLabel} radius={radius} />
        )}
        {expanded.added.length > 0 && (
          <p className="hint expansion-note">
            {t("Also searching related medical terms:")} <strong>{expanded.added.join(", ")}</strong> —{" "}
            {t("doctors often register trials under these names.")}
          </p>
        )}
      </div>

      {loading && <div className="loading" role="status">{t("Searching the registry…")}</div>}
      {error && <p className="error" role="alert">{error}</p>}

      {!loading && totalCount === 0 && (
        <div className="empty-state card">
          <h3>{t("No trials matched — but don't stop here.")}</h3>
          <ul>
            <li>{t("Try a broader search radius, or search anywhere in the world.")}</li>
            <li>{t("Try a broader condition name (e.g. “lung cancer” instead of a subtype).")}</li>
            <li>{t("New trials open every week — check back, and ask your doctor about trials too.")}</li>
          </ul>
        </div>
      )}

      <div className="results-list">
        {trials.map((t) => (
          <TrialCard
            key={t.nctId}
            trial={t}
            from={from}
            age={Number.isFinite(age) ? age : null}
            sex={sex}
            backParams={backParams}
          />
        ))}
      </div>

      {nextToken && !loading && (
        <div className="load-more">
          <button className="btn" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? t("Loading…") : t("Show more trials")}
          </button>
        </div>
      )}

      {trials.length > 0 && (
        <p className="hint results-tip">
          {t("Tip: save trials that look promising (☆), then open")}{" "}
          <a href={href("/saved")}>{t("Saved")}</a>{" "}
          {t("to print a summary you can bring to your doctor.")}
        </p>
      )}
    </div>
  );
}
