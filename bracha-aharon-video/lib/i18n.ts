export const LOCALES = ["he", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "he";

export const DIR: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
};

export const HTML_LANG: Record<Locale, string> = {
  he: "he",
  en: "en",
};

/** OpenGraph locale codes. */
export const OG_LOCALE: Record<Locale, string> = {
  he: "he_IL",
  en: "en_US",
};

/** Path prefix for a locale. Hebrew is the root, English lives under /en. */
export function localePath(locale: Locale, path = ""): string {
  const clean = path.replace(/^\//, "");
  const suffix = clean ? `/${clean}` : "";
  return locale === "he" ? `/${clean}` : `/en${suffix}`;
}

/** A bilingual string. */
export type Localized = Record<Locale, string>;

export function t(value: Localized, locale: Locale): string {
  return value[locale];
}
