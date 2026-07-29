import { Request, Response } from "express";
import { User } from "../models/user.model";
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyPassword,
} from "../utils/userAuth.util";

// -- Register Controller --
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

    const accessToken = generateAccessToken(
      newUser._id.toString(),
      newUser.role,
    );
    const refreshToken = generateRefreshToken(newUser._id.toString());

    newUser.refreshToken = refreshToken;
    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully.",
      accessToken,
      refreshToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during registration." });
  }
};

// -- Login Controller --
export const loginUserController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Missing Credentials.",
      });
    }

    // 2. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials." });
    }

    // 3. Verify password against stored hash
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials." });
    }

    // 4. Generate new tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // 5. Update refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    // 6. Return response
    return res.status(200).json({
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during login." });
  }
};

// --- Logout Controller ---
export const logoutUserController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is required to logout." });
    }

    // Clear the stored refresh token in MongoDB to invalidate the session
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error during logout." });
  }
};
