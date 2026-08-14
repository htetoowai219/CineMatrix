import express from "express";

import {
  getProfileController,
  loginUserController,
  logoutUserController,
  registerUserController,
  updateUserPasswordController,
  updateUserProfileController,
} from "../controllers/userAuth.controller";
import {
  createOwnerController,
  getOwnersController,
  deleteOwnerController,
  createStaffController,
  getStaffController,
  deleteStaffController,
} from "../controllers/userManagement.controller";
import {
  verifyAccessToken,
  requireRole,
} from "../middlewares/auth.middleware";
import {
  uploadSingleImage,
  handleMulterError,
} from "../middlewares/upload.middleware";

const router = express.Router();

router.post(
  "/register",
  uploadSingleImage("profileImage"),
  handleMulterError,
  registerUserController,
);
router.post("/login", loginUserController);
router.delete("/logout", verifyAccessToken, logoutUserController);
router.patch(
  "/updateProfile",
  verifyAccessToken,
  uploadSingleImage("profileImage"),
  handleMulterError,
  updateUserProfileController,
);
router.patch(
  "/updatePassword",
  verifyAccessToken,
  updateUserPasswordController,
);

router.get("/profile", verifyAccessToken, getProfileController);

// Admin-only: cinema owner management
router.get("/owners", verifyAccessToken, requireRole("admin"), getOwnersController);
router.post("/owners", verifyAccessToken, requireRole("admin"), createOwnerController);
router.delete(
  "/owners/:id",
  verifyAccessToken,
  requireRole("admin"),
  deleteOwnerController,
);

// Owner-only: cinema staff management
router.get("/staff", verifyAccessToken, requireRole("cinema_owner"), getStaffController);
router.post("/staff", verifyAccessToken, requireRole("cinema_owner"), createStaffController);
router.delete(
  "/staff/:id",
  verifyAccessToken,
  requireRole("cinema_owner"),
  deleteStaffController,
);

export default router;
