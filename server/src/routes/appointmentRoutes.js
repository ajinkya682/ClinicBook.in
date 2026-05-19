import express from "express";
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  bulkConfirmAppointments,
  getAppointmentStats,
  getTodayTimeline,
} from "../controllers/appointmentController.js";
import { authenticateClinic } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware globally to all appointment endpoints
router.use(authenticateClinic);

// Static paths first to prevent param collision with /:id
router.get("/", getAppointments);
router.get("/stats", getAppointmentStats);
router.get("/timeline", getTodayTimeline);
router.get("/:id", getAppointmentById);

router.post("/", createAppointment);
router.patch("/status", updateAppointmentStatus);
router.post("/bulk-confirm", bulkConfirmAppointments);

export default router;
