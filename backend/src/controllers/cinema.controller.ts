import { Request, Response } from "express";
import { Cinema } from "../models/cinema.model";

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

    const {
      name,
      description,
      ownerId,
      address,
      location,
      phone,
      email,
      amenities,
      images,
      totalScreens,
      isActive,
    } = req.body;

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
      amenities,
      images,
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
    const updateData = req.body;

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
