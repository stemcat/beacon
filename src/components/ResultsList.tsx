import { useEffect, useRef, useState } from "react";
import { searchStudies, type Trial } from "../api/ctgov";
import type { GeoPoint } from "../api/geocode";
import { href, useRoute } from "../lib/router";
import { TrialCard } from "./TrialCard";

export function ResultsList() {
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
      condition,
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
        condition,
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
        <p>No search yet.</p>
        <a className="btn btn-primary" href="#/">
          Start a search
        </a>
      </div>
    );
  }

  const backParams: Record<string, string> = {};
  params.forEach((v, k) => (backParams[k] = v));

  const whereLabel =
    from && radius
      ? ` within ${radius} miles of ${locLabel === "your location" ? "you" : locLabel ?? "your location"}`
      : " worldwide";

  return (
    <div className="results">
      <div className="results-header">
        <h2>
          Trials for <em>{condition}</em>
          {whereLabel}
        </h2>
        {totalCount != null && (
          <p className="hint">
            {totalCount === 0
              ? "No recruiting trials found."
              : `${totalCount.toLocaleString()} recruiting ${totalCount === 1 ? "trial" : "trials"} found.`}{" "}
            <a href="#/">Change search</a>
          </p>
        )}
      </div>

      {loading && <div className="loading" role="status">Searching the registry…</div>}
      {error && <p className="error" role="alert">{error}</p>}

      {!loading && totalCount === 0 && (
        <div className="empty-state card">
          <h3>No trials matched — but don't stop here.</h3>
          <ul>
            <li>Try a broader search radius, or search anywhere in the world.</li>
            <li>Try a broader condition name (e.g. “lung cancer” instead of a subtype).</li>
            <li>New trials open every week — check back, and ask your doctor about trials too.</li>
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
            {loadingMore ? "Loading…" : "Show more trials"}
          </button>
        </div>
      )}

      {trials.length > 0 && (
        <p className="hint results-tip">
          Tip: save trials that look promising ({<span aria-hidden="true">☆</span>}), then open{" "}
          <a href={href("/saved")}>Saved</a> to print a summary you can bring to your doctor.
        </p>
      )}
    </div>
  );
}
