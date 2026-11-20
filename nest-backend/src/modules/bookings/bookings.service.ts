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
import { handleError } from "../../common/utils/error.util";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { Cinema } from "../cinemas/schemas/cinema.schema";
import { MailerService } from "../mailer/mailer.service";
import { Movie } from "../movies/schemas/movie.schema";
import {
  LOCK_TTL_SECONDS,
  RedisService,
} from "../redis/redis.service";
import { Screening } from "../screenings/schemas/screening.schema";
import { User } from "../users/schemas/user.schema";
import { Booking, type BookingDocument } from "./schemas/booking.schema";

const PAYMENT_SCREENSHOT_FOLDER = "cinematrix/payments";

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Screening.name) private readonly screeningModel: Model<any>,
    @InjectModel(Cinema.name) private readonly cinemaModel: Model<any>,
    @InjectModel(Movie.name) private readonly movieModel: Model<any>,
    @InjectModel(User.name) private readonly userModel: Model<any>,
    private readonly cloudinary: CloudinaryService,
    private readonly redis: RedisService,
    private readonly mailer: MailerService,
  ) {}

  // Tenant booking management is limited to owners and their staff. Admins are
  // intentionally excluded, so this must not use the broader cinema helper.
  private getTenantOwnerId(user: AuthUser | undefined): string | undefined {
    return user?.role === "cinema_staff" ? user.managedByOwnerId : user?.id;
  }

  private canManageTenantCinema(
    user: AuthUser | undefined,
    cinemaOwnerId: unknown,
  ): boolean {
    const ownerId = this.getTenantOwnerId(user);
    return Boolean(ownerId && String(cinemaOwnerId) === String(ownerId));
  }

  private async releaseSeats(screeningId: string, labels: string[]) {
    if (labels.length === 0) return;
    await this.screeningModel.updateMany(
      { _id: screeningId, "seats.label": { $in: labels } },
      { $set: { "seats.$[elem].status": "available" } },
      {
        arrayFilters: [
          { "elem.label": { $in: labels }, "elem.status": "booked" },
        ],
      },
    );
  }

  private async markSeatsHeld(screeningId: string, labels: string[]) {
    if (labels.length === 0) return;
    await this.screeningModel.updateMany(
      { _id: screeningId, "seats.label": { $in: labels } },
      { $set: { "seats.$[elem].status": "held" } },
      {
        arrayFilters: [
          { "elem.label": { $in: labels }, "elem.status": { $ne: "booked" } },
        ],
      },
    );
  }

  private async markSeatsAvailable(screeningId: string, labels: string[]) {
    if (labels.length === 0) return;
    await this.screeningModel.updateMany(
      { _id: screeningId, "seats.label": { $in: labels } },
      { $set: { "seats.$[elem].status": "available" } },
      {
        arrayFilters: [
          { "elem.label": { $in: labels }, "elem.status": "held" },
        ],
      },
    );
  }

  private async notifyBookingStatus(booking: any, status: string) {
    try {
      const screening = await this.screeningModel.findById(booking.screeningId);
      if (!screening) return;
      const [movie, cinema, user] = await Promise.all([
        this.movieModel.findById(screening.movieId).select("title"),
        this.cinemaModel.findById(screening.cinemaId).select("name"),
        this.userModel.findById(booking.userId).select("email name"),
      ]);
      if (!movie || !cinema || !user?.email) return;

      await this.mailer.sendBookingStatusEmail({
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
  }

  async uploadPaymentScreenshot(file?: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException("No payment screenshot uploaded.");
      }
      const { secure_url } = await this.cloudinary.uploadImageToCloudinary(
        file,
        PAYMENT_SCREENSHOT_FOLDER,
      );
      return {
        message: "Payment screenshot uploaded successfully.",
        url: secure_url,
      };
    } catch (error) {
      handleError(error, "Upload payment screenshot error:", "Internal server error uploading payment screenshot.");
    }
  }

  async lockSeats(user: AuthUser, body: any) {
    try {
      const { screeningId, seats } = body || {};
      if (!screeningId || !Array.isArray(seats) || seats.length === 0) {
        throw new BadRequestException(
          "screeningId and at least one seat are required.",
        );
      }

      const screening = await this.screeningModel.findById(screeningId);
      if (!screening) {
        throw new NotFoundException("Screening not found.");
      }
      if (new Date(screening.startTime).getTime() < Date.now()) {
        throw new BadRequestException("This screening has already started.");
      }

      const seatMap = new Map<string, any>(
        screening.seats.map((s: any) => [String(s.label), s] as [string, any]),
      );
      const labels: string[] = [];

      for (const label of seats) {
        const seat = seatMap.get(String(label));
        if (!seat) {
          throw new BadRequestException(
            `Seat ${label} does not exist on this screening.`,
          );
        }
        if (seat.status === "booked") {
          throw new ConflictException(`Seat ${seat.label} is already booked.`);
        }
        if (seat.status === "held") {
          const lockedByOther = await this.redis.isSeatLockedByOther(
            String(screeningId),
            seat.label,
            user.id,
          );
          if (lockedByOther) {
            throw new ConflictException(
              `Seat ${seat.label} is being held by another customer.`,
            );
          }
        }
        labels.push(seat.label);
      }

      const result = await this.redis.acquireSeatLocks(
        String(screeningId),
        labels,
        user.id,
      );
      if (!result.ok) {
        const conflict = result as { ok: false; conflictingLabel: string };
        throw new ConflictException(
          `Seat ${conflict.conflictingLabel} is being held by another customer.`,
        );
      }

      await this.markSeatsHeld(String(screeningId), labels);

      return {
        message: `Seats locked for ${LOCK_TTL_SECONDS / 60} minutes.`,
        lockedSeats: labels,
        expiresInSeconds: LOCK_TTL_SECONDS,
      };
    } catch (error) {
      handleError(error, "Lock seats error:", "Internal server error locking seats.");
    }
  }

  async unlockSeats(user: AuthUser, body: any) {
    try {
      const { screeningId, seats } = body || {};
      if (!screeningId || !Array.isArray(seats) || seats.length === 0) {
        throw new BadRequestException(
          "screeningId and at least one seat are required.",
        );
      }

      const labels = seats.map(String);
      await this.redis.releaseSeatLocks(String(screeningId), labels, user.id);
      await this.markSeatsAvailable(String(screeningId), labels);

      return { message: "Seats unlocked." };
    } catch (error) {
      handleError(error, "Unlock seats error:", "Internal server error unlocking seats.");
    }
  }

  async createBooking(user: AuthUser, body: any) {
    try {
      const { screeningId, seats, paymentMethod, paymentScreenshotUrl, notes } =
        body || {};

      if (!screeningId || !Array.isArray(seats) || seats.length === 0) {
        throw new BadRequestException(
          "screeningId and at least one seat are required.",
        );
      }

      if (paymentMethod !== "screenshot" && paymentMethod !== "in_person") {
        throw new BadRequestException(
          "paymentMethod must be 'screenshot' or 'in_person'.",
        );
      }

      const screening = await this.screeningModel.findById(screeningId);
      if (!screening) {
        throw new NotFoundException("Screening not found.");
      }
      if (new Date(screening.startTime).getTime() < Date.now()) {
        throw new BadRequestException("This screening has already started.");
      }

      const cinema = await this.cinemaModel.findById(screening.cinemaId);
      if (!cinema || cinema.status !== "active") {
        throw new NotFoundException("Screening not found.");
      }

      if (paymentMethod === "in_person" && !cinema.allowPayInPerson) {
        throw new BadRequestException(
          "This cinema does not accept in-person payment.",
        );
      }
      if (paymentMethod === "screenshot" && !paymentScreenshotUrl) {
        throw new BadRequestException(
          "A payment screenshot URL is required.",
        );
      }

      const seatMap = new Map<string, any>(
        screening.seats.map((s: any) => [String(s.label), s] as [string, any]),
      );
      const requestedSeats: string[] = [];
      const bookingSeats: any[] = [];

      for (const label of seats) {
        const seat = seatMap.get(String(label));
        if (!seat) {
          throw new BadRequestException(
            `Seat ${label} does not exist on this screening.`,
          );
        }
        if (seat.status === "booked") {
          throw new ConflictException(
            `Seat ${label} is no longer available.`,
          );
        }
        if (seat.status === "held") {
          const lockedByOther = await this.redis.isSeatLockedByOther(
            String(screeningId),
            seat.label,
            user.id,
          );
          if (lockedByOther) {
            throw new ConflictException(
              `Seat ${label} is being held by another customer.`,
            );
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

      const bookedLabels: string[] = [];
      for (const label of requestedSeats) {
        const result = await this.screeningModel.updateOne(
          { _id: screeningId, "seats.label": label },
          { $set: { "seats.$[elem].status": "booked" } },
          {
            arrayFilters: [
              {
                "elem.label": label,
                "elem.status": { $in: ["available", "held"] },
              },
            ],
          },
        );
        if (result.modifiedCount === 0) {
          await this.releaseSeats(String(screeningId), bookedLabels);
          throw new ConflictException(
            `Seat ${label} was taken by someone else. Please reselect seats.`,
          );
        }
        bookedLabels.push(label);
      }

      const totalPrice = bookingSeats.reduce(
        (sum, seat) => sum + seat.price,
        0,
      );

      const booking = new this.bookingModel({
        userId: user.id,
        screeningId,
        seats: bookingSeats,
        totalPrice,
        paymentMethod,
        paymentScreenshotUrl,
        notes,
        status: "pending",
      });
      await booking.save();

      try {
        await this.redis.releaseSeatLocks(
          String(screeningId),
          requestedSeats,
          user.id,
        );
      } catch (error) {
        console.error("Release seat locks error:", error);
      }

      return {
        message: "Booking submitted. Awaiting confirmation from the cinema.",
        booking,
      };
    } catch (error) {
      handleError(error, "Create booking error:", "Internal server error creating booking.");
    }
  }

  async getMyBookings(user: AuthUser) {
    try {
      const bookings = await this.bookingModel
        .find({ userId: user.id })
        .populate({
          path: "screeningId",
          populate: [
            { path: "movieId", select: "title posterUrl durationMinutes" },
            { path: "cinemaId", select: "name address phone email currency" },
          ],
        })
        .sort({ createdAt: -1 });

      return {
        message: "Bookings fetched successfully.",
        count: bookings.length,
        bookings,
      };
    } catch (error) {
      handleError(error, "Fetch my bookings error:", "Internal server error fetching bookings.");
    }
  }

  async getBookings(user: AuthUser | undefined, query: Record<string, any>) {
    try {
      const ownerId = this.getTenantOwnerId(user);
      if (!ownerId) {
        throw new ForbiddenException(
          "Access denied. You do not manage any cinemas.",
        );
      }

      const cinemas = await this.cinemaModel.find({ ownerId }).select("_id");
      const cinemaIds = cinemas.map((c: any) => c._id);
      const screenings = await this.screeningModel
        .find({ cinemaId: { $in: cinemaIds } })
        .select("_id");
      const filter: Record<string, unknown> = {
        screeningId: { $in: screenings.map((s: any) => s._id) },
      };

      if (query.status) filter.status = query.status;

      const bookings = await this.bookingModel
        .find(filter)
        .populate("userId", "name email phone")
        .populate({
          path: "screeningId",
          populate: [
            { path: "movieId", select: "title posterUrl durationMinutes" },
            { path: "cinemaId", select: "name currency" },
          ],
        })
        .sort({ createdAt: -1 });

      return {
        message: "Bookings fetched successfully.",
        count: bookings.length,
        bookings,
      };
    } catch (error) {
      handleError(error, "Fetch bookings error:", "Internal server error fetching bookings.");
    }
  }

  async updateBookingStatus(user: AuthUser | undefined, id: string, body: any) {
    try {
      const { action } = body || {};

      if (action !== "approve" && action !== "reject") {
        throw new BadRequestException(
          "action must be 'approve' or 'reject'.",
        );
      }

      const booking = await this.bookingModel.findById(id);
      if (!booking) {
        throw new NotFoundException("Booking not found.");
      }

      const screening = await this.screeningModel.findById(
        booking.screeningId,
      );
      if (!screening) {
        throw new NotFoundException("Screening not found.");
      }
      const cinema = await this.cinemaModel.findById(screening.cinemaId);
      if (!cinema || !this.canManageTenantCinema(user, cinema.ownerId)) {
        throw new ForbiddenException(
          "Access denied. You do not manage this cinema.",
        );
      }

      if (booking.status !== "pending") {
        throw new BadRequestException(
          "Only pending bookings can be approved or rejected.",
        );
      }

      const nextStatus = action === "approve" ? "confirmed" : "rejected";
      if (nextStatus === "rejected") {
        await this.releaseSeats(
          String(booking.screeningId),
          booking.seats.map((s) => s.label),
        );
      }

      booking.status = nextStatus;
      await booking.save();

      void this.notifyBookingStatus(booking, nextStatus);

      return {
        message:
          nextStatus === "confirmed"
            ? "Booking confirmed."
            : "Booking rejected and seats released.",
        booking,
      };
    } catch (error) {
      handleError(error, "Update booking status error:", "Internal server error updating booking.");
    }
  }

  async cancelBooking(user: AuthUser, id: string) {
    try {
      const booking = await this.bookingModel.findOne({
        _id: id,
        userId: user.id,
      });
      if (!booking) {
        throw new NotFoundException("Booking not found.");
      }

      if (booking.status !== "pending") {
        throw new BadRequestException(
          "Only pending bookings can be cancelled. Contact the cinema.",
        );
      }

      await this.releaseSeats(
        String(booking.screeningId),
        booking.seats.map((s) => s.label),
      );

      booking.status = "cancelled";
      await booking.save();

      void this.notifyBookingStatus(booking, "cancelled");

      return {
        message: "Booking cancelled and seats released.",
        booking,
      };
    } catch (error) {
      handleError(error, "Cancel booking error:", "Internal server error cancelling booking.");
    }
  }
}
