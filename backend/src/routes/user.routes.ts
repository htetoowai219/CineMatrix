import express from "express";

import { registerUserController } from "../controllers/userAuth.controller";

const router = express.Router();

router.post("/register", registerUserController);

export default router;
