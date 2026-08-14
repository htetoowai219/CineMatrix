import { Request, Response } from "express";
import { Cinema } from "../models/cinema.model";
import { Movie } from "../models/movie.model";
import { ScreeningTemplate } from "../models/template.model";
import { canManageCinema } from "./cinema.controller";

// Returns the ids of cinemas the requesting owner/staff can manage.
const getManagedCinemaIds = async (
  userId: string,
  role: string,
  managedByOwnerId?: string,
) => {
  const ownerId = role === "cinema_staff" ? managedByOwnerId : userId;
  const cinemas = await Cinema.find({ ownerId }).select("_id");
  return cinemas.map((c) => c._id);
};

const validateRowPrices = (rowPrices: unknown): rowPrices is Record<string, number> => {
  if (!rowPrices || typeof rowPrices !== "object" || Array.isArray(rowPrices)) {
    return false;
  }
  const entries = Object.entries(rowPrices as Record<string, unknown>);
  return (
    entries.length > 0 &&
    entries.every(([, price]) => Number.isFinite(price) && Number(price) > 0)
  );
};

// Lists all screening templates for the cinemas managed by the requester.
export const getTemplatesController = async (req: Request, res: Response) => {
  try {
    const cinemaIds = await getManagedCinemaIds(
      req.user!.id,
      req.user!.role,
      req.user!.managedByOwnerId,
    );

    const templates = await ScreeningTemplate.find({
      cinemaId: { $in: cinemaIds },
    })
      .populate("movieId", "title posterUrl durationMinutes")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Screening templates fetched successfully.",
      count: templates.length,
      templates,
    });
  } catch (error) {
    console.error("Fetch templates error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching templates." });
  }
};

// Creates a screening template (movie + room + price per row).
export const createTemplateController = async (req: Request, res: Response) => {
  try {
    const { cinemaId, movieId, roomName, rowPrices } = req.body || {};

    if (!cinemaId || !movieId || !roomName) {
      return res
        .status(400)
        .json({ message: "cinemaId, movieId and roomName are required." });
    }

    const cinema = await Cinema.findById(cinemaId);
    if (!cinema) {
      return res.status(404).json({ message: "Cinema not found." });
    }
    if (!canManageCinema(req.user, cinema.ownerId)) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not manage this cinema." });
    }

    const room = cinema.rooms.find((r) => r.name === roomName);
    if (!room) {
      return res.status(400).json({ message: "Room does not exist in cinema." });
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    if (!validateRowPrices(rowPrices)) {
      return res
        .status(400)
        .json({ message: "Valid rowPrices map with positive prices is required." });
    }

    const template = new ScreeningTemplate({
      cinemaId,
      movieId,
      roomName,
      rowPrices,
      createdBy: req.user!.id,
    });
    await template.save();

    return res.status(201).json({
      message: "Screening template created successfully.",
      template,
    });
  } catch (error) {
    console.error("Create template error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error creating template." });
  }
};

// Updates a screening template.
export const updateTemplateController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await ScreeningTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }

    const cinema = await Cinema.findById(template.cinemaId);
    if (!cinema || !canManageCinema(req.user, cinema.ownerId)) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not manage this cinema." });
    }

    const updateData: Record<string, unknown> = {};

    if (req.body.rowPrices !== undefined) {
      if (!validateRowPrices(req.body.rowPrices)) {
        return res
          .status(400)
          .json({ message: "Valid rowPrices map is required." });
      }
      updateData.rowPrices = req.body.rowPrices;
    }
    if (req.body.movieId !== undefined) {
      const movie = await Movie.findById(req.body.movieId);
      if (!movie) {
        return res.status(404).json({ message: "Movie not found." });
      }
      updateData.movieId = req.body.movieId;
    }
    if (req.body.roomName !== undefined) {
      if (!cinema.rooms.some((r) => r.name === req.body.roomName)) {
        return res
          .status(400)
          .json({ message: "Room does not exist in cinema." });
      }
      updateData.roomName = req.body.roomName;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." });
    }

    const updated = await ScreeningTemplate.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      message: "Screening template updated successfully.",
      template: updated,
    });
  } catch (error) {
    console.error("Update template error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error updating template." });
  }
};

// Deletes a screening template.
export const deleteTemplateController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await ScreeningTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found." });
    }

    const cinema = await Cinema.findById(template.cinemaId);
    if (!cinema || !canManageCinema(req.user, cinema.ownerId)) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not manage this cinema." });
    }

    await ScreeningTemplate.findByIdAndDelete(id);

    return res.status(200).json({ message: "Template deleted successfully." });
  } catch (error) {
    console.error("Delete template error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error deleting template." });
  }
};
