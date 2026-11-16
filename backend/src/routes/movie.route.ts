import { Router } from "express";
import {
  getAllMoviesController,
  getMovieByIdController,
  createMovieController,
  updateMovieController,
  deleteMovieController,
  tmdbSearchController,
  tmdbImportController,
} from "../controllers/movie.controller";
import {
  requireRole,
  verifyAccessToken,
} from "../middlewares/auth.middleware";
import {
  uploadMovieImages,
  handleMulterError,
} from "../middlewares/upload.middleware";

const router = Router();

router.get("/", getAllMoviesController);

// Admin: TMDB import tooling (must precede the /:id route below)
router.get(
  "/tmdb/search",
  verifyAccessToken,
  requireRole("admin"),
  tmdbSearchController,
);
router.post(
  "/tmdb/import",
  verifyAccessToken,
  requireRole("admin"),
  tmdbImportController,
);

router.get("/:id", getMovieByIdController);

router.post(
  "/",
  verifyAccessToken,
  requireRole("admin"),
  uploadMovieImages,
  handleMulterError,
  createMovieController,
);
router.patch(
  "/:id",
  verifyAccessToken,
  requireRole("admin"),
  uploadMovieImages,
  handleMulterError,
  updateMovieController,
);
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin"),
  deleteMovieController,
);

export default router;
