import { Router } from "express";
import {
  getAllCinemasController,
  getCinemaByIdController,
  createCinemaController,
  updateCinemaController,
  deleteCinemaController,
} from "../controllers/cinema.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes for browsing cinemas
router.get("/", getAllCinemasController);
router.get("/:id", getCinemaByIdController);

// Protected routes for managing cinemas
router.post("/", verifyAccessToken, createCinemaController);
router.patch("/:id", verifyAccessToken, updateCinemaController);
router.delete("/:id", verifyAccessToken, deleteCinemaController);

export default router;
