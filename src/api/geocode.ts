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

export async function geocodeSearch(query: string): Promise<GeocodeResult[]> {
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
