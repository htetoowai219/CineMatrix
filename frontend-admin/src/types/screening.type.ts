export type ScreeningSeatStatus = "available" | "held" | "booked";

export interface IScreeningSeat {
  label: string;
  row: string;
  isDouble: boolean;
  price: number;
  status: ScreeningSeatStatus;
}

export interface IScreening {
  _id?: string;
  templateId: string;
  cinemaId: string;
  movieId: string;
  roomName: string;
  startTime: string;
  endTime: string;
  seats: IScreeningSeat[];
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  movie?: { _id: string; title: string; posterUrl: string; durationMinutes: number };
  cinema?: { _id: string; name: string };
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
