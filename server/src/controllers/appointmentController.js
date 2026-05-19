import Appointment from "../models/appointmentModel.js";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorModel.js";
import { generateBookingId } from "../utils/bookingId.js";
import { sendWhatsApp } from "../services/twilio.js";

/**
 * Helper to parse a time slot string like "9:00 AM" or "10:30 PM" to absolute minutes
 */
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

/**
 * Get appointments with filters (date, doctorId, status)
 */
export const getAppointments = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { date, doctorId, status } = req.query;

    const filter = { clinicId };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: start, $lte: end };
    }

    if (doctorId) {
      filter.doctorId = doctorId;
    }

    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate("patientId", "name phone")
      .populate("doctorId", "name specialization")
      .sort({ appointmentDate: 1 });

    // Precise minutes-based sorting for time slots
    const sortedAppointments = appointments.sort((a, b) => {
      if (a.appointmentDate.getTime() === b.appointmentDate.getTime()) {
        return parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot);
      }
      return a.appointmentDate.getTime() - b.appointmentDate.getTime();
    });

    res.status(200).json({
      success: true,
      appointments: sortedAppointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific appointment by ID
 */
export const getAppointmentById = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { id } = req.params;

    const appointment = await Appointment.findOne({ _id: id, clinicId })
      .populate("patientId")
      .populate("doctorId")
      .populate("clinicId", "name city");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized.",
      });
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new appointment booking (Walk-in or App)
 */
export const createAppointment = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const {
      patientId,
      name,
      phone,
      email,
      gender,
      dateOfBirth,
      doctorId,
      date,
      timeSlot,
      notes,
      channel,
    } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Doctor, date, and time slot are required.",
      });
    }

    // 1. Resolve Patient
    let finalPatientId = patientId;
    if (!finalPatientId) {
      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          message: "Patient name and phone number are required to create a new patient.",
        });
      }

      // Check if patient already exists in this clinic by phone
      let patient = await Patient.findOne({ clinicId, phone });
      if (!patient) {
        patient = new Patient({
          clinicId,
          name,
          phone,
          email: email || "",
          gender: gender || "Other",
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        });
        await patient.save();
      }
      finalPatientId = patient._id;
    }

    // Verify patient profile
    const patientObj = await Patient.findById(finalPatientId);
    if (!patientObj) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found.",
      });
    }

    // Verify doctor exists
    const doctor = await Doctor.findOne({ _id: doctorId, clinicId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found or unauthorized.",
      });
    }

    // 2. Check for slot conflict
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
        message: "This time slot has already been taken.",
      });
    }

    // 3. Generate booking ID
    const bookingId = generateBookingId();

    // 4. Create appointment
    const appointment = new Appointment({
      clinicId,
      patientId: finalPatientId,
      doctorId,
      bookingId,
      appointmentDate: new Date(date),
      timeSlot,
      notes: notes || "",
      channel: channel || "app",
      consultationFee: doctor.consultationFee || 0,
      status: "pending",
    });

    await appointment.save();

    // 5. Send WhatsApp notification
    const formattedDate = new Date(date).toDateString();
    const waMessage = `Hello ${patientObj.name}, your appointment booking at ${req.clinic.name} with Dr. ${doctor.name} has been received for ${formattedDate} at ${timeSlot}. Booking ID: ${bookingId}. Thank you!`;
    
    try {
      await sendWhatsApp(patientObj.phone, waMessage);
    } catch (waErr) {
      console.error("Failed to send WhatsApp booking confirmation:", waErr);
    }

    // 6. Emit Socket.io event safely
    const io = req.app.get("io");
    if (io) {
      io.to(clinicId.toString()).emit("appointmentCreated", appointment);
    }

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update individual appointment status
 */
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID and status are required.",
      });
    }

    const appointment = await Appointment.findOne({ _id: appointmentId, clinicId });
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized.",
      });
    }

    appointment.status = status;
    await appointment.save();

    // If completed: increment patient visits and update lastVisit date
    if (status === "completed") {
      await Patient.findByIdAndUpdate(appointment.patientId, {
        $inc: { totalVisits: 1 },
        lastVisit: new Date(),
      });
    }

    // If confirmed: dispatch WhatsApp confirmation
    if (status === "confirmed") {
      const patient = await Patient.findById(appointment.patientId);
      const doctor = await Doctor.findById(appointment.doctorId);
      if (patient && doctor) {
        const formattedDate = new Date(appointment.appointmentDate).toDateString();
        const waMessage = `Dear ${patient.name}, your appointment at ${req.clinic.name} with Dr. ${doctor.name} on ${formattedDate} at ${appointment.timeSlot} is now CONFIRMED. We look forward to seeing you.`;
        try {
          await sendWhatsApp(patient.phone, waMessage);
        } catch (waErr) {
          console.error("WhatsApp delivery failed during confirmation update:", waErr);
        }
      }
    }

    // Emit Socket event
    const io = req.app.get("io");
    if (io) {
      io.to(clinicId.toString()).emit("appointmentUpdated", appointment);
    }

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}.`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk confirm multiple appointments
 */
export const bulkConfirmAppointments = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { appointmentIds } = req.body;

    if (!Array.isArray(appointmentIds) || appointmentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "An array of appointment IDs is required.",
      });
    }

    let successCount = 0;

    for (const id of appointmentIds) {
      const appointment = await Appointment.findOne({ _id: id, clinicId, status: { $ne: "confirmed" } });
      
      if (appointment) {
        appointment.status = "confirmed";
        await appointment.save();
        successCount++;

        // Send confirmation WhatsApp
        const patient = await Patient.findById(appointment.patientId);
        const doctor = await Doctor.findById(appointment.doctorId);
        if (patient && doctor) {
          const formattedDate = new Date(appointment.appointmentDate).toDateString();
          const waMessage = `Dear ${patient.name}, your appointment at ${req.clinic.name} with Dr. ${doctor.name} on ${formattedDate} at ${appointment.timeSlot} is CONFIRMED. See you soon!`;
          try {
            await sendWhatsApp(patient.phone, waMessage);
          } catch (waErr) {
            console.error(`Bulk WhatsApp failed for patient ${patient.name}:`, waErr);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully confirmed ${successCount} appointments.`,
      successCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get comprehensive appointment stats and metrics
 */
export const getAppointmentStats = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;

    // Time boundaries
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date();
    const dayOfWeek = weekStart.getDay();
    const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Queries
    const todayCount = await Appointment.countDocuments({
      clinicId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
    });

    const weekCount = await Appointment.countDocuments({
      clinicId,
      appointmentDate: { $gte: weekStart },
    });

    const monthAppointments = await Appointment.find({
      clinicId,
      appointmentDate: { $gte: monthStart },
    });

    const monthCount = monthAppointments.length;
    const completedMonth = monthAppointments.filter((app) => app.status === "completed").length;
    const cancelledMonth = monthAppointments.filter((app) => app.status === "cancelled").length;

    const completionRate = monthCount > 0 ? parseFloat(((completedMonth / monthCount) * 100).toFixed(1)) : 0;
    const cancellationRate = monthCount > 0 ? parseFloat(((cancelledMonth / monthCount) * 100).toFixed(1)) : 0;

    // Revenue calculation (Sum of fees of all active non-cancelled month appointments)
    const revenueThisMonth = monthAppointments
      .filter((app) => app.status !== "cancelled")
      .reduce((sum, app) => sum + (app.consultationFee || 0), 0);

    res.status(200).json({
      success: true,
      stats: {
        todayCount,
        weekCount,
        monthCount,
        completionRate,
        cancellationRate,
        revenueThisMonth,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Power the today-timeline visualization inside Dashboard
 */
export const getTodayTimeline = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      clinicId,
      appointmentDate: { $gte: start, $lte: end },
    })
      .populate("patientId")
      .populate("doctorId");

    // Precise minutes-based sorting for timeline render
    const sortedTimeline = appointments.sort((a, b) => {
      return parseTimeToMinutes(a.timeSlot) - parseTimeToMinutes(b.timeSlot);
    });

    res.status(200).json({
      success: true,
      timeline: sortedTimeline,
    });
  } catch (error) {
    next(error);
  }
};
