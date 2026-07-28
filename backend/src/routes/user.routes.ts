import express from "express";

import {
  loginUserController,
  logoutUserController,
  registerUserController,
} from "../controllers/userAuth.controller";

const router = express.Router();

router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.delete("/logout", logoutUserController);

export default router;
