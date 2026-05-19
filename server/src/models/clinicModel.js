import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const openingHourSchema = new mongoose.Schema(
  {
    open: { type: Boolean, default: false },
    startTime: { type: String, default: "" },
    endTime: { type: String, default: "" },
  },
  { _id: false },
);

const fileMetaSchema = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  { _id: false },
);

const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    subdomain: { type: String, required: true, unique: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    ownerEmail: { type: String, required: true, trim: true },
    ownerPhone: { type: String, required: true, trim: true },
    passwordHash: { type: String, default: "" },
    logo: { type: fileMetaSchema, default: {} },
    coverPhoto: { type: fileMetaSchema, default: {} },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    specializations: { type: [String], default: [] },
    openingHours: {
      monday: { type: openingHourSchema, default: () => ({}) },
      tuesday: { type: openingHourSchema, default: () => ({}) },
      wednesday: { type: openingHourSchema, default: () => ({}) },
      thursday: { type: openingHourSchema, default: () => ({}) },
      friday: { type: openingHourSchema, default: () => ({}) },
      saturday: { type: openingHourSchema, default: () => ({}) },
      sunday: { type: openingHourSchema, default: () => ({}) },
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    plan: {
      type: String,
      enum: ["starter", "growth", "pro"],
      default: "starter",
    },
    planExpiresAt: { type: Date },
    razorpayCustomerId: { type: String, default: "" },
    primaryColor: { type: String, default: "0EA5E9" },
    secondaryColor: { type: String, default: "6366F1" },
    totalPatients: { type: Number, default: 0 },
    totalAppointments: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

clinicSchema.index({ slug: 1 }, { unique: true });
clinicSchema.index({ subdomain: 1 }, { unique: true });
clinicSchema.index({ ownerEmail: 1 }, { unique: true });

clinicSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) {
    return next();
  }

  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
  } catch (error) {
    next(error);
  }
});

clinicSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const Clinic = mongoose.model("Clinic", clinicSchema);

export default Clinic;
