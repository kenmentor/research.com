"use client";

import * as React from "react";

/** Reactive media-query hook (avoids a new dependency for one hook). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(
    () =>
      typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Desktop breakpoint shared by shell + dialogs. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}
