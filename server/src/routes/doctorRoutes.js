import express from "express";
import multer from "multer";
import {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  toggleAvailable,
  addLeaveDate,
  removeleaveDate,
  getDoctorAvailability,
} from "../controllers/doctorController.js";
import { authenticateClinic } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5mb max
});

const router = express.Router();

// Apply auth middleware globally to all doctor routes
router.use(authenticateClinic);

// Static configurations/actions
router.get("/", getDoctors);
router.post("/", upload.single("profilePhoto"), createDoctor);

// Dynamic parameters - availability is registered before base dynamic endpoints if desired,
// though availability has extra path segments (/:id/availability) so it is safe.
router.get("/:id/availability", getDoctorAvailability);
router.patch("/:id/toggle-available", toggleAvailable);
router.post("/:id/leave", addLeaveDate);
router.delete("/:id/leave", removeleaveDate);

router.get("/:id", getDoctorById);
router.patch("/:id", upload.single("profilePhoto"), updateDoctor);

export default router;
