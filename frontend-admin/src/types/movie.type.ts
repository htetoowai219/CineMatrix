export type MovieStatus =
  | "UPCOMING"
  | "NOW_SHOWING"
  | "ARCHIVED"
  | "PENDING_APPROVAL";

export interface IMovie {
  _id?: string;
  title: string;
  tagline?: string;
  synopsis: string;
  durationMinutes: number;
  releaseDate: Date | string;
  originalLanguage: string;
  contentRating: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  director: string;
  castMembers?: string[];
  genres?: string[];
  status?: MovieStatus;
  createdByCinemaId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateMoviePayload {
  title: string;
  tagline?: string;
  synopsis: string;
  durationMinutes: number;
  releaseDate: string;
  originalLanguage: string;
  contentRating: string;
  // Image files take precedence over URL fields when provided.
  posterUrl?: string;
  backdropUrl?: string;
  posterImage?: File;
  backdropImage?: File;
  trailerUrl?: string;
  director: string;
  castMembers?: string[];
  genres?: string[];
  status?: MovieStatus;
}

export type UpdateMoviePayload = Partial<CreateMoviePayload>;

export interface FetchMoviesParams {
  status?: string;
  genre?: string;
}

export interface FetchMoviesResponse {
  message: string;
  count: number;
  movies: IMovie[];
}

export interface MovieMutationResponse {
  message: string;
  movie: IMovie;
}

export interface MessageResponse {
  message: string;
}

export interface TmdbMoviePreview {
  tmdbId: number;
  title: string;
  releaseDate: string | null;
  overview: string;
  language: string;
  rating: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
}

export interface TmdbSearchResponse {
  message: string;
  count: number;
  results: TmdbMoviePreview[];
}
