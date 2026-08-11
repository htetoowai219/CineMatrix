import express from "express";

import {
  getProfileController,
  loginUserController,
  logoutUserController,
  registerUserController,
  updateUserPasswordController,
  updateUserProfileController,
} from "../controllers/userAuth.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";
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

export default router;
