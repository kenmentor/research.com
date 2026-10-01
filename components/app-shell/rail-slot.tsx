"use client";

import { usePathname } from "next/navigation";

/**
 * Decides whether the global right rail belongs on the current route.
 *
 * It is a client component so it can read the pathname, but the rail itself
 * is passed in as `children` and stays a server component.
 *
 * The rail is hidden where a page already supplies its own secondary column,
 * otherwise the three columns compete for the same 1024–1280px of space and
 * the content column collapses:
 *   - "/"                the landing page lists papers and researchers inline
 *   - "/messages"        the conversation list is itself a column
 *   - "/in/<username>"   the profile has its own stats sidebar
 */
const RAIL_LESS_ROUTES = ["/", "/messages"];

function isRailLess(pathname: string): boolean {
  if (RAIL_LESS_ROUTES.some((route) => pathname === route)) return true;
  return pathname.startsWith("/in/");
}

export function RailSlot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isRailLess(pathname)) return null;
  return <>{children}</>;
}