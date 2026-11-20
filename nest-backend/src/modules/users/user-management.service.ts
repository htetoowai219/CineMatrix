import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { AuthUser } from "../../common/types/auth-user.type";
import { handleError } from "../../common/utils/error.util";
import { hashPassword, verifyPassword } from "../../common/utils/userAuth.util";
import { Booking } from "../bookings/schemas/booking.schema";
import { Cinema } from "../cinemas/schemas/cinema.schema";
import { Screening } from "../screenings/schemas/screening.schema";
import { ScreeningTemplate } from "../templates/schemas/template.schema";
import { User, type UserDocument } from "./schemas/user.schema";

@Injectable()
export class UserManagementService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Cinema.name) private readonly cinemaModel: Model<any>,
    @InjectModel(ScreeningTemplate.name)
    private readonly templateModel: Model<any>,
    @InjectModel(Screening.name) private readonly screeningModel: Model<any>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<any>,
  ) {}

  async createOwner(body: any) {
    try {
      const { name, email, password, phone } = body || {};

      if (!name || !email || !password || !phone) {
        throw new BadRequestException("Missing required owner fields.");
      }

      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new ConflictException(
          "User with this email already exists.",
        );
      }

      const newOwner = new this.userModel({
        name,
        email,
        phone,
        password: await hashPassword(password),
        role: "cinema_owner",
      });
      await newOwner.save();

      return {
        message: "Cinema owner created successfully.",
        user: {
          _id: newOwner._id,
          name: newOwner.name,
          email: newOwner.email,
          phone: newOwner.phone,
          role: newOwner.role,
        },
      };
    } catch (error) {
      handleError(error, "Create owner error:", "Internal server error creating cinema owner.");
    }
  }

  async getOwners() {
    try {
      const owners = await this.userModel
        .find({ role: "cinema_owner" })
        .select("name email phone profileImageUrl role createdAt")
        .sort({ createdAt: -1 });

      return {
        message: "Cinema owners fetched successfully.",
        count: owners.length,
        owners,
      };
    } catch (error) {
      handleError(error, "Fetch owners error:", "Internal server error fetching cinema owners.");
    }
  }

  async createStaff(body: any, user: AuthUser | undefined) {
    try {
      const { name, email, password, phone } = body || {};

      if (!name || !email || !password || !phone) {
        throw new BadRequestException("Missing required staff fields.");
      }

      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new ConflictException(
          "User with this email already exists.",
        );
      }

      const newStaff = new this.userModel({
        name,
        email,
        phone,
        password: await hashPassword(password),
        role: "cinema_staff",
        managedByOwnerId: user?.id,
      });
      await newStaff.save();

      return {
        message: "Cinema staff created successfully.",
        user: {
          _id: newStaff._id,
          name: newStaff.name,
          email: newStaff.email,
          phone: newStaff.phone,
          role: newStaff.role,
        },
      };
    } catch (error) {
      handleError(error, "Create staff error:", "Internal server error creating cinema staff.");
    }
  }

  async getStaff(user: AuthUser | undefined) {
    try {
      const staff = await this.userModel
        .find({
          role: "cinema_staff",
          managedByOwnerId: user?.id,
        })
        .select("name email phone profileImageUrl role createdAt")
        .sort({ createdAt: -1 });

      return {
        message: "Cinema staff fetched successfully.",
        count: staff.length,
        staff,
      };
    } catch (error) {
      handleError(error, "Fetch staff error:", "Internal server error fetching cinema staff.");
    }
  }

  async deleteStaff(id: string, user: AuthUser | undefined) {
    try {
      const staff = await this.userModel.findOneAndDelete({
        _id: id,
        role: "cinema_staff",
        managedByOwnerId: user?.id,
      });

      if (!staff) {
        throw new NotFoundException("Staff account not found.");
      }

      return { message: "Staff account deleted." };
    } catch (error) {
      handleError(error, "Delete staff error:", "Internal server error deleting cinema staff.");
    }
  }

  async deleteOwner(id: string, body: any, user: AuthUser | undefined) {
    try {
      const { password } = body || {};

      if (!id) {
        throw new BadRequestException("Owner id is required.");
      }
      if (!password) {
        throw new BadRequestException(
          "Admin password is required to confirm deletion.",
        );
      }

      if (id === user?.id) {
        throw new BadRequestException("You cannot delete your own account.");
      }

      const admin = await this.userModel.findById(user?.id);
      if (!admin) {
        throw new UnauthorizedException("Admin account not found.");
      }
      const passwordMatches = await verifyPassword(password, admin.password);
      if (!passwordMatches) {
        throw new UnauthorizedException("Incorrect admin password.");
      }

      const owner = await this.userModel.findOneAndDelete({
        _id: id,
        role: "cinema_owner",
      });
      if (!owner) {
        throw new NotFoundException("Cinema owner not found.");
      }

      const cinemas = await this.cinemaModel.find({ ownerId: id }).select("_id");
      const cinemaIds = cinemas.map((cinema: any) => cinema._id);

      if (cinemaIds.length > 0) {
        const screenings = await this.screeningModel
          .find({ cinemaId: { $in: cinemaIds } })
          .select("_id");
        const screeningIds = screenings.map((screening: any) => screening._id);

        await this.bookingModel.deleteMany({
          screeningId: { $in: screeningIds },
        });
        await this.screeningModel.deleteMany({ cinemaId: { $in: cinemaIds } });
        await this.templateModel.deleteMany({ cinemaId: { $in: cinemaIds } });
        await this.cinemaModel.deleteMany({ ownerId: id });
      }

      return {
        message: "Cinema owner and their data deleted.",
        deletedCinemas: cinemaIds.length,
      };
    } catch (error) {
      handleError(error, "Delete owner error:", "Internal server error deleting cinema owner.");
    }
  }
}
