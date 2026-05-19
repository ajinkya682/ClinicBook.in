import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    bloodGroup: { type: String, default: "" },
    address: { type: String, default: "" },
    allergies: { type: [String], default: [] },
    currentMedications: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    lastVisit: { type: Date },
    totalVisits: { type: Number, default: 0 },
    fcmToken: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

patientSchema.index({ clinicId: 1, phone: 1 }, { unique: true });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
