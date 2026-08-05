import { Router } from "express";
import {
  getAllMoviesController,
  getMovieByIdController,
  createMovieController,
  updateMovieController,
  deleteMovieController,
} from "../controllers/movie.controller";
import { verifyAccessToken } from "../middlewares/auth.middleware";

const router = Router();

// Public routes for browsing movies
router.get("/", getAllMoviesController);
router.get("/:id", getMovieByIdController);

// Protected routes for managing movies
router.post("/", verifyAccessToken, createMovieController);
router.patch("/:id", verifyAccessToken, updateMovieController);
router.delete("/:id", verifyAccessToken, deleteMovieController);

export default router;
