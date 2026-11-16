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
import { verifyAccessToken } from "../middlewares/auth.middleware";
import {
  uploadMovieImages,
  handleMulterError,
} from "../middlewares/upload.middleware";

const router = Router();

router.get("/", getAllMoviesController);

// Admin: TMDB import tooling (must precede the /:id route below)
router.get("/tmdb/search", verifyAccessToken, tmdbSearchController);
router.post("/tmdb/import", verifyAccessToken, tmdbImportController);

router.get("/:id", getMovieByIdController);

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
