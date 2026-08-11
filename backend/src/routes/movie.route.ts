import { Router } from "express";
import {
  getAllMoviesController,
  getMovieByIdController,
  createMovieController,
  updateMovieController,
  deleteMovieController,
} from "../controllers/movie.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";
import {
  uploadMovieImages,
  handleMulterError,
} from "../middlewares/upload.middleware";

const router = Router();

// Public routes for browsing movies
router.get("/", getAllMoviesController);
router.get("/:id", getMovieByIdController);

// Protected routes for managing movies (accepts optional poster/backdrop files)
router.post(
  "/",
  verifyAccessToken,
  uploadMovieImages,
  handleMulterError,
  createMovieController,
);
router.patch(
  "/:id",
  verifyAccessToken,
  uploadMovieImages,
  handleMulterError,
  updateMovieController,
);
router.delete("/:id", verifyAccessToken, deleteMovieController);

export default router;
