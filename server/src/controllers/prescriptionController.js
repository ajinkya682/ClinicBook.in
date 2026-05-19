import Prescription from "../models/prescriptionModel.js";
import Appointment from "../models/appointmentModel.js";
import Patient from "../models/patientModel.js";
import Doctor from "../models/doctorModel.js";
import PDFDocument from "pdfkit";
import { uploadToCloudinary } from "../services/cloudinary.js";

/**
 * Helper to fetch external image buffer defensively for PDF rendering
 */
const getLogoBuffer = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn("Failed to fetch clinic logo for PDF generation:", err.message);
    return null;
  }
};

/**
 * Helper to compile PDFKit document into memory buffer
 */
const compilePdfBuffer = (doc) => {
  return new Promise((resolve, reject) => {
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);
    doc.end();
  });
};

/**
 * Helper to calculate patient age
 */
const calculateAge = (dob) => {
  if (!dob) return "N/A";
  const diffMs = Date.now() - new Date(dob).getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

/**
 * Generate PDF Prescription and Upload to Cloudinary
 */
export const createPrescription = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { appointmentId, diagnosis, medicines, labTests, followUpDate, notes } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required.",
      });
    }

    // 1. Validate appointment
    const appointment = await Appointment.findOne({ _id: appointmentId, clinicId });
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized.",
      });
    }

    if (appointment.status !== "completed" && appointment.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Prescriptions can only be issued for confirmed or completed appointments.",
      });
    }

    // Check duplicate prescription
    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
      return res.status(409).json({
        success: false,
        message: "A prescription already exists for this appointment.",
      });
    }

    // 2. Fetch references
    const patient = await Patient.findById(appointment.patientId);
    const doctor = await Doctor.findById(appointment.doctorId);

    if (!patient || !doctor) {
      return res.status(404).json({
        success: false,
        message: "Patient or doctor records not found.",
      });
    }

    // 3. Initialize Prescription Record
    const prescription = new Prescription({
      appointmentId,
      clinicId,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      diagnosis: diagnosis || "",
      medicines: medicines || [],
      labTests: labTests || [],
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      notes: notes || "",
    });

    // 4. Generate high-fidelity PDF Document via PDFKit
    const doc = new PDFDocument({ margin: 50 });
    
    // Fetch clinic logo buffer defensively if configured
    let logoBuffer = null;
    if (req.clinic.logo?.url) {
      logoBuffer = await getLogoBuffer(req.clinic.logo.url);
    }

    // PDF Construction - Header / Logo
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 50, 45, { width: 60 });
        doc.fontSize(18).fillColor("#0EA5E9").bold().text(req.clinic.name, 125, 45);
      } catch (imgErr) {
        console.error("PDFKit Image Render Error:", imgErr);
        doc.fontSize(20).fillColor("#0EA5E9").bold().text(req.clinic.name, 50, 45);
      }
    } else {
      doc.fontSize(20).fillColor("#0EA5E9").bold().text(req.clinic.name, 50, 45);
    }

    // Clinic details block
    doc.fontSize(9).fillColor("#555555");
    const addressStr = req.clinic.address ? `${req.clinic.address}, ${req.clinic.city}` : req.clinic.city;
    doc.text(addressStr, 125, 65);
    doc.text(`Phone: ${req.clinic.phone || req.clinic.ownerPhone} | Email: ${req.clinic.email || req.clinic.ownerEmail}`, 125, 80);

    // Decorative Separator
    doc.moveTo(50, 115).lineTo(550, 115).strokeColor("#cccccc").lineWidth(1).stroke();

    // Doctor & Patient Information Column Grid
    doc.fontSize(10).fillColor("#333333").bold().text("DOCTOR DETAILS", 50, 130);
    doc.fontSize(9).fillColor("#555555").bold(false);
    doc.text(`Dr. ${doctor.name}`, 50, 145);
    doc.text(doctor.specialization || "General Physician", 50, 158);
    if (doctor.qualifications?.length > 0) {
      doc.text(doctor.qualifications.join(", "), 50, 171);
    }

    doc.fontSize(10).fillColor("#333333").bold().text("PATIENT DETAILS", 300, 130);
    doc.fontSize(9).fillColor("#555555").bold(false);
    doc.text(`Name: ${patient.name}`, 300, 145);
    doc.text(`Age / Gender: ${calculateAge(patient.dateOfBirth)} / ${patient.gender}`, 300, 158);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 300, 171);

    // Decorative Separator
    doc.moveTo(50, 195).lineTo(550, 195).strokeColor("#cccccc").stroke();

    // Diagnosis Section
    doc.fontSize(11).fillColor("#0EA5E9").bold().text("Diagnosis:", 50, 210);
    doc.fontSize(9).fillColor("#333333").bold(false).text(diagnosis || "General Consultation", 50, 225, { width: 500 });

    // Table Header
    doc.fontSize(11).fillColor("#0EA5E9").bold().text("Rx (Medicines):", 50, 255);

    let currentY = 275;
    
    // Draw table header background block
    doc.rect(50, currentY, 500, 20).fill("#0EA5E9");

    doc.fontSize(9).fillColor("#ffffff").bold();
    doc.text("Medicine Name", 60, currentY + 6, { width: 170 });
    doc.text("Dosage", 240, currentY + 6, { width: 90 });
    doc.text("Frequency", 340, currentY + 6, { width: 100 });
    doc.text("Duration", 450, currentY + 6, { width: 90 });

    currentY += 20;

    // Draw medicines
    if (medicines && medicines.length > 0) {
      doc.fontSize(9).bold(false);
      medicines.forEach((med, index) => {
        // Alternating row styling
        if (index % 2 === 1) {
          doc.rect(50, currentY, 500, 20).fill("#f9fafb");
        }
        
        doc.fillColor("#333333");
        doc.text(med.medicineName || "-", 60, currentY + 6, { width: 170 });
        doc.text(med.dosage || "-", 240, currentY + 6, { width: 90 });
        doc.text(med.frequency || "-", 340, currentY + 6, { width: 100 });
        doc.text(med.duration || "-", 450, currentY + 6, { width: 90 });
        
        doc.moveTo(50, currentY + 20).lineTo(550, currentY + 20).strokeColor("#eeeeee").stroke();
        currentY += 20;
      });
    } else {
      doc.fontSize(9).fillColor("#555555").bold(false).text("No medications prescribed.", 60, currentY + 6);
      doc.moveTo(50, currentY + 20).lineTo(550, currentY + 20).strokeColor("#eeeeee").stroke();
      currentY += 20;
    }

    // Recommended Lab Tests
    if (labTests && labTests.length > 0) {
      currentY += 15;
      doc.fontSize(11).fillColor("#0EA5E9").bold().text("Recommended Tests:", 50, currentY);
      currentY += 15;
      doc.fontSize(9).fillColor("#333333").bold(false);
      labTests.forEach((test) => {
        doc.text(`• ${test}`, 60, currentY);
        currentY += 14;
      });
    }

    // Notes
    if (notes) {
      currentY += 15;
      doc.fontSize(11).fillColor("#0EA5E9").bold().text("Advice / Notes:", 50, currentY);
      currentY += 15;
      doc.fontSize(9).fillColor("#333333").bold(false).text(notes, 50, currentY, { width: 500 });
    }

    // Follow Up
    if (followUpDate) {
      currentY += 30;
      doc.fontSize(10).fillColor("#333333").bold().text(`Follow-up Date: ${new Date(followUpDate).toDateString()}`, 50, currentY);
    }

    // Bottom Disclaimer Footer
    doc.fontSize(7).fillColor("#999999");
    doc.text("Disclaimer: This prescription is generated digitally via ClinicBook.in. Please consult your physician in case of emergencies.", 50, 730, { align: "center", width: 500 });

    // 5. Compile into buffer
    const pdfBuffer = await compilePdfBuffer(doc);

    // 6. Upload PDF buffer directly to Cloudinary prescriptions folder
    const result = await uploadToCloudinary(pdfBuffer, "prescriptions");

    // 7. Save prescription record
    prescription.pdfUrl = result.secure_url;
    await prescription.save();

    // 8. Automatically advance appointment status to completed if it was confirmed
    if (appointment.status === "confirmed") {
      appointment.status = "completed";
      await appointment.save();
      
      // Update patient stats
      await Patient.findByIdAndUpdate(appointment.patientId, {
        $inc: { totalVisits: 1 },
        lastVisit: new Date(),
      });
    }

    res.status(201).json({
      success: true,
      message: "Prescription created and PDF uploaded successfully.",
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all prescriptions for a specific patient in this clinic
 */
export const getPrescriptionsByPatient = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { patientId } = req.params;

    const prescriptions = await Prescription.find({ patientId, clinicId })
      .populate("doctorId", "name specialization qualifications")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get prescription details by associated appointment
 */
export const getPrescriptionByAppointment = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { appointmentId } = req.params;

    const prescription = await Prescription.findOne({ appointmentId, clinicId })
      .populate("doctorId", "name specialization qualifications")
      .populate("patientId", "name phone gender dateOfBirth");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found for this appointment.",
      });
    }

    res.status(200).json({
      success: true,
      prescription,
    });
  } catch (error) {
    next(error);
  }
};
