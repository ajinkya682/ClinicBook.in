import express from "express";
import {
  getClinicPublicInfo,
  getPublicDoctors,
  getPublicDoctorAvailability,
  createPatientBooking,
  getBookingStatus,
  getPublicReviews,
} from "../controllers/publicController.js";
import { getClinicContext } from "../middleware/clinicSubdomain.js";

const router = express.Router();

router.get("/clinic", getClinicContext, getClinicPublicInfo);
router.get("/doctors", getClinicContext, getPublicDoctors);
router.get("/availability", getClinicContext, getPublicDoctorAvailability);
router.post("/book", getClinicContext, createPatientBooking);
router.get("/reviews", getClinicContext, getPublicReviews);
router.get("/booking/:bookingId", getBookingStatus);

export default router;
