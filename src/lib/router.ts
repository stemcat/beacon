/**
 * Tiny hash router. Hash-based so the app works from any static file host
 * with zero server configuration, and searches are shareable links.
 */

import { useSyncExternalStore } from "react";

export interface Route {
  path: string;
  params: URLSearchParams;
}

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = hash.split("?");
  return { path: path || "/", params: new URLSearchParams(query) };
}

let current = typeof window !== "undefined" ? parseHash() : { path: "/", params: new URLSearchParams() };

function subscribe(cb: () => void) {
  const handler = () => {
    current = parseHash();
    cb();
  };
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}

export function useRoute(): Route {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}

export function href(path: string, params?: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") q.set(k, String(v));
    }
  }
  const qs = q.toString();
  return `#${path}${qs ? "?" + qs : ""}`;
}

export function navigate(path: string, params?: Record<string, string | number | undefined>) {
  window.location.hash = href(path, params).slice(1);
  window.scrollTo({ top: 0 });
}
