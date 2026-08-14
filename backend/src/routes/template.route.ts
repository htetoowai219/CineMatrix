import { Router } from "express";
import {
  getTemplatesController,
  createTemplateController,
  updateTemplateController,
  deleteTemplateController,
} from "../controllers/template.controller";
import { verifyAccessToken, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Owner/staff only: screening templates for their cinemas
router.get(
  "/",
  verifyAccessToken,
  requireRole("cinema_owner", "cinema_staff"),
  getTemplatesController,
);
router.post(
  "/",
  verifyAccessToken,
  requireRole("cinema_owner", "cinema_staff"),
  createTemplateController,
);
router.patch(
  "/:id",
  verifyAccessToken,
  requireRole("cinema_owner", "cinema_staff"),
  updateTemplateController,
);
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("cinema_owner", "cinema_staff"),
  deleteTemplateController,
);

export default router;
