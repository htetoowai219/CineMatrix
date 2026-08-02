import { Request, Response } from "express";
import { Movie } from "../models/movie.model";

// Fetches all movies from the database with optional filter query parameters.
export const getAllMoviesController = async (req: Request, res: Response) => {
  try {
    const { status, genre } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;
    if (genre) filter.genres = genre;

    const movies = await Movie.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Movies fetched successfully.",
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error("Fetch movies error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching movies." });
  }
};

// Retrieves a single movie by its unique database ID.
export const getMovieByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    return res.status(200).json({
      message: "Movie retrieved successfully.",
      movie,
    });
  } catch (error) {
    console.error("Fetch movie by ID error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error fetching movie details." });
  }
};

// Creates and saves a new movie record in the database.
export const createMovieController = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    const {
      title,
      tagline,
      synopsis,
      durationMinutes,
      releaseDate,
      originalLanguage,
      contentRating,
      averageScore,
      posterUrl,
      backdropUrl,
      trailerUrl,
      director,
      castMembers,
      genres,
      status,
      createdByCinemaId,
    } = req.body;

    if (
      !title ||
      !synopsis ||
      !durationMinutes ||
      !releaseDate ||
      !originalLanguage ||
      !contentRating ||
      !posterUrl ||
      !backdropUrl ||
      !director
    ) {
      return res.status(400).json({
        message: "Missing required movie fields.",
      });
    }

    const newMovie = new Movie({
      title,
      tagline,
      synopsis,
      durationMinutes,
      releaseDate,
      originalLanguage,
      contentRating,
      averageScore,
      posterUrl,
      backdropUrl,
      trailerUrl,
      director,
      castMembers,
      genres,
      status,
      createdByCinemaId,
    });

    await newMovie.save();

    return res.status(201).json({
      message: "Movie created successfully.",
      movie: newMovie,
    });
  } catch (error) {
    console.error("Create movie error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error creating movie." });
  }
};

// Updates an existing movie's details by ID.
export const updateMovieController = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({ message: "Movie ID is required." });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No fields provided to update." });
    }

    const updatedMovie = await Movie.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedMovie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    return res.status(200).json({
      message: "Movie updated successfully.",
      movie: updatedMovie,
    });
  } catch (error) {
    console.error("Update movie error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error updating movie." });
  }
};

// Removes a movie record from the database by ID.
export const deleteMovieController = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    const { id } = req.params;

    const deletedMovie = await Movie.findByIdAndDelete(id);

    if (!deletedMovie) {
      return res.status(404).json({ message: "Movie not found." });
    }

    return res.status(200).json({
      message: "Movie deleted successfully.",
    });
  } catch (error) {
    console.error("Delete movie error:", error);
    return res
      .status(500)
      .json({ message: "Internal server error deleting movie." });
  }
};
