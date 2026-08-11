import { Request, Response } from "express";
import { Cinema } from "../models/cinema.model";
import {
  ICinemaAddress,
  ICinemaLocation,
} from "../types/cinema.type";
import { uploadImageToCloudinary } from "../utils/cloudinary.util";

const CINEMA_IMAGES_FOLDER = "cinematrix/cinemas/images";
const CINEMA_GALLERY_FOLDER = "cinematrix/cinemas/gallery";

type CinemaUploadFiles = {
  images?: Express.Multer.File[];
  gallery?: Express.Multer.File[];
};

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

// Parses nested objects (address/location) sent as JSON strings by the client
// when it submits multipart FormData.
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

// Fetches all cinemas from the database with optional filter query parameters.
export const getAllCinemasController = async (req: Request, res: Response) => {
  try {
    const { city, amenity } = req.query;
    const filter: Record<string, unknown> = { isActive: true };

    if (city) filter["address.city"] = new RegExp(String(city), "i");
    if (amenity) filter.amenities = amenity;

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

// Retrieves a single cinema by its unique database ID.
export const getCinemaByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cinema = await Cinema.findById(id);

    if (!cinema) {
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

// Creates and saves a new cinema record in the database.
export const createCinemaController = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    const files = req.files as CinemaUploadFiles | undefined;

    const {
      name,
      description,
      ownerId,
      phone,
      email,
      totalScreens,
      isActive,
    } = req.body;

    const address = parseObject<ICinemaAddress>(req.body.address);
    const location = parseObject<ICinemaLocation>(req.body.location);

    // Uploaded files take precedence over URL fields.
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
      !ownerId ||
      !address?.street ||
      !address?.city ||
      !address?.country ||
      !phone ||
      !email ||
      !totalScreens
    ) {
      return res.status(400).json({
        message: "Missing required cinema fields.",
      });
    }

    const newCinema = new Cinema({
      name,
      description,
      ownerId,
      address,
      location,
      phone,
      email,
      amenities: toArray(req.body.amenities),
      images,
      gallery,
      totalScreens,
      isActive,
    });

    await newCinema.save();

    return res.status(201).json({
      message: "Cinema created successfully.",
      cinema: newCinema,
    });
  } catch (error) {
    console.error("Create cinema error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error creating cinema." });
  }
};

// Updates an existing cinema's details by ID.
export const updateCinemaController = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    const { id } = req.params;
    const files = req.files as CinemaUploadFiles | undefined;
    const updateData: Record<string, unknown> = { ...req.body };

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

    if (updateData.amenities !== undefined) {
      updateData.amenities = toArray(updateData.amenities);
    }
    if (updateData.address !== undefined) {
      updateData.address = parseObject(updateData.address);
    }
    if (updateData.location !== undefined) {
      updateData.location = parseObject(updateData.location);
    }

    if (!id) {
      return res.status(400).json({ message: "Cinema ID is required." });
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

// Removes a cinema record from the database by ID.
export const deleteCinemaController = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    const { id } = req.params;

    const deletedCinema = await Cinema.findByIdAndDelete(id);

    if (!deletedCinema) {
      return res.status(404).json({ message: "Cinema not found." });
    }

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
