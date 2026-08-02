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
  averageScore?: number;
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

export interface FetchMoviesParams {
  status?: string;
  genre?: string;
}

export interface FetchMoviesResponse {
  message: string;
  count: number;
  movies: IMovie[];
}

export interface FetchMovieByIdResponse {
  message: string;
  movie: IMovie;
}
