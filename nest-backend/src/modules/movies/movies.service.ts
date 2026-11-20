import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { AuthUser } from "../../common/types/auth-user.type";
import { handleError } from "../../common/utils/error.util";
import { toArray } from "../../common/utils/cinema.util";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { TmdbService } from "../tmdb/tmdb.service";
import { Movie, type MovieDocument } from "./schemas/movie.schema";

const POSTER_FOLDER = "cinematrix/movies/posters";
const BACKDROP_FOLDER = "cinematrix/movies/backdrops";

type MovieUploadFiles = {
  posterImage?: Express.Multer.File[];
  backdropImage?: Express.Multer.File[];
};

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private readonly movieModel: Model<MovieDocument>,
    private readonly cloudinary: CloudinaryService,
    private readonly tmdb: TmdbService,
  ) {}

  async getAllMovies(query: Record<string, any>) {
    try {
      const { status, genre } = query;
      const filter: Record<string, unknown> = {};

      if (status) filter.status = status;
      if (genre) filter.genres = genre;

      const movies = await this.movieModel.find(filter).sort({ createdAt: -1 });

      return {
        message: "Movies fetched successfully.",
        count: movies.length,
        movies,
      };
    } catch (error) {
      handleError(error, "Fetch movies error:", "Internal server error fetching movies.");
    }
  }

  async getMovieById(id: string) {
    try {
      const movie = await this.movieModel.findById(id);

      if (!movie) {
        throw new NotFoundException("Movie not found.");
      }

      return {
        message: "Movie retrieved successfully.",
        movie,
      };
    } catch (error) {
      handleError(error, "Fetch movie by ID error:", "Internal server error fetching movie details.");
    }
  }

  async create(user: AuthUser | undefined, body: any, files?: MovieUploadFiles) {
    try {
      if (user?.role !== "admin") {
        throw new ForbiddenException("Access denied. Admin role required.");
      }

      const {
        title,
        tagline,
        synopsis,
        durationMinutes,
        releaseDate,
        originalLanguage,
        contentRating,
        trailerUrl,
        director,
        status,
        createdByCinemaId,
      } = body;

      let posterUrl = body.posterUrl;
      let backdropUrl = body.backdropUrl;

      if (files?.posterImage?.[0]) {
        const { secure_url } = await this.cloudinary.uploadImageToCloudinary(
          files.posterImage[0],
          POSTER_FOLDER,
        );
        posterUrl = secure_url;
      }

      if (files?.backdropImage?.[0]) {
        const { secure_url } = await this.cloudinary.uploadImageToCloudinary(
          files.backdropImage[0],
          BACKDROP_FOLDER,
        );
        backdropUrl = secure_url;
      }

      if (
        !title ||
        !synopsis ||
        !durationMinutes ||
        !releaseDate ||
        !originalLanguage ||
        !contentRating ||
        !director
      ) {
        throw new BadRequestException("Missing required movie fields.");
      }

      if (!posterUrl || !backdropUrl) {
        throw new BadRequestException(
          "Poster and backdrop images are required.",
        );
      }

      const newMovie = new this.movieModel({
        title,
        tagline,
        synopsis,
        durationMinutes,
        releaseDate,
        originalLanguage,
        contentRating,
        posterUrl,
        backdropUrl,
        trailerUrl,
        director,
        castMembers: toArray(body.castMembers),
        genres: toArray(body.genres),
        status,
        createdByCinemaId,
      });

      await newMovie.save();

      return {
        message: "Movie created successfully.",
        movie: newMovie,
      };
    } catch (error) {
      handleError(error, "Create movie error:", "Internal server error creating movie.");
    }
  }

  async tmdbSearch(user: AuthUser | undefined, query: Record<string, any>) {
    try {
      if (user?.role !== "admin") {
        throw new ForbiddenException("Access denied. Admin role required.");
      }
      if (!this.tmdb.isTmdbConfigured()) {
        throw new ServiceUnavailableException(
          "TMDB integration is not configured (TMDB_API_KEY missing).",
        );
      }

      const searchQuery = String(query.q || "").trim();
      if (!searchQuery) {
        throw new BadRequestException("Search query is required.");
      }

      const year = query.year ? Number(query.year) : undefined;
      const results = await this.tmdb.searchTmdbMovies(searchQuery, year);

      return {
        message: "TMDB search results.",
        count: results.length,
        results,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : "TMDB search failed.";
      console.error("TMDB search error:", error);
      throw new BadGatewayException(message);
    }
  }

  async tmdbImport(user: AuthUser | undefined, body: any) {
    try {
      if (user?.role !== "admin") {
        throw new ForbiddenException("Access denied. Admin role required.");
      }
      if (!this.tmdb.isTmdbConfigured()) {
        throw new ServiceUnavailableException(
          "TMDB integration is not configured (TMDB_API_KEY missing).",
        );
      }

      const tmdbId = Number(body.tmdbId);
      if (!Number.isInteger(tmdbId)) {
        throw new BadRequestException("A valid tmdbId is required.");
      }

      const data = await this.tmdb.getTmdbMovie(tmdbId);

      const existing = await this.movieModel.findOne({ title: data.title });
      if (existing) {
        throw new ConflictException(
          `"${data.title}" already exists in the database.`,
        );
      }

      const movie = new this.movieModel({
        title: data.title,
        tagline: data.tagline,
        synopsis: data.synopsis,
        durationMinutes: data.durationMinutes,
        releaseDate: new Date(data.releaseDate),
        originalLanguage: data.originalLanguage,
        contentRating: data.contentRating,
        posterUrl: data.posterUrl,
        backdropUrl: data.backdropUrl,
        trailerUrl: data.trailerUrl,
        director: data.director,
        castMembers: data.castMembers,
        genres: data.genres,
        status: "UPCOMING",
      });
      await movie.save();

      return {
        message: `"${movie.title}" imported from TMDB.`,
        movie,
      };
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : "TMDB import failed.";
      console.error("TMDB import error:", error);
      throw new BadGatewayException(message);
    }
  }

  async update(
    user: AuthUser | undefined,
    id: string,
    body: any,
    files?: MovieUploadFiles,
  ) {
    try {
      if (user?.role !== "admin") {
        throw new ForbiddenException("Access denied. Admin role required.");
      }

      const updateData: Record<string, unknown> = { ...body };

      delete updateData.posterImage;
      delete updateData.backdropImage;
      delete updateData.averageScore;

      if (files?.posterImage?.[0]) {
        const { secure_url } = await this.cloudinary.uploadImageToCloudinary(
          files.posterImage[0],
          POSTER_FOLDER,
        );
        updateData.posterUrl = secure_url;
      }

      if (files?.backdropImage?.[0]) {
        const { secure_url } = await this.cloudinary.uploadImageToCloudinary(
          files.backdropImage[0],
          BACKDROP_FOLDER,
        );
        updateData.backdropUrl = secure_url;
      }

      if (updateData.castMembers !== undefined) {
        updateData.castMembers = toArray(updateData.castMembers);
      }
      if (updateData.genres !== undefined) {
        updateData.genres = toArray(updateData.genres);
      }

      if (!id) {
        throw new BadRequestException("Movie ID is required.");
      }

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("No fields provided to update.");
      }

      const updatedMovie = await this.movieModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (!updatedMovie) {
        throw new NotFoundException("Movie not found.");
      }

      return {
        message: "Movie updated successfully.",
        movie: updatedMovie,
      };
    } catch (error) {
      handleError(error, "Update movie error:", "Internal server error updating movie.");
    }
  }

  async remove(user: AuthUser | undefined, id: string) {
    try {
      if (user?.role !== "admin") {
        throw new ForbiddenException("Access denied. Admin role required.");
      }

      const deletedMovie = await this.movieModel.findByIdAndDelete(id);

      if (!deletedMovie) {
        throw new NotFoundException("Movie not found.");
      }

      return { message: "Movie deleted successfully." };
    } catch (error) {
      handleError(error, "Delete movie error:", "Internal server error deleting movie.");
    }
  }
}
