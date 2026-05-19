import jwt from "jsonwebtoken";
import config from "../config/config.js";
import Clinic from "../models/clinicModel.js";

export const authenticateClinic = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Access token missing or invalid format.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const clinicId = decoded.id || decoded._id || decoded.clinicId;
    if (!clinicId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token payload.",
      });
    }

    const clinic = await Clinic.findById(clinicId);
    if (!clinic || !clinic.isActive) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Clinic not found or suspended.",
      });
    }

    req.clinic = clinic;
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Token verification failed.",
    });
  }
};
