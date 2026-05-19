import Clinic from "../models/clinicModel.js";
import Doctor from "../models/doctorModel.js";
import Patient from "../models/patientModel.js";
import Appointment from "../models/appointmentModel.js";
import { generateBookingId } from "../utils/bookingId.js";
import { sendWhatsApp } from "../services/twilio.js";
import { getIO } from "../utils/socketIO.js";

/**
 * Helper to emit real-time queue updates to the clinic room
 */
const emitQueueUpdate = async (clinicId) => {
  try {
    const io = getIO();
    if (!io) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const queue = await Appointment.find({
      clinicId,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ["pending", "confirmed", "noShow"] },
    })
      .populate("patientId", "name phone")
      .populate("doctorId", "name specialization");

    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return 9999;
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (!match) return 9999;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && hours !== 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const sortedQueue = queue.sort((a, b) => {
      return parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot);
    });

    io.to(clinicId.toString()).emit("queue:updated", sortedQueue);
  } catch (err) {
    console.error("Failed to emit real-time queue update:", err);
  }
};

/**
 * Get public profile and details of the clinic
 */
export const getClinicPublicInfo = async (req, res, next) => {
  try {
    const clinic = req.clinicContext;

    // Fetch active doctors with basic public fields
    const doctors = await Doctor.find(
      { clinicId: clinic._id, isActive: true },
      "name specialization qualifications experience consultationFee profilePhoto isAvailableToday"
    );

    res.status(200).json({
      success: true,
      clinic: {
        id: clinic._id,
        name: clinic.name,
        logo: clinic.logo,
        address: clinic.address,
        city: clinic.city,
        phone: clinic.phone || clinic.ownerPhone,
        email: clinic.email || clinic.ownerEmail,
        specializations: clinic.specializations || [],
        workingDays: clinic.workingDays || {},
        primaryColor: clinic.primaryColor || "#0EA5E9",
        secondaryColor: clinic.secondaryColor || "#0284C7",
      },
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get active doctors list for the clinic (public view)
 */
export const getPublicDoctors = async (req, res, next) => {
  try {
    const clinicId = req.clinicContext._id;
    const doctors = await Doctor.find(
      { clinicId, isActive: true },
      "name specialization qualifications experience consultationFee profilePhoto isAvailableToday workingDays slotDuration"
    );

    res.status(200).json({
      success: true,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public doctor availability (unauthenticated)
 */
export const getPublicDoctorAvailability = async (req, res, next) => {
  try {
    const clinicId = req.clinicContext._id;
    const { doctorId } = req.query; // Accept doctorId from query parameter
    const { date } = req.query;

    const resolvedDoctorId = doctorId || req.params.id || req.body.doctorId;

    if (!resolvedDoctorId || !date) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID and date query parameters are required.",
      });
    }

    const doctor = await Doctor.findOne({ _id: resolvedDoctorId, clinicId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format.",
      });
    }

    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[targetDate.getDay()];

    // Leave dates check
    const targetDateString = targetDate.toISOString().split("T")[0];
    const isOnLeave = doctor.leaveDates.some(
      (leaveDate) => new Date(leaveDate).toISOString().split("T")[0] === targetDateString
    );

    if (isOnLeave) {
      return res.status(200).json({
        success: true,
        morning: [],
        afternoon: [],
        evening: [],
      });
    }

    // Working day check
    const dayConfig = doctor.workingDays[dayName];
    if (!dayConfig || !dayConfig.open) {
      return res.status(200).json({
        success: true,
        morning: [],
        afternoon: [],
        evening: [],
      });
    }

    const { startTime, endTime, breakStart, breakEnd } = dayConfig;

    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const formatMinutesToTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const displayMinutes = String(mins).padStart(2, "0");
      return `${displayHours}:${displayMinutes} ${ampm}`;
    };

    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    const breakStartMin = parseTimeToMinutes(breakStart);
    const breakEndMin = parseTimeToMinutes(breakEnd);
    const duration = doctor.slotDuration || 20;

    const allSlots = [];
    let curr = startMin;

    while (curr + duration <= endMin) {
      let overlapsBreak = false;
      if (breakStartMin !== null && breakEndMin !== null) {
        if (curr < breakEndMin && curr + duration > breakStartMin) {
          overlapsBreak = true;
        }
      }

      if (!overlapsBreak) {
        allSlots.push({
          time: formatMinutesToTime(curr),
          minutes: curr,
        });
      }
      curr += duration;
    }

    // Find non-cancelled bookings
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId: resolvedDoctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" },
    });

    const bookedSlots = appointments.map((app) => app.timeSlot);
    const normalizeTime = (tStr) => tStr.trim().replace(/^0/, "");
    const bookedNormalized = bookedSlots.map(normalizeTime);

    let availableSlots = allSlots.filter(
      (slot) => !bookedNormalized.includes(normalizeTime(slot.time))
    );

    // Filters for today (slots must be greater than current time minus 15 mins)
    const today = new Date();
    const isToday = today.toDateString() === targetDate.toDateString();

    if (isToday) {
      const currentMinutes = today.getHours() * 60 + today.getMinutes();
      const cutoffMinutes = currentMinutes - 15;
      availableSlots = availableSlots.filter((slot) => slot.minutes > cutoffMinutes);
    }

    const morning = [];
    const afternoon = [];
    const evening = [];

    availableSlots.forEach((slot) => {
      if (slot.minutes < 720) {
        morning.push(slot.time);
      } else if (slot.minutes < 1020) {
        afternoon.push(slot.time);
      } else {
        evening.push(slot.time);
      }
    });

    res.status(200).json({
      success: true,
      morning,
      afternoon,
      evening,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enable patients to create their own bookings publicly
 */
export const createPatientBooking = async (req, res, next) => {
  try {
    const clinicId = req.clinicContext._id;
    const { name, phone, email, doctorId, date, timeSlot, notes } = req.body;

    if (!name || !phone || !doctorId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Patient name, phone, doctor ID, date, and time slot are required.",
      });
    }

    // 1. Resolve Patient
    let patient = await Patient.findOne({ clinicId, phone });
    if (!patient) {
      patient = new Patient({
        clinicId,
        name,
        phone,
        email: email || "",
        gender: "Other",
      });
      await patient.save();
    }

    // 2. Validate Doctor
    const doctor = await Doctor.findOne({ _id: doctorId, clinicId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    // 3. Conflict Check
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const conflict = await Appointment.findOne({
      doctorId,
      appointmentDate: { $gte: start, $lte: end },
      timeSlot,
      status: { $ne: "cancelled" },
    });

    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "This appointment slot has already been taken.",
      });
    }

    // 4. Generate ID and save
    const bookingId = generateBookingId();
    const appointment = new Appointment({
      clinicId,
      patientId: patient._id,
      doctorId,
      bookingId,
      appointmentDate: new Date(date),
      timeSlot,
      notes: notes || "",
      channel: "app",
      consultationFee: doctor.consultationFee || 0,
      status: "pending",
    });

    await appointment.save();

    // 5. Send notifications
    const formattedDate = new Date(date).toDateString();
    const waMessage = `Hello ${patient.name}, your appointment booking at ${req.clinicContext.name} with Dr. ${doctor.name} has been received for ${formattedDate} at ${timeSlot}. Booking ID: ${bookingId}. Thank you!`;
    
    try {
      await sendWhatsApp(patient.phone, waMessage);
    } catch (err) {
      console.error("WhatsApp booking alert delivery failed:", err);
    }

    // 6. Emit Socket event
    const io = getIO();
    if (io) {
      io.to(clinicId.toString()).emit("appointmentCreated", appointment);
      io.to(clinicId.toString()).emit("appointment:new", appointment);
    }

    // Trigger queue updates
    await emitQueueUpdate(clinicId);

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      bookingId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get appointment status for track page (public check)
 */
export const getBookingStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required.",
      });
    }

    const appointment = await Appointment.findOne({ bookingId })
      .populate("doctorId", "name specialization qualifications profilePhoto")
      .populate("clinicId", "name logo address city phone email primaryColor secondaryColor");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Booking ID not found.",
      });
    }

    res.status(200).json({
      success: true,
      status: appointment.status,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};
