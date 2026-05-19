import Doctor from "../models/doctorModel.js";
import Appointment from "../models/appointmentModel.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinary.js";


export const getDoctors = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const doctors = await Doctor.find({ clinicId, isActive: true });
    
    res.status(200).json({
      success: true,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};


export const getDoctorById = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { id } = req.params;

    const doctor = await Doctor.findOne({ _id: id, clinicId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or unauthorized.",
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};


export const createDoctor = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const doctorData = { ...req.body, clinicId };


    if (typeof doctorData.workingDays === "string") {
      try {
        doctorData.workingDays = JSON.parse(doctorData.workingDays);
      } catch (err) {
        console.error("Failed to parse workingDays JSON:", err);
      }
    }

    if (typeof doctorData.qualifications === "string") {
      try {
        doctorData.qualifications = JSON.parse(doctorData.qualifications);
      } catch (err) {
        doctorData.qualifications = doctorData.qualifications.split(",").map(q => q.trim());
      }
    }


    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "doctor-profiles");
      doctorData.profilePhoto = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    const doctor = new Doctor(doctorData);
    await doctor.save();

    res.status(201).json({
      success: true,
      message: "Doctor profile created successfully.",
      doctor,
    });
  } catch (error) {
    next(error);
  }
};


export const updateDoctor = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { id } = req.params;

    const doctor = await Doctor.findOne({ _id: id, clinicId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or unauthorized.",
      });
    }

    const updateData = { ...req.body };


    if (typeof updateData.workingDays === "string") {
      try {
        updateData.workingDays = JSON.parse(updateData.workingDays);
      } catch (err) {
        console.error("Failed to parse workingDays JSON:", err);
      }
    }

    if (typeof updateData.qualifications === "string") {
      try {
        updateData.qualifications = JSON.parse(updateData.qualifications);
      } catch (err) {
        updateData.qualifications = updateData.qualifications.split(",").map(q => q.trim());
      }
    }


    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "doctor-profiles");
      const oldPublicId = doctor.profilePhoto?.publicId;

      updateData.profilePhoto = {
        url: result.secure_url,
        publicId: result.public_id,
      };


      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (cloudinaryErr) {
          console.error("Failed to delete old doctor profile photo:", cloudinaryErr);
        }
      }
    }


    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        doctor[key] = updateData[key];
      }
    });

    await doctor.save();

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};


export const toggleAvailable = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { id } = req.params;

    const doctor = await Doctor.findOne({ _id: id, clinicId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or unauthorized.",
      });
    }

    doctor.isAvailableToday = !doctor.isAvailableToday;
    await doctor.save();

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};


export const addLeaveDate = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { id } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Leave date is required.",
      });
    }

    const doctor = await Doctor.findOne({ _id: id, clinicId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or unauthorized.",
      });
    }


    const parsedLeaveDate = new Date(date);
    if (isNaN(parsedLeaveDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format provided.",
      });
    }

    parsedLeaveDate.setHours(0, 0, 0, 0);


    const isAlreadyLeave = doctor.leaveDates.some(
      (ld) => ld.getTime() === parsedLeaveDate.getTime()
    );

    if (!isAlreadyLeave) {
      doctor.leaveDates.push(parsedLeaveDate);
      await doctor.save();
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

export const removeleaveDate = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { id } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date to remove from leaves is required.",
      });
    }

    const doctor = await Doctor.findOne({ _id: id, clinicId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or unauthorized.",
      });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format provided.",
      });
    }
    targetDate.setHours(0, 0, 0, 0);

    doctor.leaveDates = doctor.leaveDates.filter(
      (ld) => ld.getTime() !== targetDate.getTime()
    );

    await doctor.save();

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};


export const getDoctorAvailability = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date query parameter is required.",
      });
    }

    const doctor = await Doctor.findOne({ _id: id, clinicId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found or unauthorized.",
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


    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      doctorId: id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" },
    });

    const bookedSlots = appointments.map((app) => app.timeSlot);


    const normalizeTime = (tStr) => tStr.trim().replace(/^0/, "");
    const bookedNormalized = bookedSlots.map(normalizeTime);

    let availableSlots = allSlots.filter(
      (slot) => !bookedNormalized.includes(normalizeTime(slot.time))
    );


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
