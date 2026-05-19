import Patient from "../models/patientModel.js";
import Appointment from "../models/appointmentModel.js";

export const getPatients = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { search, page = 1, limit = 20 } = req.query;

    const filter = { clinicId };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [{ name: searchRegex }, { phone: searchRegex }];
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Patient.countDocuments(filter);

    res.status(200).json({
      success: true,
      patients,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { id } = req.params;

    const patient = await Patient.findOne({ _id: id, clinicId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or unauthorized.",
      });
    }

    const appointments = await Appointment.find({ patientId: id })
      .populate("doctorId", "name specialization")
      .sort({ appointmentDate: -1, timeSlot: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      patient,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const {
      name,
      phone,
      email,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      allergies,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required.",
      });
    }

    const existingPatient = await Patient.findOne({ clinicId, phone });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message:
          "A patient with this phone number already exists in this clinic.",
      });
    }

    const patient = new Patient({
      clinicId,
      name,
      phone,
      email: email || "",
      dateOfBirth,
      gender,
      bloodGroup: bloodGroup || "",
      address: address || "",
      allergies: allergies || [],
    });

    await patient.save();

    res.status(201).json({
      success: true,
      message: "Patient created successfully.",
      patient,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { id } = req.params;

    const patient = await Patient.findOne({ _id: id, clinicId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or unauthorized.",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "email",
      "dateOfBirth",
      "gender",
      "bloodGroup",
      "address",
      "allergies",
      "currentMedications",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        patient[field] = req.body[field];
      }
    });

    await patient.save();

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    next(error);
  }
};

export const searchPatient = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number query parameter is required.",
      });
    }

    const patient = await Patient.findOne({ phone, clinicId });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientStats = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;

    const totalPatients = await Patient.countDocuments({ clinicId });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newPatientsThisMonth = await Patient.countDocuments({
      clinicId,
      createdAt: { $gte: startOfMonth },
    });

    const returningPatients = await Patient.countDocuments({
      clinicId,
      totalVisits: { $gt: 1 },
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const patientsByMonthRaw = await Patient.aggregate([
      {
        $match: {
          clinicId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const patientsByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();

      const foundMatch = patientsByMonthRaw.find(
        (item) =>
          item._id.month === targetMonth + 1 && item._id.year === targetYear,
      );

      patientsByMonth.push({
        month: `${monthNames[targetMonth]} ${targetYear}`,
        count: foundMatch ? foundMatch.count : 0,
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalPatients,
        newPatientsThisMonth,
        returningPatients,
        patientsByMonth,
      },
    });
  } catch (error) {
    next(error);
  }
};
