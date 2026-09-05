import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n-shared";
export { LOCALE_COOKIE, localizedPath, pick, type Locale } from "@/lib/i18n-shared";

export async function getLocale(): Promise<Locale> {
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get("x-reklaio-locale");
  if (headerLocale === "en" || headerLocale === "de") return headerLocale;

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  return cookieLocale === "en" ? "en" : "de";
}
