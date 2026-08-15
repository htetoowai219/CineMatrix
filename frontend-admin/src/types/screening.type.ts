export type ScreeningSeatStatus = "available" | "held" | "booked";

export interface IScreeningSeat {
  label: string;
  row: string;
  isDouble: boolean;
  price: number;
  status: ScreeningSeatStatus;
}

export type ScreeningMovieRef = {
  _id: string;
  title: string;
  posterUrl: string;
  durationMinutes: number;
};

export type ScreeningCinemaRef = {
  _id: string;
  name: string;
  currency?: string;
};

export interface IScreening {
  _id?: string;
  templateId: string;
  cinemaId: string | ScreeningCinemaRef;
  movieId: string | ScreeningMovieRef;
  roomName: string;
  startTime: string;
  endTime: string;
  seats: IScreeningSeat[];
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  movie?: ScreeningMovieRef;
  cinema?: ScreeningCinemaRef;
}

export interface CreateScreeningPayload {
  templateId: string;
  startTime: string;
}

export interface UpdateScreeningPayload {
  startTime?: string;
}

export interface ScreeningMutationResponse {
  message: string;
  screening: IScreening;
}

export interface FetchScreeningsResponse {
  screenings: IScreening[];
  count: number;
}
