import { Router } from "express";
import {
  getAllCinemasController,
  getCinemaByIdController,
  createCinemaController,
  updateCinemaController,
  deleteCinemaController,
} from "../controllers/cinema.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import {
  uploadCinemaImages,
  handleMulterError,
} from "../middlewares/upload.middleware";

const router = Router();

// Public routes for browsing cinemas
router.get("/", getAllCinemasController);
router.get("/:id", getCinemaByIdController);

// Protected routes for managing cinemas (accepts optional images/gallery files)
router.post(
  "/",
  verifyAccessToken,
  uploadCinemaImages,
  handleMulterError,
  createCinemaController,
);
router.patch(
  "/:id",
  verifyAccessToken,
  uploadCinemaImages,
  handleMulterError,
  updateCinemaController,
);
router.delete("/:id", verifyAccessToken, deleteCinemaController);

export default router;
