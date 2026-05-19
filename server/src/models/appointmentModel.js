import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "noShow"],
      default: "pending",
    },
    consultationFee: {
      type: Number,
    },
    notes: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    channel: {
      type: String,
      enum: ["app", "walkin"],
      default: "app",
    },
    reminder24hSent: {
      type: Boolean,
      default: false,
    },
    reminder1hSent: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

appointmentSchema.index({ clinicId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ bookingId: 1 }, { unique: true });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
