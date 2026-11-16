const LANGUAGE_CODE_ALIASES: Record<string, string> = {
  jp: "ja",
  cn: "zh",
  kr: "ko",
};

const languageNames =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "language" })
    : null;

const isLanguageCode = (value: string) => /^[a-z]{2,3}$/i.test(value);

const toPrimaryLanguageCode = (value: string) => {
  const primary = value.split(/[-_]/)[0]?.toLowerCase() ?? "";
  return LANGUAGE_CODE_ALIASES[primary] ?? primary;
};

// Accepts both TMDB codes ("en", "ja", "jp") and readable names ("English").
export const getLanguageLabel = (value?: string): string => {
  const raw = value?.trim();
  if (!raw) return "Unknown";

  const code = toPrimaryLanguageCode(raw);
  if (!isLanguageCode(code)) return raw;

  try {
    return languageNames?.of(code) ?? raw.toUpperCase();
  } catch {
    return raw.toUpperCase();
  }
};

const GENRE_ALIASES: Record<string, string> = {
  scifi: "Science Fiction",
  sciencefiction: "Science Fiction",
};

const toGenreKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

// Keeps manual entries such as "Sci-Fi" aligned with TMDB's "Science Fiction".
export const normalizeGenre = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return GENRE_ALIASES[toGenreKey(trimmed)] ?? trimmed;
};

export const buildFilterOptions = (values: string[]): string[] => {
  const options = new Map<string, string>();

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;

    const key = trimmed.toLocaleLowerCase();
    if (!options.has(key)) options.set(key, trimmed);
  }

  return [
    "All",
    ...Array.from(options.values()).sort((a, b) => a.localeCompare(b)),
  ];
};
