import { Router } from "express";
import {
  uploadPaymentScreenshotController,
  lockSeatsController,
  unlockSeatsController,
  createBookingController,
  getMyBookingsController,
  getBookingsController,
  updateBookingStatusController,
  cancelBookingController,
} from "../controllers/booking.controller";
import { verifyAccessToken, requireRole } from "../middlewares/auth.middleware";
import {
  uploadSingleImage,
  handleMulterError,
} from "../middlewares/upload.middleware";

const router = Router();

// Customer: payment screenshot upload + seat locking + booking creation
router.post(
  "/upload",
  verifyAccessToken,
  requireRole("customer"),
  uploadSingleImage("paymentScreenshot"),
  handleMulterError,
  uploadPaymentScreenshotController,
);
router.post(
  "/lock",
  verifyAccessToken,
  requireRole("customer"),
  lockSeatsController,
);
router.post(
  "/unlock",
  verifyAccessToken,
  requireRole("customer"),
  unlockSeatsController,
);
router.post(
  "/",
  verifyAccessToken,
  requireRole("customer"),
  createBookingController,
);

// Customer: their own bookings
router.get(
  "/my",
  verifyAccessToken,
  requireRole("customer"),
  getMyBookingsController,
);
router.post(
  "/:id/cancel",
  verifyAccessToken,
  requireRole("customer"),
  cancelBookingController,
);

// Owner/staff: bookings for their cinemas (admin sees all cinemas' bookings)
router.get(
  "/",
  verifyAccessToken,
  requireRole("admin", "cinema_owner", "cinema_staff"),
  getBookingsController,
);
router.patch(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "cinema_owner", "cinema_staff"),
  updateBookingStatusController,
);

export default router;
