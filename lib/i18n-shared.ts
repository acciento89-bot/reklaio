export const LOCALE_COOKIE = "reklaio_locale";
export type Locale = "de" | "en";

export function localizedPath(path: string, locale: Locale) {
  if (locale === "de" || !path.startsWith("/") || path.startsWith("/api/") || path.startsWith("/en")) return path;
  return path === "/" ? "/en" : `/en${path}`;
}

export function pick<T>(locale: Locale, german: T, english: T): T {
  return locale === "en" ? english : german;
}
