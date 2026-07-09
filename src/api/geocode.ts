/**
 * Location helpers: browser geolocation (primary), OpenStreetMap Nominatim
 * city/postcode search (fallback), and great-circle distance.
 */

import { t } from "../lib/i18n";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeocodeResult extends GeoPoint {
  displayName: string;
}

export function getBrowserLocation(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error(t("Location services aren't available in this browser.")));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error(t("We couldn't get your location. You can type a city or postal code instead."))),
      { timeout: 10_000, maximumAge: 600_000 },
    );
  });
}

/** Canadian postal code, full ("H2X 1Y4") or FSA-only ("H2X"). */
const CA_POSTAL = /^([A-Za-z]\d[A-Za-z])\s*(?:\d[A-Za-z]\d)?$/;

/**
 * Resolve a Canadian postal code via its FSA (first three characters).
 * OpenStreetMap's Canadian postal coverage is patchy — perfectly valid codes
 * like "K1A 0B1" or "T5J 3N4" return nothing — while Zippopotam carries the
 * complete FSA set. Privacy bonus: only the 3-character FSA (a neighbourhood,
 * ~thousands of households) ever leaves the browser, never the full code.
 */
async function geocodeCanadianFsa(fsa: string): Promise<GeocodeResult[]> {
  const res = await fetch(`https://api.zippopotam.us/CA/${encodeURIComponent(fsa.toUpperCase())}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data: { places?: Array<{ "place name": string; "state abbreviation": string; latitude: string; longitude: string }> } =
    await res.json();
  const place = data.places?.[0];
  if (!place) return [];
  return [
    {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      displayName: `${place["place name"]}, ${place["state abbreviation"]}, Canada`,
    },
  ];
}

export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
  const postal = query.trim().match(CA_POSTAL);
  if (postal) {
    const results = await geocodeCanadianFsa(postal[1]).catch(() => []);
    if (results.length > 0) return results;
    // Fall through to Nominatim if the FSA lookup finds nothing.
  }
  const q = new URLSearchParams({
    format: "jsonv2",
    q: query,
    limit: "5",
    addressdetails: "0",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(t("Location search is unavailable right now. Please try again."));
  const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json();
  return data.map((d) => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    displayName: d.display_name,
  }));
}

const EARTH_RADIUS_MILES = 3958.8;

export function haversineMiles(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(s));
}
