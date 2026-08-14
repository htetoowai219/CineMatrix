export type ScreeningTemplateMovieRef = {
  _id: string;
  title: string;
  posterUrl: string;
  durationMinutes: number;
};

export interface IScreeningTemplate {
  _id?: string;
  cinemaId: string;
  movieId: string;
  roomName: string;
  rowPrices: Record<string, number>;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  movie?: ScreeningTemplateMovieRef;
  cinema?: { _id: string; name: string };
}

export interface CreateTemplatePayload {
  cinemaId: string;
  movieId: string;
  roomName: string;
  rowPrices: Record<string, number>;
}

export interface UpdateTemplatePayload {
  movieId?: string;
  roomName?: string;
  rowPrices?: Record<string, number>;
}

export interface TemplateMutationResponse {
  message: string;
  template: IScreeningTemplate;
}

export interface FetchTemplatesResponse {
  templates: IScreeningTemplate[];
  count: number;
}
