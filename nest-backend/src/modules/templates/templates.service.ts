import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { AuthUser } from "../../common/types/auth-user.type";
import { canManageCinema } from "../../common/utils/cinema.util";
import { handleError } from "../../common/utils/error.util";
import { Cinema } from "../cinemas/schemas/cinema.schema";
import { Movie } from "../movies/schemas/movie.schema";
import {
  ScreeningTemplate,
  type ScreeningTemplateDocument,
} from "./schemas/template.schema";

const validateRowPrices = (
  rowPrices: unknown,
): rowPrices is Record<string, number> => {
  if (!rowPrices || typeof rowPrices !== "object" || Array.isArray(rowPrices)) {
    return false;
  }
  const entries = Object.entries(rowPrices as Record<string, unknown>);
  return (
    entries.length > 0 &&
    entries.every(([, price]) => Number.isFinite(price) && Number(price) > 0)
  );
};

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(ScreeningTemplate.name)
    private readonly templateModel: Model<ScreeningTemplateDocument>,
    @InjectModel(Cinema.name) private readonly cinemaModel: Model<any>,
    @InjectModel(Movie.name) private readonly movieModel: Model<any>,
  ) {}

  private async getManagedCinemaIds(user: AuthUser): Promise<any[]> {
    const ownerId =
      user.role === "cinema_staff" ? user.managedByOwnerId : user.id;
    const cinemas = await this.cinemaModel.find({ ownerId }).select("_id");
    return cinemas.map((c: any) => c._id);
  }

  async getTemplates(user: AuthUser) {
    try {
      const cinemaIds = await this.getManagedCinemaIds(user);

      const templates = await this.templateModel
        .find({ cinemaId: { $in: cinemaIds } })
        .populate("movieId", "title posterUrl durationMinutes")
        .populate("cinemaId", "name currency")
        .sort({ createdAt: -1 });

      return {
        message: "Screening templates fetched successfully.",
        count: templates.length,
        templates,
      };
    } catch (error) {
      handleError(error, "Fetch templates error:", "Internal server error fetching templates.");
    }
  }

  async create(user: AuthUser, body: any) {
    try {
      const { cinemaId, movieId, roomName, rowPrices } = body || {};

      if (!cinemaId || !movieId || !roomName) {
        throw new BadRequestException(
          "cinemaId, movieId and roomName are required.",
        );
      }

      const cinema = await this.cinemaModel.findById(cinemaId);
      if (!cinema) {
        throw new NotFoundException("Cinema not found.");
      }
      if (!canManageCinema(user, cinema.ownerId)) {
        throw new ForbiddenException(
          "Access denied. You do not manage this cinema.",
        );
      }

      const room = cinema.rooms.find((r: any) => r.name === roomName);
      if (!room) {
        throw new BadRequestException("Room does not exist in cinema.");
      }

      const movie = await this.movieModel.findById(movieId);
      if (!movie) {
        throw new NotFoundException("Movie not found.");
      }

      if (!validateRowPrices(rowPrices)) {
        throw new BadRequestException(
          "Valid rowPrices map with positive prices is required.",
        );
      }

      const template = new this.templateModel({
        cinemaId,
        movieId,
        roomName,
        rowPrices,
        createdBy: user.id,
      });
      await template.save();

      return {
        message: "Screening template created successfully.",
        template,
      };
    } catch (error) {
      handleError(error, "Create template error:", "Internal server error creating template.");
    }
  }

  async update(user: AuthUser, id: string, body: any) {
    try {
      const template = await this.templateModel.findById(id);
      if (!template) {
        throw new NotFoundException("Template not found.");
      }

      const cinema = await this.cinemaModel.findById(template.cinemaId);
      if (!cinema || !canManageCinema(user, cinema.ownerId)) {
        throw new ForbiddenException(
          "Access denied. You do not manage this cinema.",
        );
      }

      const updateData: Record<string, unknown> = {};

      if (body.rowPrices !== undefined) {
        if (!validateRowPrices(body.rowPrices)) {
          throw new BadRequestException("Valid rowPrices map is required.");
        }
        updateData.rowPrices = body.rowPrices;
      }
      if (body.movieId !== undefined) {
        const movie = await this.movieModel.findById(body.movieId);
        if (!movie) {
          throw new NotFoundException("Movie not found.");
        }
        updateData.movieId = body.movieId;
      }
      if (body.roomName !== undefined) {
        if (!cinema.rooms.some((r: any) => r.name === body.roomName)) {
          throw new BadRequestException("Room does not exist in cinema.");
        }
        updateData.roomName = body.roomName;
      }

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("No fields provided to update.");
      }

      const updated = await this.templateModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );

      return {
        message: "Screening template updated successfully.",
        template: updated,
      };
    } catch (error) {
      handleError(error, "Update template error:", "Internal server error updating template.");
    }
  }

  async remove(user: AuthUser, id: string) {
    try {
      const template = await this.templateModel.findById(id);
      if (!template) {
        throw new NotFoundException("Template not found.");
      }

      const cinema = await this.cinemaModel.findById(template.cinemaId);
      if (!cinema || !canManageCinema(user, cinema.ownerId)) {
        throw new ForbiddenException(
          "Access denied. You do not manage this cinema.",
        );
      }

      await this.templateModel.findByIdAndDelete(id);

      return { message: "Template deleted successfully." };
    } catch (error) {
      handleError(error, "Delete template error:", "Internal server error deleting template.");
    }
  }
}
