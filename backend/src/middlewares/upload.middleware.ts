import multer from "multer";
import { Request, Response, NextFunction } from "express";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

// In-memory storage: buffers are handed to Cloudinary right away, so nothing
// is ever written to the local filesystem.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new Error("Only image files (JPEG, PNG, WEBP, GIF, AVIF) are allowed."),
    );
  },
  limits: { fileSize: MAX_IMAGE_SIZE },
});

// Single optional image under a named field (e.g. profileImage).
export const uploadSingleImage = (field: string) => upload.single(field);

// Movie create/update: poster + backdrop images.
export const uploadMovieImages = upload.fields([
  { name: "posterImage", maxCount: 1 },
  { name: "backdropImage", maxCount: 1 },
]);

// Cinema create/update: hero images + gallery photos.
export const uploadCinemaImages = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "gallery", maxCount: 10 },
]);

// Converts multer failures (invalid type / file too large) into JSON errors.
export const handleMulterError = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof multer.MulterError || error instanceof Error) {
    return res.status(400).json({ message: error.message });
  }
  return next(error);
};
