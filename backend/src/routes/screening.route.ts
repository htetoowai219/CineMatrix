import { Router } from "express";
import {
  getScreeningsController,
  getPublicScreeningsController,
  getPublicScreeningByIdController,
  createScreeningController,
  updateScreeningController,
  deleteScreeningController,
} from "../controllers/screening.controller";
import { verifyAccessToken, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Public: browse screenings of active cinemas
router.get("/public", getPublicScreeningsController);
router.get("/public/:id", getPublicScreeningByIdController);

// Owner/staff: manage screenings
router.get(
  "/",
  verifyAccessToken,
  requireRole("cinema_owner", "cinema_staff"),
  getScreeningsController,
);
router.post(
  "/",
  verifyAccessToken,
  requireRole("cinema_owner", "cinema_staff"),
  createScreeningController,
);
router.patch(
  "/:id",
  verifyAccessToken,
  requireRole("cinema_owner", "cinema_staff"),
  updateScreeningController,
);
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("cinema_owner", "cinema_staff"),
  deleteScreeningController,
);

export default router;
