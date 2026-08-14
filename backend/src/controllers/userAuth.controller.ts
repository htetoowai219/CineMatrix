import { Request, Response } from "express";
import { User } from "../models/user.model";
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyPassword,
} from "../utils/userAuth.util";
import { uploadImageToCloudinary } from "../utils/cloudinary.util";

const PROFILE_IMAGE_FOLDER = "cinematrix/profiles";

// Handles new user registration and returns authentication tokens along with basic user details.
export const registerUserController = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "Missing Credentials." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists." });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "customer",
    });

    // Optional profile picture uploaded to Cloudinary.
    if (req.file) {
      const { secure_url } = await uploadImageToCloudinary(
        req.file,
        PROFILE_IMAGE_FOLDER,
      );
      newUser.profileImageUrl = secure_url;
    }

    const accessToken = generateAccessToken(
      newUser._id.toString(),
      newUser.role,
      newUser.managedByOwnerId?.toString(),
    );
    const refreshToken = generateRefreshToken(newUser._id.toString());

    newUser.refreshToken = refreshToken;
    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully.",
      accessToken,
      refreshToken,
      user: {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        profileImageUrl: newUser.profileImageUrl,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during registration." });
  }
};

// Authenticates existing users via email and password, issuing access and refresh tokens.
export const loginUserController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Missing Credentials.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials." });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials." });
    }

    const accessToken = generateAccessToken(
      user._id.toString(),
      user.role,
      user.managedByOwnerId?.toString(),
    );
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during login." });
  }
};

// Invalidates the current user session by clearing the stored refresh token in the database.
export const logoutUserController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    await User.findByIdAndUpdate(userId, { refreshToken: null });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during logout." });
  }
};

// Updates editable user profile fields such as name and phone number.
export const updateUserProfileController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const { name, phone } = req.body || {};

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const updateData: {
      name?: string;
      phone?: string;
      profileImageUrl?: string;
    } = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    // Optional new profile picture uploaded to Cloudinary.
    if (req.file) {
      const { secure_url } = await uploadImageToCloudinary(
        req.file,
        PROFILE_IMAGE_FOLDER,
      );
      updateData.profileImageUrl = secure_url;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid profile fields provided to update." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("name email phone profileImageUrl -_id");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error updating profile." });
  }
};

// Validates current password and updates it with a newly hashed password.
export const updateUserPasswordController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!userId) {
      return res.status(400).json({ message: "Unauthorized Access." });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Both current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordCorrect = await verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Incorrect current password." });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Update password error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error updating password." });
  }
};

// Fetches the authenticated user's non-sensitive profile details.
export const getProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "Unauthorized Access." });
    }

    const user = await User.findById(userId).select(
      "name email phone profileImageUrl -_id",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Profile fetched successfully.",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error fetching profile info." });
  }
};
