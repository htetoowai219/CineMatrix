import express from "express";

import {
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

export default router;
