import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true },
    dosage: { type: String, default: "" },
    frequency: { type: String, default: "" },
    duration: { type: String, default: "" },
    instructions: { type: String, default: "" },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    diagnosis: {
      type: String,
      default: "",
    },
    medicines: {
      type: [medicineSchema],
      default: [],
    },
    labTests: {
      type: [String],
      default: [],
    },
    followUpDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
    pdfUrl: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Indexes
prescriptionSchema.index({ appointmentId: 1 }, { unique: true });
prescriptionSchema.index({ clinicId: 1 });
prescriptionSchema.index({ patientId: 1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
