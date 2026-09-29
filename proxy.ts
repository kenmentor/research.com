import { NextResponse } from "next/server";
import { auth } from "./auth";

const PUBLIC_PREFIXES = [
  "/",
  "/design",
  "/discover",
  "/in",
  "/pub",
  "/login",
  "/api/auth",
  "/api/publications",
  "/api/search",
  "/api/trending",
  "/api/discover",
  "/api/topics",
  "/topics",
  "/manifest.webmanifest",
];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  if (
    PUBLIC_PREFIXES.some(
      (p) => p !== "/" && (pathname === p || pathname.startsWith(`${p}/`)),
    )
  ) {
    return true;
  }
  // Static assets (icons, images) never require auth.
  const last = pathname.split("/").pop() ?? "";
  if (last.includes(".")) return true;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();
  if (!req.auth?.user) {
    // API callers get JSON 401, browsers get the login redirect.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Sign in required." } },
        { status: 401 },
      );
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
