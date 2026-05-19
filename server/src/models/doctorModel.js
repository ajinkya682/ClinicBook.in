import mongoose from "mongoose";

const fileMetaSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  { _id: false },
);

const workingDaySchema = new mongoose.Schema(
  {
    open: { type: Boolean, default: false },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
    breakStart: { type: String, default: "" },
    breakEnd: { type: String, default: "" },
  },
  { _id: false },
);

const doctorSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    profilePhoto: { type: fileMetaSchema, default: {} },
    qualifications: { type: [String], default: [] },
    experience: { type: Number, default: 0 },
    consultationFee: { type: Number, required: true },
    slotDuration: {
      type: Number,
      enum: [10, 15, 20, 30],
      default: 20,
    },
    workingDays: {
      monday: { type: workingDaySchema, default: () => ({}) },
      tuesday: { type: workingDaySchema, default: () => ({}) },
      wednesday: { type: workingDaySchema, default: () => ({}) },
      thursday: { type: workingDaySchema, default: () => ({}) },
      friday: { type: workingDaySchema, default: () => ({}) },
      saturday: { type: workingDaySchema, default: () => ({}) },
      sunday: { type: workingDaySchema, default: () => ({}) },
    },
    leaveDates: { type: [Date], default: [] },
    isActive: { type: Boolean, default: true },
    isAvailableToday: { type: Boolean, default: true },
  },
  { timestamps: false },
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
