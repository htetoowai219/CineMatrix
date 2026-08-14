import { Request, Response } from "express";
import { Booking } from "../models/booking.model";
import { Screening } from "../models/screening.model";
import { Cinema } from "../models/cinema.model";
import { Movie } from "../models/movie.model";
import { User } from "../models/user.model";
import { uploadImageToCloudinary } from "../utils/cloudinary.util";
import { canManageCinema } from "./cinema.controller";
import {
  acquireSeatLocks,
  releaseSeatLocks,
  isSeatLockedByOther,
  getSeatLockHolder,
  isRedisAvailable,
  LOCK_TTL_SECONDS,
} from "../utils/redis.util";
import { sendBookingStatusEmail } from "../utils/mailer.util";

const PAYMENT_SCREENSHOT_FOLDER = "cinematrix/payments";

// How long a pending booking keeps its seats before being auto-cancelled.
const PENDING_BOOKING_TTL_MS =
  (Number(process.env.PENDING_BOOKING_TTL_MINUTES) || 30) * 60 * 1000;

// Releases screening seats back to "available" for a set of labels.
const releaseSeats = async (screeningId: string, labels: string[]) => {
  if (labels.length === 0) return;
  await Screening.updateMany(
    { _id: screeningId, "seats.label": { $in: labels } },
    { $set: { "seats.$[elem].status": "available" } },
    { arrayFilters: [{ "elem.label": { $in: labels }, "elem.status": "booked" }] },
  );
};

// Marks a set of screening seats as held (used after a Redis lock is acquired).
const markSeatsHeld = async (screeningId: string, labels: string[]) => {
  if (labels.length === 0) return;
  await Screening.updateMany(
    { _id: screeningId, "seats.label": { $in: labels } },
    { $set: { "seats.$[elem].status": "held" } },
    { arrayFilters: [{ "elem.label": { $in: labels }, "elem.status": { $ne: "booked" } }] },
  );
};

// Marks held seats back to available (after a lock is released or expires).
const markSeatsAvailable = async (screeningId: string, labels: string[]) => {
  if (labels.length === 0) return;
  await Screening.updateMany(
    { _id: screeningId, "seats.label": { $in: labels } },
    { $set: { "seats.$[elem].status": "available" } },
    { arrayFilters: [{ "elem.label": { $in: labels }, "elem.status": "held" }] },
  );
};

// Sends a status-change email to the booking's owner. Failures are logged but
// never fail the request (email is a best-effort notification).
const notifyBookingStatus = async (booking: any, status: string) => {
  try {
    const screening = await Screening.findById(booking.screeningId);
    if (!screening) return;
    const [movie, cinema, user] = await Promise.all([
      Movie.findById(screening.movieId).select("title"),
      Cinema.findById(screening.cinemaId).select("name"),
      User.findById(booking.userId).select("email name"),
    ]);
    if (!movie || !cinema || !user?.email) return;

    await sendBookingStatusEmail({
      to: user.email,
      name: user.name,
      status: status as "confirmed" | "rejected" | "cancelled",
      movieTitle: movie.title,
      cinemaName: cinema.name,
      roomName: screening.roomName,
      startTime: new Date(screening.startTime),
      seats: booking.seats.map((s: { label: string }) => s.label),
      totalPrice: booking.totalPrice,
    });
  } catch (error) {
    console.error("Booking email error:", error);
  }
};

// Customer-only: uploads a payment screenshot and returns its URL.
export const uploadPaymentScreenshotController = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No payment screenshot uploaded." });
    }
    const { secure_url } = await uploadImageToCloudinary(
      req.file,
      PAYMENT_SCREENSHOT_FOLDER,
    );
    return res.status(200).json({
      message: "Payment screenshot uploaded successfully.",
      url: secure_url,
    });
  } catch (error) {
    console.error("Upload payment screenshot error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error uploading payment screenshot." });
  }
};

// Customer-only: locks seats on a screening for 10 minutes (Redis-backed).
// The seats are held so other customers cannot select them while the lock lives.
export const lockSeatsController = async (req: Request, res: Response) => {
  try {
    const { screeningId, seats } = req.body || {};
    if (!screeningId || !Array.isArray(seats) || seats.length === 0) {
      return res
        .status(400)
        .json({ message: "screeningId and at least one seat are required." });
    }

    const screening = await Screening.findById(screeningId);
    if (!screening) {
      return res.status(404).json({ message: "Screening not found." });
    }
    if (new Date(screening.startTime).getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "This screening has already started." });
    }

    const seatMap = new Map(screening.seats.map((s) => [s.label, s]));
    const labels: string[] = [];

    for (const label of seats) {
      const seat = seatMap.get(String(label));
      if (!seat) {
        return res
          .status(400)
          .json({ message: `Seat ${label} does not exist on this screening.` });
      }
      if (seat.status === "booked") {
        return res
          .status(409)
          .json({ message: `Seat ${seat.label} is already booked.` });
      }
      if (seat.status === "held") {
        const lockedByOther = await isSeatLockedByOther(
          String(screeningId),
          seat.label,
          req.user!.id,
        );
        if (lockedByOther) {
          return res.status(409).json({
            message: `Seat ${seat.label} is being held by another customer.`,
          });
        }
      }
      labels.push(seat.label);
    }

    const result = await acquireSeatLocks(String(screeningId), labels, req.user!.id);
    if (!result.ok) {
      return res.status(409).json({
        message: `Seat ${result.conflictingLabel} is being held by another customer.`,
      });
    }

    await markSeatsHeld(String(screeningId), labels);

    return res.status(200).json({
      message: `Seats locked for ${LOCK_TTL_SECONDS / 60} minutes.`,
      lockedSeats: labels,
      expiresInSeconds: LOCK_TTL_SECONDS,
    });
  } catch (error) {
    console.error("Lock seats error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error locking seats." });
  }
};

// Customer-only: releases a lock the customer holds on a screening's seats.
export const unlockSeatsController = async (req: Request, res: Response) => {
  try {
    const { screeningId, seats } = req.body || {};
    if (!screeningId || !Array.isArray(seats) || seats.length === 0) {
      return res
        .status(400)
        .json({ message: "screeningId and at least one seat are required." });
    }

    const labels = seats.map(String);
    await releaseSeatLocks(String(screeningId), labels, req.user!.id);
    await markSeatsAvailable(String(screeningId), labels);

    return res.status(200).json({ message: "Seats unlocked." });
  } catch (error) {
    console.error("Unlock seats error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error unlocking seats." });
  }
};

// Customer: creates a booking for a screening's seats (all seats must be
// available, or held by the requesting customer's own lock). Seats are marked
// booked atomically, the Redis lock is released, and the booking starts pending.
export const createBookingController = async (req: Request, res: Response) => {
  try {
    const { screeningId, seats, paymentMethod, paymentScreenshotUrl, notes } =
      req.body || {};

    if (!screeningId || !Array.isArray(seats) || seats.length === 0) {
      return res
        .status(400)
        .json({ message: "screeningId and at least one seat are required." });
    }

    if (paymentMethod !== "screenshot" && paymentMethod !== "in_person") {
      return res
        .status(400)
        .json({ message: "paymentMethod must be 'screenshot' or 'in_person'." });
    }

    const screening = await Screening.findById(screeningId);
    if (!screening) {
      return res.status(404).json({ message: "Screening not found." });
    }
    if (new Date(screening.startTime).getTime() < Date.now()) {
      return res.status(400).json({ message: "This screening has already started." });
    }

    if (paymentMethod === "in_person") {
      const cinema = await Cinema.findById(screening.cinemaId);
      if (!cinema?.allowPayInPerson) {
        return res.status(400).json({
          message: "This cinema does not accept in-person payment.",
        });
      }
    }
    if (paymentMethod === "screenshot" && !paymentScreenshotUrl) {
      return res
        .status(400)
        .json({ message: "A payment screenshot URL is required." });
    }

    const seatMap = new Map(screening.seats.map((s) => [s.label, s]));
    const requestedSeats: string[] = [];
    const bookingSeats = [];

    for (const label of seats) {
      const seat = seatMap.get(String(label));
      if (!seat) {
        return res
          .status(400)
          .json({ message: `Seat ${label} does not exist on this screening.` });
      }
      if (seat.status === "booked") {
        return res
          .status(409)
          .json({ message: `Seat ${label} is no longer available.` });
      }
      if (seat.status === "held") {
        const lockedByOther = await isSeatLockedByOther(
          String(screeningId),
          seat.label,
          req.user!.id,
        );
        if (lockedByOther) {
          return res
            .status(409)
            .json({ message: `Seat ${label} is being held by another customer.` });
        }
      }
      requestedSeats.push(seat.label);
      bookingSeats.push({
        label: seat.label,
        row: seat.row,
        isDouble: seat.isDouble,
        price: seat.price,
      });
    }

    // Atomically mark each requested seat as booked; roll back on conflict.
    for (const label of requestedSeats) {
      const result = await Screening.updateOne(
        { _id: screeningId, "seats.label": label },
        { $set: { "seats.$[elem].status": "booked" } },
        {
          arrayFilters: [
            { "elem.label": label, "elem.status": { $in: ["available", "held"] } },
          ],
        },
      );
      if (result.modifiedCount === 0) {
        await releaseSeats(String(screeningId), requestedSeats);
        return res.status(409).json({
          message: `Seat ${label} was taken by someone else. Please reselect seats.`,
        });
      }
    }

    const totalPrice = bookingSeats.reduce((sum, seat) => sum + seat.price, 0);

    const booking = new Booking({
      userId: req.user!.id,
      screeningId,
      seats: bookingSeats,
      totalPrice,
      paymentMethod,
      paymentScreenshotUrl,
      notes,
      status: "pending",
      expiresAt: new Date(Date.now() + PENDING_BOOKING_TTL_MS),
    });
    await booking.save();

    // The booking owns the seats now; drop the Redis hold so other seats
    // (if any were locked) and the lock namespace stay clean.
    try {
      await releaseSeatLocks(String(screeningId), requestedSeats, req.user!.id);
    } catch (error) {
      console.error("Release seat locks error:", error);
    }

    return res.status(201).json({
      message: "Booking submitted. Awaiting confirmation from the cinema.",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error creating booking." });
  }
};

// Customer: lists the requester's bookings.
export const getMyBookingsController = async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({ userId: req.user!.id })
      .populate({
        path: "screeningId",
        populate: [
          { path: "movieId", select: "title posterUrl durationMinutes" },
          { path: "cinemaId", select: "name address phone email" },
        ],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Bookings fetched successfully.",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Fetch my bookings error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching bookings." });
  }
};

// Admin/owner/staff: lists bookings. Admin sees every cinema's bookings,
// while owners and staff are scoped to their own cinemas (optional status filter).
export const getBookingsController = async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};

    if (req.user!.role !== "admin") {
      const ownerId =
        req.user!.role === "cinema_staff"
          ? req.user!.managedByOwnerId
          : req.user!.id;
      const cinemas = await Cinema.find({ ownerId }).select("_id");
      const cinemaIds = cinemas.map((c) => c._id);
      const screenings = await Screening.find({
        cinemaId: { $in: cinemaIds },
      }).select("_id");
      filter.screeningId = { $in: screenings.map((s) => s._id) };
    }

    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate("userId", "name email phone")
      .populate({
        path: "screeningId",
        populate: [
          { path: "movieId", select: "title posterUrl durationMinutes" },
          { path: "cinemaId", select: "name" },
        ],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Bookings fetched successfully.",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching bookings." });
  }
};

// Owner/staff: approves or rejects a booking. Rejection frees the seats.
export const updateBookingStatusController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { action } = req.body || {};

    if (action !== "approve" && action !== "reject") {
      return res
        .status(400)
        .json({ message: "action must be 'approve' or 'reject'." });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const screening = await Screening.findById(booking.screeningId);
    if (!screening) {
      return res.status(404).json({ message: "Screening not found." });
    }
    const cinema = await Cinema.findById(screening.cinemaId);
    if (!cinema || !canManageCinema(req.user, cinema.ownerId)) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not manage this cinema." });
    }

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Only pending bookings can be approved or rejected." });
    }

    const nextStatus = action === "approve" ? "confirmed" : "rejected";
    if (nextStatus === "rejected") {
      await releaseSeats(
        String(booking.screeningId),
        booking.seats.map((s) => s.label),
      );
    }

    booking.status = nextStatus;
    booking.expiresAt = undefined; // resolved before the payment window ended
    await booking.save();

    void notifyBookingStatus(booking, nextStatus);

    return res.status(200).json({
      message:
        nextStatus === "confirmed"
          ? "Booking confirmed."
          : "Booking rejected and seats released.",
      booking,
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error updating booking." });
  }
};

// Customer: cancels a pending booking and frees its seats.
export const cancelBookingController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, userId: req.user!.id });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        message: "Only pending bookings can be cancelled. Contact the cinema.",
      });
    }

    await releaseSeats(
      String(booking.screeningId),
      booking.seats.map((s) => s.label),
    );

    booking.status = "cancelled";
    booking.expiresAt = undefined;
    await booking.save();

    void notifyBookingStatus(booking, "cancelled");

    return res.status(200).json({
      message: "Booking cancelled and seats released.",
      booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error cancelling booking." });
  }
};

// Reverts seats whose Redis lock expired (key gone) but which are still marked
// "held" in Mongo. Runs periodically so the seat map stays accurate.
export const reconcileExpiredSeatLocks = async () => {
  try {
    if (!isRedisAvailable()) return;

    const screenings = await Screening.find({ "seats.status": "held" }).select(
      "_id seats",
    );

    for (const screening of screenings) {
      const heldSeats = screening.seats.filter((s) => s.status === "held");
      const expired: string[] = [];

      for (const seat of heldSeats) {
        const holder = await getSeatLockHolder(String(screening._id), seat.label);
        if (holder === null) expired.push(seat.label);
      }

      if (expired.length > 0) {
        await markSeatsAvailable(String(screening._id), expired);
      }
    }
  } catch (error) {
    console.error("Reconcile expired seat locks error:", error);
  }
};

// Cancels pending bookings whose payment window elapsed, releasing their seats.
// The Mongo TTL index also purges any that slip through.
export const expirePendingBookings = async () => {
  try {
    const now = new Date();
    const expired = await Booking.find({
      status: "pending",
      expiresAt: { $lte: now },
    });

    for (const booking of expired) {
      await releaseSeats(
        String(booking.screeningId),
        booking.seats.map((s) => s.label),
      );
      booking.status = "cancelled";
      booking.expiresAt = undefined;
      await booking.save();
    }

    if (expired.length > 0) {
      console.log(`Expired ${expired.length} pending booking(s).`);
    }
  } catch (error) {
    console.error("Expire pending bookings error:", error);
  }
};
