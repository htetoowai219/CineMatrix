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
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyPassword,
} from "../../common/utils/userAuth.util";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { User, type UserDocument } from "./schemas/user.schema";

const PROFILE_IMAGE_FOLDER = "cinematrix/profiles";

@Injectable()
export class UserAuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async register(body: any, file?: Express.Multer.File) {
    try {
      const { name, email, password, phone } = body;

      if (!name || !email || !password || !phone) {
        throw new BadRequestException("Missing Credentials.");
      }

      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) {
        throw new ConflictException(
          "User with this email already exists.",
        );
      }

      const hashedPassword = await hashPassword(password);

      const newUser = new this.userModel({
        name,
        email,
        password: hashedPassword,
        phone,
        role: "customer",
      });

      if (file) {
        const { secure_url } = await this.cloudinary.uploadImageToCloudinary(
          file,
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

      return {
        message: "User registered successfully.",
        accessToken,
        refreshToken,
        user: {
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          profileImageUrl: newUser.profileImageUrl,
        },
      };
    } catch (error) {
      handleError(error, "Registration error:", "Internal server error during registration.");
    }
  }

  async login(body: any) {
    try {
      const { email, password } = body;

      if (!email || !password) {
        throw new BadRequestException("Missing Credentials.");
      }

      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new UnauthorizedException("Invalid Credentials.");
      }

      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException("Invalid Credentials.");
      }

      const accessToken = generateAccessToken(
        user._id.toString(),
        user.role,
        user.managedByOwnerId?.toString(),
      );
      const refreshToken = generateRefreshToken(user._id.toString());

      user.refreshToken = refreshToken;
      await user.save();

      return {
        message: "Login successful.",
        accessToken,
        refreshToken,
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImageUrl: user.profileImageUrl,
        },
      };
    } catch (error) {
      handleError(error, "Login error:", "Internal server error during login.");
    }
  }

  async logout(userId?: string) {
    try {
      if (!userId) {
        throw new UnauthorizedException("Unauthorized access.");
      }

      await this.userModel.findByIdAndUpdate(userId, { refreshToken: null });

      return { message: "Logged out successfully." };
    } catch (error) {
      handleError(error, "Logout error:", "Internal server error during logout.");
    }
  }

  async updateProfile(user: AuthUser | undefined, body: any, file?: Express.Multer.File) {
    try {
      const userId = user?.id;
      const { name, phone } = body || {};

      if (!userId) {
        throw new BadRequestException("User ID is required.");
      }

      const updateData: {
        name?: string;
        phone?: string;
        profileImageUrl?: string;
      } = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;

      if (file) {
        const { secure_url } = await this.cloudinary.uploadImageToCloudinary(
          file,
          PROFILE_IMAGE_FOLDER,
        );
        updateData.profileImageUrl = secure_url;
      }

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException(
          "No valid profile fields provided to update.",
        );
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, { $set: updateData }, {
          new: true,
          runValidators: true,
        })
        .select("name email phone profileImageUrl -_id");

      if (!updatedUser) {
        throw new NotFoundException("User not found.");
      }

      return {
        message: "Profile updated successfully.",
        user: updatedUser,
      };
    } catch (error) {
      handleError(error, "Update profile error:", "Internal server error updating profile.");
    }
  }

  async updatePassword(user: AuthUser | undefined, body: any) {
    try {
      const userId = user?.id;
      const { currentPassword, newPassword } = body || {};

      if (!userId) {
        throw new BadRequestException("Unauthorized Access.");
      }

      if (!currentPassword || !newPassword) {
        throw new BadRequestException(
          "Both current password and new password are required.",
        );
      }

      if (newPassword.length < 6) {
        throw new BadRequestException(
          "New password must be at least 6 characters long.",
        );
      }

      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        throw new NotFoundException("User not found.");
      }

      const isPasswordCorrect = await verifyPassword(
        currentPassword,
        existingUser.password,
      );
      if (!isPasswordCorrect) {
        throw new UnauthorizedException("Incorrect current password.");
      }

      existingUser.password = await hashPassword(newPassword);
      await existingUser.save();

      return { message: "Password updated successfully." };
    } catch (error) {
      handleError(error, "Update password error:", "Internal server error updating password.");
    }
  }

  async getProfile(user: AuthUser | undefined) {
    try {
      const userId = user?.id;

      if (!userId) {
        throw new BadRequestException("Unauthorized Access.");
      }

      const existingUser = await this.userModel
        .findById(userId)
        .select("name email phone profileImageUrl -_id");

      if (!existingUser) {
        throw new NotFoundException("User not found.");
      }

      return {
        message: "Profile fetched successfully.",
        user: {
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          profileImageUrl: existingUser.profileImageUrl,
        },
      };
    } catch (error) {
      handleError(error, "Fetch profile error:", "Internal server error fetching profile info.");
    }
  }
}
