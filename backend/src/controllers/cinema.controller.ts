import { Request, Response } from "express";
import { Cinema } from "../models/cinema.model";
import {
  ICinemaAddress,
  ICinemaLocation,
  ICinemaRoom,
  ICinemaSocials,
  ICinemaAnnouncement,
  SeatCellType,
  CURRENCIES,
  CurrencyCode,
} from "../types/cinema.type";
import { AuthUser } from "../types/express";
import { uploadImageToCloudinary } from "../utils/cloudinary.util";

const CINEMA_IMAGES_FOLDER = "cinematrix/cinemas/images";
const CINEMA_GALLERY_FOLDER = "cinematrix/cinemas/gallery";

type CinemaUploadFiles = {
  images?: Express.Multer.File[];
  gallery?: Express.Multer.File[];
};

const SEAT_CELL_TYPES: SeatCellType[] = [
  "seat",
  "double",
  "walkway",
  "stairs",
  "empty",
];

// Normalizes array-typed fields sent either as a JSON array or as a
// comma-separated string (when submitted via multipart FormData).
const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

// Normalizes booleans that arrive as true/false or the strings "true"/"false"
// (multipart FormData serializes booleans as strings).
const toBoolean = (value: unknown): boolean =>
  value === true || String(value).toLowerCase() === "true";

// Normalizes a currency code, returning undefined for anything unsupported.
const toCurrency = (value: unknown): CurrencyCode | undefined => {
  const code = String(value ?? "").trim().toUpperCase();
  return (CURRENCIES as readonly string[]).includes(code)
    ? (code as CurrencyCode)
    : undefined;
};

// Parses nested objects (address/location/rooms/etc.) sent as JSON strings by
// the client when it submits multipart FormData.
const parseObject = <T>(value: unknown): T | undefined => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
  return value as T;
};

// Uploads an array of image buffers and returns their Cloudinary URLs.
const uploadImages = async (
  files: Express.Multer.File[],
  folder: string,
): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const { secure_url } = await uploadImageToCloudinary(file, folder);
    urls.push(secure_url);
  }
  return urls;
};

// Validates a room's seat layout grid. Returns a human-readable error message
// describing the first problem found, or null when the room is well-formed.
const getRoomError = (room: ICinemaRoom, index: number): string | null => {
  if (!room || typeof room !== "object") {
    return `Room ${index + 1} is not a valid object.`;
  }
  const where = `Room "${room.name?.trim() || index + 1}"`;
  if (!room.name || !room.name.trim()) {
    return `${where}: a room name is required.`;
  }
  if (!Number.isInteger(room.rows) || room.rows < 1) {
    return `${where}: rows must be a positive integer.`;
  }
  if (!Number.isInteger(room.cols) || room.cols < 1) {
    return `${where}: cols must be a positive integer.`;
  }
  if (!Array.isArray(room.grid) || room.grid.length !== room.rows) {
    return `${where}: grid must be an array with exactly ${room.rows} row(s).`;
  }
  for (let r = 0; r < room.grid.length; r++) {
    const row = room.grid[r];
    if (!Array.isArray(row) || row.length !== room.cols) {
      return `${where}: row ${r + 1} must have exactly ${room.cols} cell(s).`;
    }
    for (let c = 0; c < row.length; c++) {
      if (!SEAT_CELL_TYPES.includes(row[c])) {
        return `${where}: invalid cell "${String(row[c])}" at row ${
          r + 1
        }, col ${c + 1}.`;
      }
    }
  }
  return null;
};

// Returns an error message when the rooms list has no room or any room fails
// validation, otherwise null.
const getRoomsError = (rooms: unknown): string | null => {
  if (!Array.isArray(rooms)) {
    return "rooms must be an array of room objects.";
  }
  if (rooms.length === 0) {
    return "At least one room with a valid seat layout grid is required.";
  }
  for (let i = 0; i < rooms.length; i++) {
    const error = getRoomError(rooms[i], i);
    if (error) return error;
  }
  return null;
};

// True when the requesting user is the cinema's owner, a staff member of that
// owner, or an admin.
export const canManageCinema = (
  user: AuthUser | undefined,
  cinemaOwnerId: unknown,
): boolean => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "cinema_staff") {
    return String(cinemaOwnerId) === String(user.managedByOwnerId);
  }
  return String(cinemaOwnerId) === user.id;
};

// Fetches cinemas from the database. Public callers only see active cinemas;
// admins see every status so they can review pending/rejected venues.
export const getAllCinemasController = async (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const filter: Record<string, unknown> = {};

    if (req.user?.role !== "admin") {
      filter.status = "active";
    }

    if (city) filter["address.city"] = new RegExp(String(city), "i");

    const cinemas = await Cinema.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Cinemas fetched successfully.",
      count: cinemas.length,
      cinemas,
    });
  } catch (error) {
    console.error("Fetch cinemas error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching cinemas." });
  }
};

// Retrieves a single cinema. Inactive/pending cinemas are only visible to the
// owning owner, their staff, or an admin.
export const getCinemaByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cinema = await Cinema.findById(id);

    if (!cinema) {
      return res.status(404).json({ message: "Cinema not found." });
    }

    if (
      cinema.status !== "active" &&
      !canManageCinema(req.user, cinema.ownerId)
    ) {
      return res.status(404).json({ message: "Cinema not found." });
    }

    return res.status(200).json({
      message: "Cinema retrieved successfully.",
      cinema,
    });
  } catch (error) {
    console.error("Fetch cinema by ID error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching cinema details." });
  }
};

// Returns the cinemas owned by the requesting owner, or (for staff) all
// cinemas owned by their owner.
export const getMyCinemasController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const ownerId = req.user?.role === "cinema_staff"
      ? req.user?.managedByOwnerId
      : userId;

    if (req.user?.role === "admin") {
      const cinemas = await Cinema.find({}).sort({ createdAt: -1 });
      return res.status(200).json({
        message: "Cinemas fetched successfully.",
        count: cinemas.length,
        cinemas,
      });
    }

    if (!ownerId) {
      return res.status(400).json({ message: "Staff has no linked owner." });
    }

    const cinemas = await Cinema.find({ ownerId }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Cinemas fetched successfully.",
      count: cinemas.length,
      cinemas,
    });
  } catch (error) {
    console.error("Fetch my cinemas error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching cinemas." });
  }
};

// Creates a new cinema as pending. Only cinema owners may create cinemas, and
// an owner may only have a single cinema awaiting approval at a time.
export const createCinemaController = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "cinema_owner") {
      return res
        .status(403)
        .json({ message: "Access denied. Cinema owner role required." });
    }

    const pendingCinema = await Cinema.findOne({
      ownerId: req.user.id,
      status: "pending",
    });
    if (pendingCinema) {
      return res.status(400).json({
        message:
          "You already have a cinema waiting for approval. Please wait until it is reviewed.",
      });
    }

    const files = req.files as CinemaUploadFiles | undefined;

    const { name, description, phone, email, allowPayInPerson, currency } =
      req.body;
    const address = parseObject<ICinemaAddress>(req.body.address);
    const location = parseObject<ICinemaLocation>(req.body.location);
    const socials = parseObject<ICinemaSocials>(req.body.socials);
    const announcements = parseObject<ICinemaAnnouncement[]>(
      req.body.announcements,
    );
    const rooms = parseObject<ICinemaRoom[]>(req.body.rooms);

    let images = toArray(req.body.images);
    let gallery = toArray(req.body.gallery);

    if (files?.images?.length) {
      images = await uploadImages(files.images, CINEMA_IMAGES_FOLDER);
    }
    if (files?.gallery?.length) {
      gallery = await uploadImages(files.gallery, CINEMA_GALLERY_FOLDER);
    }

    if (
      !name ||
      !address?.street ||
      !address?.city ||
      !address?.country ||
      !phone ||
      !email
    ) {
      return res.status(400).json({
        message: "Missing required cinema fields.",
      });
    }

    const roomsError = getRoomsError(rooms);
    if (roomsError) {
      return res.status(400).json({ message: roomsError });
    }

    const newCinema = new Cinema({
      name,
      description,
      ownerId: req.user.id,
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

    return res.status(201).json({
      message:
        "Cinema submitted for approval. An admin will review it shortly.",
      cinema: newCinema,
    });
  } catch (error) {
    console.error("Create cinema error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error creating cinema." });
  }
};

// Owner-editable fields. Staff may edit a subset (minor details only).
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

// Updates an existing cinema's details by ID. Owners may edit everything,
// staff may only edit minor details (no rooms / seat layouts).
export const updateCinemaController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cinema = await Cinema.findById(id);
    if (!cinema) {
      return res.status(404).json({ message: "Cinema not found." });
    }

    const isOwner = String(cinema.ownerId) === req.user?.id;
    const isStaff = req.user?.role === "cinema_staff" &&
      String(cinema.ownerId) === String(req.user?.managedByOwnerId);

    if (!isOwner && !isStaff && req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. You do not manage this cinema." });
    }

    const files = req.files as CinemaUploadFiles | undefined;
    const allowedFields = isStaff ? STAFF_EDITABLE_FIELDS : OWNER_EDITABLE_FIELDS;

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    delete updateData.images;
    delete updateData.gallery;

    if (files?.images?.length) {
      updateData.images = await uploadImages(files.images, CINEMA_IMAGES_FOLDER);
    } else if (req.body.images !== undefined) {
      updateData.images = toArray(req.body.images);
    }

    if (files?.gallery?.length) {
      updateData.gallery = await uploadImages(
        files.gallery,
        CINEMA_GALLERY_FOLDER,
      );
    } else if (req.body.gallery !== undefined) {
      updateData.gallery = toArray(req.body.gallery);
    }

    for (const nested of ["address", "location", "socials", "announcements", "rooms"]) {
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
          return res.status(400).json({ message: roomsError });
        }
      }
    }

    if (updateData.allowPayInPerson !== undefined) {
      updateData.allowPayInPerson = toBoolean(updateData.allowPayInPerson);
    }

    if (updateData.currency !== undefined) {
      const currency = toCurrency(updateData.currency);
      if (!currency) {
        return res.status(400).json({ message: "Invalid currency code." });
      }
      updateData.currency = currency;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." });
    }

    const updatedCinema = await Cinema.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedCinema) {
      return res.status(404).json({ message: "Cinema not found." });
    }

    return res.status(200).json({
      message: "Cinema updated successfully.",
      cinema: updatedCinema,
    });
  } catch (error) {
    console.error("Update cinema error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error updating cinema." });
  }
};

// Approves a pending cinema, making it publicly visible.
export const approveCinemaController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cinema = await Cinema.findByIdAndUpdate(
      id,
      { $set: { status: "active" } },
      { new: true, runValidators: true },
    );

    if (!cinema) {
      return res.status(404).json({ message: "Cinema not found." });
    }

    return res.status(200).json({
      message: "Cinema approved and now live.",
      cinema,
    });
  } catch (error) {
    console.error("Approve cinema error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error approving cinema." });
  }
};

// Rejects a pending cinema.
export const rejectCinemaController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cinema = await Cinema.findByIdAndUpdate(
      id,
      { $set: { status: "rejected" } },
      { new: true, runValidators: true },
    );

    if (!cinema) {
      return res.status(404).json({ message: "Cinema not found." });
    }

    return res.status(200).json({
      message: "Cinema rejected.",
      cinema,
    });
  } catch (error) {
    console.error("Reject cinema error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error rejecting cinema." });
  }
};

// Removes a cinema record from the database by ID. Admins or the owning owner.
export const deleteCinemaController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cinema = await Cinema.findById(id);
    if (!cinema) {
      return res.status(404).json({ message: "Cinema not found." });
    }

    if (!canManageCinema(req.user, cinema.ownerId)) {
      return res
        .status(403)
        .json({ message: "Access denied. You do not manage this cinema." });
    }

    await Cinema.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Cinema deleted successfully.",
    });
  } catch (error) {
    console.error("Delete cinema error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error deleting cinema." });
  }
};
