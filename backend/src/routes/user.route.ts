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

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.delete("/logout", verifyAccessToken, logoutUserController);
router.patch("/updateProfile", verifyAccessToken, updateUserProfileController);
router.patch(
  "/updatePassword",
  verifyAccessToken,
  updateUserPasswordController,
);

router.get("/profile", verifyAccessToken, getProfileController);

export default router;
