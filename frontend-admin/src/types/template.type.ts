export type ScreeningTemplateMovieRef = {
  _id: string;
  title: string;
  posterUrl: string;
  durationMinutes: number;
};

export type ScreeningTemplateCinemaRef = {
  _id: string;
  name: string;
  currency?: string;
};

export interface IScreeningTemplate {
  _id?: string;
  cinemaId: string | ScreeningTemplateCinemaRef;
  movieId: string | ScreeningTemplateMovieRef;
  roomName: string;
  rowPrices: Record<string, number>;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  movie?: ScreeningTemplateMovieRef;
  cinema?: ScreeningTemplateCinemaRef;
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
