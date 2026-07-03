export const locales = ["en", "zh", "ja", "ko", "de", "fr", "es", "pt"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const routing = {
  locales,
  defaultLocale,
} as const;
