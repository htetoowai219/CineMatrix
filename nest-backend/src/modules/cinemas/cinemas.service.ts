import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { AuthUser } from "../../common/types/auth-user.type";
import type {
  ICinemaAddress,
  ICinemaAnnouncement,
  ICinemaLocation,
  ICinemaRoom,
  ICinemaSocials,
} from "../../common/types/cinema.type";
import {
  canManageCinema,
  getRoomsError,
  parseObject,
  toArray,
  toBoolean,
  toCurrency,
} from "../../common/utils/cinema.util";
import { handleError } from "../../common/utils/error.util";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { Cinema, type CinemaDocument } from "./schemas/cinema.schema";

const CINEMA_IMAGES_FOLDER = "cinematrix/cinemas/images";
const CINEMA_GALLERY_FOLDER = "cinematrix/cinemas/gallery";

type CinemaUploadFiles = {
  images?: Express.Multer.File[];
  gallery?: Express.Multer.File[];
};

const OWNER_EDITABLE_FIELDS = [
  "name",
  "description",
  "phone",
  "email",
  "socials",
  "announcements",
  "allowPayInPerson",
  "currency",
  "images",
  "gallery",
  "address",
  "location",
  "rooms",
];

const STAFF_EDITABLE_FIELDS = [
  "name",
  "description",
  "phone",
  "email",
  "socials",
  "announcements",
  "allowPayInPerson",
  "currency",
  "images",
  "gallery",
  "address",
  "location",
];

@Injectable()
export class CinemasService {
  constructor(
    @InjectModel(Cinema.name) private readonly cinemaModel: Model<CinemaDocument>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private async uploadImages(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const { secure_url } = await this.cloudinary.uploadImageToCloudinary(
        file,
        folder,
      );
      urls.push(secure_url);
    }
    return urls;
  }

  async getAllCinemas(user: AuthUser | undefined, query: Record<string, any>) {
    try {
      const { city } = query;
      const filter: Record<string, unknown> = {};

      if (user?.role !== "admin") {
        filter.status = "active";
      }

      if (city) filter["address.city"] = new RegExp(String(city), "i");

      const cinemas = await this.cinemaModel.find(filter).sort({ createdAt: -1 });

      return {
        message: "Cinemas fetched successfully.",
        count: cinemas.length,
        cinemas,
      };
    } catch (error) {
      handleError(error, "Fetch cinemas error:", "Internal server error fetching cinemas.");
    }
  }

  async getCinemaById(user: AuthUser | undefined, id: string) {
    try {
      const cinema = await this.cinemaModel.findById(id);

      if (!cinema) {
        throw new NotFoundException("Cinema not found.");
      }

      if (cinema.status !== "active" && !canManageCinema(user, cinema.ownerId)) {
        throw new NotFoundException("Cinema not found.");
      }

      return {
        message: "Cinema retrieved successfully.",
        cinema,
      };
    } catch (error) {
      handleError(error, "Fetch cinema by ID error:", "Internal server error fetching cinema details.");
    }
  }

  async getMyCinemas(user: AuthUser | undefined) {
    try {
      const userId = user?.id;
      if (!userId) {
        throw new UnauthorizedException("Unauthorized access.");
      }

      const ownerId =
        user?.role === "cinema_staff" ? user?.managedByOwnerId : userId;

      if (user?.role === "admin") {
        const cinemas = await this.cinemaModel.find({}).sort({ createdAt: -1 });
        return {
          message: "Cinemas fetched successfully.",
          count: cinemas.length,
          cinemas,
        };
      }

      if (!ownerId) {
        throw new BadRequestException("Staff has no linked owner.");
      }

      const cinemas = await this.cinemaModel
        .find({ ownerId })
        .sort({ createdAt: -1 });

      return {
        message: "Cinemas fetched successfully.",
        count: cinemas.length,
        cinemas,
      };
    } catch (error) {
      handleError(error, "Fetch my cinemas error:", "Internal server error fetching cinemas.");
    }
  }

  async create(user: AuthUser | undefined, body: any, files?: CinemaUploadFiles) {
    try {
      if (user?.role !== "cinema_owner") {
        throw new ForbiddenException(
          "Access denied. Cinema owner role required.",
        );
      }

      const pendingCinema = await this.cinemaModel.findOne({
        ownerId: user.id,
        status: "pending",
      });
      if (pendingCinema) {
        throw new BadRequestException(
          "You already have a cinema waiting for approval. Please wait until it is reviewed.",
        );
      }

      const { name, description, phone, email, allowPayInPerson, currency } =
        body;
      const address = parseObject<ICinemaAddress>(body.address);
      const location = parseObject<ICinemaLocation>(body.location);
      const socials = parseObject<ICinemaSocials>(body.socials);
      const announcements = parseObject<ICinemaAnnouncement[]>(
        body.announcements,
      );
      const rooms = parseObject<ICinemaRoom[]>(body.rooms);

      let images = toArray(body.images);
      let gallery = toArray(body.gallery);

      if (files?.images?.length) {
        images = await this.uploadImages(files.images, CINEMA_IMAGES_FOLDER);
      }
      if (files?.gallery?.length) {
        gallery = await this.uploadImages(files.gallery, CINEMA_GALLERY_FOLDER);
      }

      if (
        !name ||
        !address?.street ||
        !address?.city ||
        !address?.country ||
        !phone ||
        !email
      ) {
        throw new BadRequestException("Missing required cinema fields.");
      }

      const roomsError = getRoomsError(rooms);
      if (roomsError) {
        throw new BadRequestException(roomsError);
      }

      const newCinema = new this.cinemaModel({
        name,
        description,
        ownerId: user.id,
        address,
        location,
        phone,
        email,
        images,
        gallery,
        rooms,
        announcements: announcements ?? [],
        socials: socials ?? {},
        allowPayInPerson: toBoolean(allowPayInPerson),
        currency: toCurrency(currency) ?? "USD",
        status: "pending",
      });

      await newCinema.save();

      return {
        message:
          "Cinema submitted for approval. An admin will review it shortly.",
        cinema: newCinema,
      };
    } catch (error) {
      handleError(error, "Create cinema error:", "Internal server error creating cinema.");
    }
  }

  async update(
    user: AuthUser | undefined,
    id: string,
    body: any,
    files?: CinemaUploadFiles,
  ) {
    try {
      const cinema = await this.cinemaModel.findById(id);
      if (!cinema) {
        throw new NotFoundException("Cinema not found.");
      }

      const isOwner = String(cinema.ownerId) === user?.id;
      const isStaff =
        user?.role === "cinema_staff" &&
        String(cinema.ownerId) === String(user?.managedByOwnerId);

      if (!isOwner && !isStaff && user?.role !== "admin") {
        throw new ForbiddenException(
          "Access denied. You do not manage this cinema.",
        );
      }

      const allowedFields = isStaff ? STAFF_EDITABLE_FIELDS : OWNER_EDITABLE_FIELDS;

      const updateData: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      delete updateData.images;
      delete updateData.gallery;

      if (files?.images?.length) {
        updateData.images = await this.uploadImages(
          files.images,
          CINEMA_IMAGES_FOLDER,
        );
      } else if (body.images !== undefined) {
        updateData.images = toArray(body.images);
      }

      if (files?.gallery?.length) {
        updateData.gallery = await this.uploadImages(
          files.gallery,
          CINEMA_GALLERY_FOLDER,
        );
      } else if (body.gallery !== undefined) {
        updateData.gallery = toArray(body.gallery);
      }

      for (const nested of [
        "address",
        "location",
        "socials",
        "announcements",
        "rooms",
      ]) {
        if (updateData[nested] !== undefined) {
          updateData[nested] = parseObject(updateData[nested]);
        }
      }

      if (updateData.rooms !== undefined) {
        if (isStaff) {
          delete updateData.rooms;
        } else {
          const roomsError = getRoomsError(updateData.rooms);
          if (roomsError) {
            throw new BadRequestException(roomsError);
          }
        }
      }

      if (updateData.allowPayInPerson !== undefined) {
        updateData.allowPayInPerson = toBoolean(updateData.allowPayInPerson);
      }

      if (updateData.currency !== undefined) {
        const currency = toCurrency(updateData.currency);
        if (!currency) {
          throw new BadRequestException("Invalid currency code.");
        }
        updateData.currency = currency;
      }

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("No fields provided to update.");
      }

      const updatedCinema = await this.cinemaModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      );

      if (!updatedCinema) {
        throw new NotFoundException("Cinema not found.");
      }

      return {
        message: "Cinema updated successfully.",
        cinema: updatedCinema,
      };
    } catch (error) {
      handleError(error, "Update cinema error:", "Internal server error updating cinema.");
    }
  }

  async approve(id: string) {
    try {
      const cinema = await this.cinemaModel.findByIdAndUpdate(
        id,
        { $set: { status: "active" } },
        { new: true, runValidators: true },
      );

      if (!cinema) {
        throw new NotFoundException("Cinema not found.");
      }

      return { message: "Cinema approved and now live.", cinema };
    } catch (error) {
      handleError(error, "Approve cinema error:", "Internal server error approving cinema.");
    }
  }

  async reject(id: string) {
    try {
      const cinema = await this.cinemaModel.findByIdAndUpdate(
        id,
        { $set: { status: "rejected" } },
        { new: true, runValidators: true },
      );

      if (!cinema) {
        throw new NotFoundException("Cinema not found.");
      }

      return { message: "Cinema rejected.", cinema };
    } catch (error) {
      handleError(error, "Reject cinema error:", "Internal server error rejecting cinema.");
    }
  }

  async remove(user: AuthUser | undefined, id: string) {
    try {
      const cinema = await this.cinemaModel.findById(id);
      if (!cinema) {
        throw new NotFoundException("Cinema not found.");
      }

      if (!canManageCinema(user, cinema.ownerId)) {
        throw new ForbiddenException(
          "Access denied. You do not manage this cinema.",
        );
      }

      await this.cinemaModel.findByIdAndDelete(id);

      return { message: "Cinema deleted successfully." };
    } catch (error) {
      handleError(error, "Delete cinema error:", "Internal server error deleting cinema.");
    }
  }
}
