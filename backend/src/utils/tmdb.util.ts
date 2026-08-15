const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p";

// TMDB accepts either a legacy API key (?api_key=...) or a v4 read-access
// token (Authorization: Bearer ...). The token is preferred when configured.
const readToken = (): string | undefined =>
  process.env.TMDB_READ_ACCESS_TOKEN?.trim() || undefined;

const apiKey = (): string => {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("TMDB_API_KEY is not configured on the server.");
  }
  return key;
};

export const isTmdbConfigured = (): boolean =>
  Boolean(process.env.TMDB_API_KEY || process.env.TMDB_READ_ACCESS_TOKEN);

// Fetches a TMDB URL with whichever auth mechanism is available.
const tmdbFetch = async (url: URL): Promise<Response> => {
  const token = readToken();
  if (token) {
    url.searchParams.delete("api_key");
    return fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  url.searchParams.set("api_key", apiKey());
  return fetch(url.toString());
};

type TmdbResult = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  original_language: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
};

export type TmdbMoviePreview = {
  tmdbId: number;
  title: string;
  releaseDate: string | null;
  overview: string;
  language: string;
  rating: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
};

const toPreview = (m: TmdbResult, genres: Map<number, string>): TmdbMoviePreview => ({
  tmdbId: m.id,
  title: m.title,
  releaseDate: m.release_date || null,
  overview: m.overview,
  language: m.original_language,
  rating: m.vote_average,
  posterUrl: m.poster_path ? `${TMDB_IMAGE}/w500${m.poster_path}` : null,
  backdropUrl: m.backdrop_path ? `${TMDB_IMAGE}/w1280${m.backdrop_path}` : null,
  genres: (m.genre_ids || []).map((id) => genres.get(id)).filter(Boolean) as string[],
});

// Searches TMDB and returns normalized previews (image URLs are direct TMDB
// CDN links; no Cloudinary round-trip required).
export const searchTmdbMovies = async (
  query: string,
  year?: number,
): Promise<TmdbMoviePreview[]> => {
  const url = new URL(`${TMDB_BASE}/search/movie`);
  url.searchParams.set("query", query);
  url.searchParams.set("language", "en-US");
  if (year) url.searchParams.set("year", String(year));

  const response = await tmdbFetch(url);
  if (!response.ok) {
    throw new Error(`TMDB search failed (${response.status}).`);
  }

  const data = (await response.json()) as { results?: TmdbResult[] };
  const results = (data.results ?? []).slice(0, 10);
  return results.map((m) => toPreview(m, new Map()));
};

// Fetches full detail for a TMDB id, including trailer and credits.
export const getTmdbMovie = async (tmdbId: number) => {
  const url = new URL(`${TMDB_BASE}/movie/${tmdbId}`);
  url.searchParams.set("language", "en-US");
  url.searchParams.set(
    "append_to_response",
    "videos,credits,release_dates,genres",
  );

  const response = await tmdbFetch(url);
  if (!response.ok) {
    throw new Error(`TMDB fetch failed (${response.status}).`);
  }
  const data = (await response.json()) as any;

  const trailer = (data.videos?.results ?? []).find(
    (v: any) => v.site === "YouTube" && v.type === "Trailer" && v.official !== false,
  );
  const director = (data.credits?.crew ?? []).find(
    (c: any) => c.job === "Director",
  );
  const certification =
    data.release_dates?.results
      ?.find((r: any) => r.iso_3166_1 === "US")
      ?.release_dates?.find((d: any) => d.certification)
      ?.certification || "NR";

  const posterUrl = data.poster_path
    ? `${TMDB_IMAGE}/w500${data.poster_path}`
    : "";
  const backdropUrl = data.backdrop_path
    ? `${TMDB_IMAGE}/w1280${data.backdrop_path}`
    : "";

  return {
    tmdbId: data.id,
    title: data.title,
    tagline: data.tagline || "",
    synopsis: data.overview || "No synopsis available.",
    durationMinutes: Math.max(data.runtime || 0, 1),
    releaseDate: data.release_date || "1970-01-01",
    originalLanguage: data.original_language || "en",
    contentRating: certification,
    averageScore: data.vote_average || 0,
    posterUrl: posterUrl || "https://via.placeholder.com/500x750?text=No+Poster",
    backdropUrl: backdropUrl || "https://via.placeholder.com/1280x720?text=No+Backdrop",
    trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "",
    director: director?.name || "Unknown",
    castMembers: (data.credits?.cast ?? [])
      .slice(0, 10)
      .map((c: any) => c.name),
    genres: (data.genres ?? []).map((g: any) => g.name),
  };
};
