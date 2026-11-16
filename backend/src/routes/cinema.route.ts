import { Router } from "express";
import {
  getAllCinemasController,
  getCinemaByIdController,
  getMyCinemasController,
  createCinemaController,
  updateCinemaController,
  approveCinemaController,
  rejectCinemaController,
  deleteCinemaController,
} from "../controllers/cinema.controller";
import {
  verifyAccessToken,
  verifyOptionalAccessToken,
  requireRole,
} from "../middlewares/auth.middleware";
import {
  uploadCinemaImages,
  handleMulterError,
} from "../middlewares/upload.middleware";

const router = Router();

// Public route for browsing active cinemas. With a valid token, admins see
// every status so they can review pending/rejected venues.
router.get("/", verifyOptionalAccessToken, getAllCinemasController);

router.get("/my", verifyAccessToken, requireRole("admin", "cinema_owner", "cinema_staff"), getMyCinemasController);

// Single-cinema route: active cinemas are public; non-active cinemas are
// visible only to the owning owner, their staff, or an admin (optional auth
// lets an anonymous browser still read active cinemas).
router.get("/:id", verifyOptionalAccessToken, getCinemaByIdController);

router.post(
  "/",
  verifyAccessToken,
  requireRole("cinema_owner"),
  uploadCinemaImages,
  handleMulterError,
  createCinemaController,
);

router.patch(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "cinema_owner", "cinema_staff"),
  uploadCinemaImages,
  handleMulterError,
  updateCinemaController,
);

router.patch(
  "/:id/approve",
  verifyAccessToken,
  requireRole("admin"),
  approveCinemaController,
);
router.patch(
  "/:id/reject",
  verifyAccessToken,
  requireRole("admin"),
  rejectCinemaController,
);

router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "cinema_owner"),
  deleteCinemaController,
);

export default router;
