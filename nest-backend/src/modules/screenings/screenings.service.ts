import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { AuthUser } from "../../common/types/auth-user.type";
import { canManageCinema } from "../../common/utils/cinema.util";
import { handleError } from "../../common/utils/error.util";
import { materializeSeats } from "../../common/utils/seating.util";
import { Booking } from "../bookings/schemas/booking.schema";
import { Cinema } from "../cinemas/schemas/cinema.schema";
import { Movie } from "../movies/schemas/movie.schema";
import { ScreeningTemplate } from "../templates/schemas/template.schema";
import { Screening, type ScreeningDocument } from "./schemas/screening.schema";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

@Injectable()
export class ScreeningsService {
  constructor(
    @InjectModel(Screening.name)
    private readonly screeningModel: Model<ScreeningDocument>,
    @InjectModel(Cinema.name) private readonly cinemaModel: Model<any>,
    @InjectModel(Movie.name) private readonly movieModel: Model<any>,
    @InjectModel(ScreeningTemplate.name) private readonly templateModel: Model<any>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<any>,
  ) {}

  private async getManagedCinemaIds(user: AuthUser): Promise<any[]> {
    const ownerId =
      user.role === "cinema_staff" ? user.managedByOwnerId : user.id;
    const cinemas = await this.cinemaModel.find({ ownerId }).select("_id");
    return cinemas.map((c: any) => c._id);
  }

  async getScreenings(user: AuthUser) {
    try {
      const cinemaIds = await this.getManagedCinemaIds(user);

      const screenings = await this.screeningModel
        .find({ cinemaId: { $in: cinemaIds } })
        .populate("movieId", "title posterUrl durationMinutes")
        .populate("cinemaId", "name currency")
        .sort({ startTime: 1 });

      return {
        message: "Screenings fetched successfully.",
        count: screenings.length,
        screenings,
      };
    } catch (error) {
      handleError(error, "Fetch screenings error:", "Internal server error fetching screenings.");
    }
  }

  async getPublicScreenings(query: Record<string, any>) {
    try {
      const { cinemaId, movieId, date, q } = query;
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(50, Math.max(1, Number(query.limit) || 12));

      const filter: Record<string, unknown> = {};

      if (cinemaId) {
        const cinema = await this.cinemaModel.findOne({
          _id: cinemaId,
          status: "active",
        });
        if (!cinema) {
          throw new NotFoundException("Cinema not found.");
        }
        filter.cinemaId = cinemaId;
      } else {
        const activeCinemas = await this.cinemaModel
          .find({ status: "active" })
          .select("_id");
        filter.cinemaId = { $in: activeCinemas.map((c: any) => c._id) };
      }

      if (movieId) filter.movieId = movieId;

      if (date) {
        const start = new Date(String(date));
        if (Number.isNaN(start.getTime())) {
          throw new BadRequestException("Invalid date.");
        }
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        filter.startTime = { $gte: start, $lt: end };
      } else {
        filter.startTime = { $gte: new Date() };
      }

      if (q && String(q).trim()) {
        const term = String(q).trim();
        const regex = new RegExp(escapeRegExp(term), "i");
        const [matchedMovies, matchedCinemas] = await Promise.all([
          this.movieModel.find({ title: regex }).select("_id"),
          this.cinemaModel.find({ name: regex, status: "active" }).select("_id"),
        ]);
        filter.$or = [
          { movieId: { $in: matchedMovies.map((m: any) => m._id) } },
          { cinemaId: { $in: matchedCinemas.map((c: any) => c._id) } },
        ];
      }

      const [screenings, total] = await Promise.all([
        this.screeningModel
          .find(filter)
          .populate(
            "movieId",
            "title posterUrl backdropUrl durationMinutes contentRating",
          )
          .populate("cinemaId", "name address phone email currency")
          .sort({ startTime: 1 })
          .skip((page - 1) * limit)
          .limit(limit),
        this.screeningModel.countDocuments(filter),
      ]);

      return {
        message: "Screenings fetched successfully.",
        count: screenings.length,
        total,
        page,
        limit,
        hasMore: page * limit < total,
        screenings,
      };
    } catch (error) {
      handleError(error, "Fetch public screenings error:", "Internal server error fetching screenings.");
    }
  }

  async getPublicScreeningById(id: string) {
    try {
      const screening = await this.screeningModel
        .findOne({ _id: id, startTime: { $gte: new Date() } })
        .populate(
          "movieId",
          "title posterUrl backdropUrl durationMinutes contentRating",
        )
        .populate(
          "cinemaId",
          "name address phone email allowPayInPerson currency status",
        );

      if (!screening) {
        throw new NotFoundException("Screening not found.");
      }

      const populatedCinema = screening.cinemaId as unknown as {
        status?: string;
      };
      if (populatedCinema?.status !== "active") {
        throw new NotFoundException("Screening not found.");
      }

      return {
        message: "Screening retrieved successfully.",
        screening,
      };
    } catch (error) {
      handleError(error, "Fetch public screening error:", "Internal server error fetching screening.");
    }
  }

  async create(user: AuthUser, body: any) {
    try {
      const { templateId, startTime } = body || {};

      if (!templateId || !startTime) {
        throw new BadRequestException(
          "templateId and startTime are required.",
        );
      }

      const template = await this.templateModel.findById(templateId);
      if (!template) {
        throw new NotFoundException("Screening template not found.");
      }

      const cinema = await this.cinemaModel.findById(template.cinemaId);
      if (!cinema) {
        throw new NotFoundException("Cinema not found.");
      }
      if (!canManageCinema(user, cinema.ownerId)) {
        throw new ForbiddenException(
          "Access denied. You do not manage this cinema.",
        );
      }

      const movie = await this.movieModel.findById(template.movieId);
      if (!movie) {
        throw new NotFoundException("Movie not found.");
      }

      const room = cinema.rooms.find((r: any) => r.name === template.roomName);
      if (!room) {
        throw new BadRequestException("Template room no longer exists.");
      }

      const start = new Date(String(startTime));
      if (Number.isNaN(start.getTime())) {
        throw new BadRequestException("Invalid startTime.");
      }
      if (start.getTime() < Date.now()) {
        throw new BadRequestException("startTime cannot be in the past.");
      }

      const { seats, error } = materializeSeats(room, template.rowPrices);
      if (error) {
        throw new BadRequestException(error);
      }

      const endTime = new Date(
        start.getTime() + movie.durationMinutes * 60 * 1000,
      );

      const clash = await this.screeningModel
        .findOne({
          cinemaId: template.cinemaId,
          roomName: template.roomName,
          startTime: { $lt: endTime },
          endTime: { $gt: start },
        })
        .select("_id");
      if (clash) {
        throw new ConflictException(
          "This room is already booked for that time.",
        );
      }

      const screening = new this.screeningModel({
        templateId,
        cinemaId: template.cinemaId,
        movieId: template.movieId,
        roomName: template.roomName,
        startTime: start,
        endTime,
        seats,
        createdBy: user.id,
      });
      await screening.save();

      return {
        message: "Screening created successfully.",
        screening,
      };
    } catch (error) {
      handleError(error, "Create screening error:", "Internal server error creating screening.");
    }
  }

  async update(user: AuthUser, id: string, body: any) {
    try {
      const screening = await this.screeningModel.findById(id);
      if (!screening) {
        throw new NotFoundException("Screening not found.");
      }

      const cinema = await this.cinemaModel.findById(screening.cinemaId);
      if (!cinema || !canManageCinema(user, cinema.ownerId)) {
        throw new ForbiddenException(
          "Access denied. You do not manage this cinema.",
        );
      }

      if (body.startTime === undefined) {
        throw new BadRequestException("startTime is required to update.");
      }

      const start = new Date(String(body.startTime));
      if (Number.isNaN(start.getTime())) {
        throw new BadRequestException("Invalid startTime.");
      }
      if (start.getTime() < Date.now()) {
        throw new BadRequestException("startTime cannot be in the past.");
      }

      const movie = await this.movieModel.findById(screening.movieId);
      const duration = movie?.durationMinutes ?? 120;
      const endTime = new Date(start.getTime() + duration * 60 * 1000);

      const clash = await this.screeningModel
        .findOne({
          _id: { $ne: id },
          cinemaId: screening.cinemaId,
          roomName: screening.roomName,
          startTime: { $lt: endTime },
          endTime: { $gt: start },
        })
        .select("_id");
      if (clash) {
        throw new ConflictException(
          "This room is already booked for that time.",
        );
      }

      const updated = await this.screeningModel.findByIdAndUpdate(
        id,
        { $set: { startTime: start, endTime } },
        { new: true, runValidators: true },
      );

      return {
        message: "Screening updated successfully.",
        screening: updated,
      };
    } catch (error) {
      handleError(error, "Update screening error:", "Internal server error updating screening.");
    }
  }

  async remove(user: AuthUser, id: string) {
    try {
      const screening = await this.screeningModel.findById(id);
      if (!screening) {
        throw new NotFoundException("Screening not found.");
      }

      const cinema = await this.cinemaModel.findById(screening.cinemaId);
      if (!cinema || !canManageCinema(user, cinema.ownerId)) {
        throw new ForbiddenException(
          "Access denied. You do not manage this cinema.",
        );
      }

      const activeBookings = await this.bookingModel.countDocuments({
        screeningId: id,
        status: { $in: ["pending", "confirmed"] },
      });
      if (activeBookings > 0) {
        throw new ConflictException(
          "This screening has pending or confirmed bookings. Cancel them before deleting.",
        );
      }

      await this.screeningModel.findByIdAndDelete(id);

      return { message: "Screening deleted successfully." };
    } catch (error) {
      handleError(error, "Delete screening error:", "Internal server error deleting screening.");
    }
  }
}
