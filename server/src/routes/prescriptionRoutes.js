import express from "express";
import {
  createPrescription,
  getPrescriptionsByPatient,
  getPrescriptionByAppointment,
  getPrescriptions,
} from "../controllers/prescriptionController.js";
import { authenticateClinic } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware globally to all prescription endpoints
router.use(authenticateClinic);

router.post("/", createPrescription);
router.get("/", getPrescriptions);
router.get("/patient/:patientId", getPrescriptionsByPatient);
router.get("/appointment/:appointmentId", getPrescriptionByAppointment);

export default router;
