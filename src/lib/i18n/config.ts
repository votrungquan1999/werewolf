/** Languages the app ships in. Vietnamese is the default. */
export enum Locale {
  Vi = "vi",
  En = "en",
}

/** Vietnamese is the house language; English is opt-in. */
export const DEFAULT_LOCALE = Locale.Vi;

/**
 * Narrows an untrusted URL segment to a supported locale.
 * @param value Raw `lang` segment from the route.
 * @returns The matching locale, or the default for anything unrecognised.
 */
export function toLocale(value: string): Locale {
  // Anything off the enum is a typo or a bot — quietly serve the default.
  return (
    Object.values(Locale).find((locale) => locale === value) ?? DEFAULT_LOCALE
  );
}

/**
 * Rewrites a path so it points at the same screen in another language.
 * @param path Current pathname, e.g. `/vi/setup`.
 * @param target Locale to switch to.
 * @returns The path with its leading locale segment replaced.
 */
export function swapLocaleInPath(path: string, target: Locale): string {
  // Index 1 is the locale: splitting a leading-slash path puts "" at index 0.
  const segments = path.split("/");
  segments[1] = target;

  return segments.join("/");
}
