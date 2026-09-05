import { NextRequest, NextResponse } from "next/server";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n-shared";

const COOKIE_OPTIONS = {
  httpOnly: false,
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

function browserLocale(request: NextRequest): Locale {
  const accepted = request.headers.get("accept-language")?.toLowerCase() ?? "";
  return /(^|,)\s*de(?:-|;|,|$)/.test(accepted) ? "de" : "en";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasEnglishPrefix = pathname === "/en" || pathname.startsWith("/en/");
  const stored = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale = hasEnglishPrefix ? "en" : stored === "en" || stored === "de" ? stored : browserLocale(request);

  if (!hasEnglishPrefix && locale === "en") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(LOCALE_COOKIE, "en", COOKIE_OPTIONS);
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-reklaio-locale", hasEnglishPrefix ? "en" : "de");

  if (hasEnglishPrefix) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname === "/en" ? "/" : pathname.slice(3);
    const response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
    response.cookies.set(LOCALE_COOKIE, "en", COOKIE_OPTIONS);
    return response;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (stored !== "de") response.cookies.set(LOCALE_COOKIE, "de", COOKIE_OPTIONS);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sw.js|.*\\.[a-zA-Z0-9]+$).*)"]
};
