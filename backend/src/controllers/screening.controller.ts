import { Request, Response } from "express";
import { Cinema } from "../models/cinema.model";
import { Movie } from "../models/movie.model";
import { ScreeningTemplate } from "../models/template.model";
import { Screening } from "../models/screening.model";
import { Booking } from "../models/booking.model";
import { ICinemaRoom } from "../types/cinema.type";
import { IScreeningSeat } from "../types/screening.type";
import { canManageCinema } from "./cinema.controller";

// Converts a zero-based row index into a spreadsheet-style label (A, B, ... Z, AA, AB...).
export const rowLetter = (index: number): string => {
  let label = "";
  let i = index + 1;
  while (i > 0) {
    const rem = (i - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    i = Math.floor((i - 1) / 26);
  }
  return label;
};

// Creates a fresh seat instance list from a room's seat grid. Each screening
// gets its own copies, so "A3 at 10am" and "A3 at 3pm" are independent.
// Seat numbers auto-increment per bookable unit (walkways/stairs/empty and the
// second cell of a double pair are skipped).
export const materializeSeats = (
  room: ICinemaRoom,
  rowPrices: Record<string, number> | Map<string, number>,
): { seats: IScreeningSeat[]; error?: string } => {
  const seats: IScreeningSeat[] = [];
  // Mongoose stores Map fields as Map instances; normalize to a plain object.
  const prices: Record<string, number> =
    rowPrices instanceof Map ? Object.fromEntries(rowPrices) : rowPrices;

  for (let r = 0; r < room.rows; r++) {
    const rowLabel = rowLetter(r);
    const rowPrice = prices[rowLabel];
    const row = room.grid[r];
    let seatNumber = 0;

    for (let c = 0; c < row.length; c += 1) {
      const cell = row[c];
      if (cell !== "seat" && cell !== "double") continue;

      const isDouble = cell === "double";
      // A double seat is stored as two adjacent "double" cells and becomes one
      // bookable seat. The fallback keeps legacy one-cell doubles working.
      const hasPair = isDouble && row[c + 1] === "double";

      if (rowPrice === undefined || rowPrice <= 0) {
        return {
          seats,
          error: `Row ${rowLabel} has seats but no price configured in the template.`,
        };
      }

      seatNumber += 1;
      seats.push({
        label: `${rowLabel}${seatNumber}`,
        row: rowLabel,
        isDouble,
        price: isDouble ? rowPrice * 2 : rowPrice,
        status: "available",
      });

      if (hasPair) c += 1;
    }
  }

  return { seats };
};

const getManagedCinemaIds = async (
  userId: string,
  role: string,
  managedByOwnerId?: string,
) => {
  const ownerId = role === "cinema_staff" ? managedByOwnerId : userId;
  const cinemas = await Cinema.find({ ownerId }).select("_id");
  return cinemas.map((c) => c._id);
};

export const getScreeningsController = async (req: Request, res: Response) => {
  try {
    const cinemaIds = await getManagedCinemaIds(
      req.user!.id,
      req.user!.role,
      req.user!.managedByOwnerId,
    );

    const screenings = await Screening.find({ cinemaId: { $in: cinemaIds } })
      .populate("movieId", "title posterUrl durationMinutes")
      .populate("cinemaId", "name currency")
      .sort({ startTime: 1 });

    return res.status(200).json({
      message: "Screenings fetched successfully.",
      count: screenings.length,
      screenings,
    });
  } catch (error) {
    console.error("Fetch screenings error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching screenings." });
  }
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getPublicScreeningsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { cinemaId, movieId, date, q } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));

    const filter: Record<string, unknown> = {};

    if (cinemaId) {
      const cinema = await Cinema.findOne({ _id: cinemaId, status: "active" });
      if (!cinema) {
        return res.status(404).json({ message: "Cinema not found." });
      }
      filter.cinemaId = cinemaId;
    } else {
      const activeCinemas = await Cinema.find({ status: "active" }).select("_id");
      filter.cinemaId = { $in: activeCinemas.map((c) => c._id) };
    }

    if (movieId) filter.movieId = movieId;

    if (date) {
      const start = new Date(String(date));
      if (Number.isNaN(start.getTime())) {
        return res.status(400).json({ message: "Invalid date." });
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
        Movie.find({ title: regex }).select("_id"),
        Cinema.find({ name: regex, status: "active" }).select("_id"),
      ]);
      filter.$or = [
        { movieId: { $in: matchedMovies.map((m) => m._id) } },
        { cinemaId: { $in: matchedCinemas.map((c) => c._id) } },
      ];
    }

    const [screenings, total] = await Promise.all([
      Screening.find(filter)
        .populate("movieId", "title posterUrl backdropUrl durationMinutes contentRating")
        .populate("cinemaId", "name address phone email currency")
        .sort({ startTime: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Screening.countDocuments(filter),
    ]);

    return res.status(200).json({
      message: "Screenings fetched successfully.",
      count: screenings.length,
      total,
      page,
      limit,
      hasMore: page * limit < total,
      screenings,
    });
  } catch (error) {
    console.error("Fetch public screenings error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching screenings." });
  }
};

export const getPublicScreeningByIdController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const screening = await Screening.findOne({
      _id: id,
      startTime: { $gte: new Date() },
    })
      .populate("movieId", "title posterUrl backdropUrl durationMinutes contentRating")
      .populate(
        "cinemaId",
        "name address phone email allowPayInPerson currency status",
      );

    if (!screening) {
      return res.status(404).json({ message: "Screening not found." });
    }

    const populatedCinema = screening.cinemaId as unknown as {
      status?: string;
    };
    if (populatedCinema?.status !== "active") {
      return res.status(404).json({ message: "Screening not found." });
    }

    return res.status(200).json({
      message: "Screening retrieved successfully.",
      screening,
    });
  } catch (error) {
    console.error("Fetch public screening error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching screening." });
  }
};

// Each screening materializes its own seat instances from the room layout.
export const createScreeningController = async (req: Request, res: Response) => {
  try {
    const { templateId, startTime } = req.body || {};

    if (!templateId || !startTime) {
      return res
        .status(400)
        .json({ message: "templateId and startTime are required." });
    }

    const template = await ScreeningTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ message: "Screening template not found." });
    }

    const cinema = await Cinema.findById(template.cinemaId);
    if (!cinema) {
      return res.status(404).json({ message: "Cinema not found." });
    }
    if (!canManageCinema(req.user, cinema.ownerId)) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not manage this cinema." });
    }

    const movie = await Movie.findById(template.movieId);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    const room = cinema.rooms.find((r) => r.name === template.roomName);
    if (!room) {
      return res.status(400).json({ message: "Template room no longer exists." });
    }

    const start = new Date(String(startTime));
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid startTime." });
    }
    if (start.getTime() < Date.now()) {
      return res.status(400).json({ message: "startTime cannot be in the past." });
    }

    const { seats, error } = materializeSeats(room, template.rowPrices);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const endTime = new Date(
      start.getTime() + movie.durationMinutes * 60 * 1000,
    );

    // A room can only host one screening at a time. The interval-overlap
    // condition is `existing.start < new.end AND existing.end > new.start`.
    const clash = await Screening.findOne({
      cinemaId: template.cinemaId,
      roomName: template.roomName,
      startTime: { $lt: endTime },
      endTime: { $gt: start },
    }).select("_id");
    if (clash) {
      return res
        .status(409)
        .json({ message: "This room is already booked for that time." });
    }

    const screening = new Screening({
      templateId,
      cinemaId: template.cinemaId,
      movieId: template.movieId,
      roomName: template.roomName,
      startTime: start,
      endTime,
      seats,
      createdBy: req.user!.id,
    });
    await screening.save();

    return res.status(201).json({
      message: "Screening created successfully.",
      screening,
    });
  } catch (error) {
    console.error("Create screening error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error creating screening." });
  }
};

export const updateScreeningController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const screening = await Screening.findById(id);
    if (!screening) {
      return res.status(404).json({ message: "Screening not found." });
    }

    const cinema = await Cinema.findById(screening.cinemaId);
    if (!cinema || !canManageCinema(req.user, cinema.ownerId)) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not manage this cinema." });
    }

    if (req.body.startTime === undefined) {
      return res
        .status(400)
        .json({ message: "startTime is required to update." });
    }

    const start = new Date(String(req.body.startTime));
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid startTime." });
    }
    if (start.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "startTime cannot be in the past." });
    }

    const movie = await Movie.findById(screening.movieId);
    const duration = movie?.durationMinutes ?? 120;
    const endTime = new Date(start.getTime() + duration * 60 * 1000);

    const clash = await Screening.findOne({
      _id: { $ne: id },
      cinemaId: screening.cinemaId,
      roomName: screening.roomName,
      startTime: { $lt: endTime },
      endTime: { $gt: start },
    }).select("_id");
    if (clash) {
      return res
        .status(409)
        .json({ message: "This room is already booked for that time." });
    }

    const updated = await Screening.findByIdAndUpdate(
      id,
      { $set: { startTime: start, endTime } },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      message: "Screening updated successfully.",
      screening: updated,
    });
  } catch (error) {
    console.error("Update screening error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error updating screening." });
  }
};

export const deleteScreeningController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const screening = await Screening.findById(id);
    if (!screening) {
      return res.status(404).json({ message: "Screening not found." });
    }

    const cinema = await Cinema.findById(screening.cinemaId);
    if (!cinema || !canManageCinema(req.user, cinema.ownerId)) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not manage this cinema." });
    }

    // Deleting the screening would orphan its bookings (and break booking
    // history/population), so require the owner to resolve them first.
    const activeBookings = await Booking.countDocuments({
      screeningId: id,
      status: { $in: ["pending", "confirmed"] },
    });
    if (activeBookings > 0) {
      return res.status(409).json({
        message:
          "This screening has pending or confirmed bookings. Cancel them before deleting.",
      });
    }

    await Screening.findByIdAndDelete(id);

    return res.status(200).json({ message: "Screening deleted successfully." });
  } catch (error) {
    console.error("Delete screening error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error deleting screening." });
  }
};
