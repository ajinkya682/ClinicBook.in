import express from "express";
import {
  getPatients,
  getPatientStats,
  searchPatient,
  getPatientById,
  createPatient,
  updatePatient,
} from "../controllers/patientController.js";
import { authenticateClinic } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateClinic);

router.get("/", getPatients);
router.get("/stats", getPatientStats);
router.get("/search", searchPatient);
router.get("/:id", getPatientById);

router.post("/", createPatient);
router.patch("/:id", updatePatient);

export default router;
