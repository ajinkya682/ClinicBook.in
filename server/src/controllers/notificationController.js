import Appointment from "../models/appointmentModel.js";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorModel.js";
import Clinic from "../models/clinicModel.js";
import { sendWhatsApp } from "../services/twilio.js";

/**
 * Send scheduled 24-hour and 1-hour WhatsApp reminders for confirmed appointments
 */
export const sendReminders = async () => {
  const now = new Date();

  // --- 1. 24-Hour Reminders ---
  // Window: 23 hours 45 mins to 24 hours 15 mins from now
  const start24h = new Date(now.getTime() + 23.75 * 60 * 60 * 1000);
  const end24h = new Date(now.getTime() + 24.25 * 60 * 60 * 1000);

  const appointments24h = await Appointment.find({
    appointmentDate: { $gte: start24h, $lte: end24h },
    reminder24hSent: false,
    status: "confirmed",
  });

  console.log(`[Reminder Job] Found ${appointments24h.length} appointments requiring 24h reminders.`);

  for (const app of appointments24h) {
    try {
      const patient = await Patient.findById(app.patientId);
      const doctor = await Doctor.findById(app.doctorId);
      const clinic = await Clinic.findById(app.clinicId);

      if (patient && doctor) {
        const formattedDate = new Date(app.appointmentDate).toDateString();
        const clinicName = clinic ? clinic.name : "ClinicBook";
        const waMessage = `Reminder: Hello ${patient.name}, you have a confirmed appointment tomorrow at ${clinicName} with Dr. ${doctor.name} at ${app.timeSlot} on ${formattedDate}. Please arrive 10 minutes prior to your slot. If you need to reschedule, please contact us.`;
        
        await sendWhatsApp(patient.phone, waMessage);
        
        app.reminder24hSent = true;
        await app.save();
        console.log(`[Reminder Job] Sent 24h reminder to ${patient.name} for booking ${app.bookingId}.`);
      }
    } catch (err) {
      console.error(`[Reminder Job] Error sending 24h reminder for appointment ${app._id}:`, err);
    }
  }

  // --- 2. 1-Hour Reminders ---
  // Window: 45 mins to 1 hour 15 mins from now
  const start1h = new Date(now.getTime() + 45 * 60 * 1000);
  const end1h = new Date(now.getTime() + 75 * 60 * 1000);

  const appointments1h = await Appointment.find({
    appointmentDate: { $gte: start1h, $lte: end1h },
    reminder1hSent: false,
    status: "confirmed",
  });

  console.log(`[Reminder Job] Found ${appointments1h.length} appointments requiring 1h reminders.`);

  for (const app of appointments1h) {
    try {
      const patient = await Patient.findById(app.patientId);
      const doctor = await Doctor.findById(app.doctorId);
      const clinic = await Clinic.findById(app.clinicId);

      if (patient && doctor) {
        const clinicName = clinic ? clinic.name : "ClinicBook";
        const waMessage = `Quick Reminder: Hello ${patient.name}, your appointment at ${clinicName} with Dr. ${doctor.name} is scheduled in 1 hour at ${app.timeSlot}. We look forward to seeing you soon!`;
        
        await sendWhatsApp(patient.phone, waMessage);
        
        app.reminder1hSent = true;
        await app.save();
        console.log(`[Reminder Job] Sent 1h reminder to ${patient.name} for booking ${app.bookingId}.`);
      }
    } catch (err) {
      console.error(`[Reminder Job] Error sending 1h reminder for appointment ${app._id}:`, err);
    }
  }
};
