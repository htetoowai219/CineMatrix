import { Request, Response } from "express";
import { User } from "../models/user.model";
import { Cinema } from "../models/cinema.model";
import { ScreeningTemplate } from "../models/template.model";
import { Screening } from "../models/screening.model";
import { Booking } from "../models/booking.model";
import { hashPassword, verifyPassword } from "../utils/userAuth.util";

// Admin-only: creates a cinema owner account.
export const createOwnerController = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body || {};

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "Missing required owner fields." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const newOwner = new User({
      name,
      email,
      phone,
      password: await hashPassword(password),
      role: "cinema_owner",
    });
    await newOwner.save();

    return res.status(201).json({
      message: "Cinema owner created successfully.",
      user: {
        _id: newOwner._id,
        name: newOwner.name,
        email: newOwner.email,
        phone: newOwner.phone,
        role: newOwner.role,
      },
    });
  } catch (error) {
    console.error("Create owner error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error creating cinema owner." });
  }
};

// Admin-only: lists all cinema owner accounts.
export const getOwnersController = async (req: Request, res: Response) => {
  try {
    const owners = await User.find({ role: "cinema_owner" })
      .select("name email phone profileImageUrl role createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Cinema owners fetched successfully.",
      count: owners.length,
      owners,
    });
  } catch (error) {
    console.error("Fetch owners error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching cinema owners." });
  }
};

// Owner-only: creates a staff account linked to the requesting owner. Staff
// can manage every cinema owned by that owner.
export const createStaffController = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body || {};

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "Missing required staff fields." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const newStaff = new User({
      name,
      email,
      phone,
      password: await hashPassword(password),
      role: "cinema_staff",
      managedByOwnerId: req.user?.id,
    });
    await newStaff.save();

    return res.status(201).json({
      message: "Cinema staff created successfully.",
      user: {
        _id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role: newStaff.role,
      },
    });
  } catch (error) {
    console.error("Create staff error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error creating cinema staff." });
  }
};

// Owner-only: lists the staff accounts linked to the requesting owner.
export const getStaffController = async (req: Request, res: Response) => {
  try {
    const staff = await User.find({
      role: "cinema_staff",
      managedByOwnerId: req.user?.id,
    })
      .select("name email phone profileImageUrl role createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Cinema staff fetched successfully.",
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error("Fetch staff error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching cinema staff." });
  }
};

// Owner-only: removes a staff account linked to the requesting owner.
export const deleteStaffController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const staff = await User.findOneAndDelete({
      _id: id,
      role: "cinema_staff",
      managedByOwnerId: req.user?.id,
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff account not found." });
    }

    return res.status(200).json({ message: "Staff account deleted." });
  } catch (error) {
    console.error("Delete staff error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error deleting cinema staff." });
  }
};

// Admin-only: deletes a cinema owner account after re-authenticating the admin
// with their own password. Everything the owner manages (cinemas, templates,
// screenings, bookings) is removed in a cascade.
export const deleteOwnerController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: "Owner id is required." });
    }
    if (!password) {
      return res
        .status(400)
        .json({ message: "Admin password is required to confirm deletion." });
    }

    if (id === req.user?.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    const admin = await User.findById(req.user?.id);
    if (!admin) {
      return res.status(401).json({ message: "Admin account not found." });
    }
    const passwordMatches = await verifyPassword(password, admin.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Incorrect admin password." });
    }

    const owner = await User.findOneAndDelete({ _id: id, role: "cinema_owner" });
    if (!owner) {
      return res.status(404).json({ message: "Cinema owner not found." });
    }

    const cinemas = await Cinema.find({ ownerId: id }).select("_id");
    const cinemaIds = cinemas.map((cinema) => cinema._id);

    if (cinemaIds.length > 0) {
      const screenings = await Screening.find({
        cinemaId: { $in: cinemaIds },
      }).select("_id");
      const screeningIds = screenings.map((screening) => screening._id);

      await Booking.deleteMany({ screeningId: { $in: screeningIds } });
      await Screening.deleteMany({ cinemaId: { $in: cinemaIds } });
      await ScreeningTemplate.deleteMany({ cinemaId: { $in: cinemaIds } });
      await Cinema.deleteMany({ ownerId: id });
    }

    return res.status(200).json({
      message: "Cinema owner and their data deleted.",
      deletedCinemas: cinemaIds.length,
    });
  } catch (error) {
    console.error("Delete owner error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error deleting cinema owner." });
  }
};
