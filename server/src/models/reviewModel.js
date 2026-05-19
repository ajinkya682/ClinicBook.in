import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
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
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      default: "",
    },
    reply: {
      type: String,
      default: "",
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

reviewSchema.index({ patientId: 1, appointmentId: 1 }, { unique: true });
reviewSchema.index({ clinicId: 1 });

const Review = mongoose.model("Review", reviewSchema);

export default Review;
