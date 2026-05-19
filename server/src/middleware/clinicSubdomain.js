import Clinic from "../models/clinicModel.js";

/**
 * Middleware to identify a clinic by its subdomain or ID from public booking requests.
 * Attaches the resolved Clinic document to req.clinicContext.
 */
export const getClinicContext = async (req, res, next) => {
  try {
    const clinicId = req.query.clinicId || req.headers["x-clinic-id"] || req.body.clinicId;
    const subdomain = req.query.subdomain || req.headers["x-subdomain"] || req.body.subdomain;

    let clinic = null;

    if (clinicId) {
      clinic = await Clinic.findById(clinicId);
    } else if (subdomain) {
      // Find subdomain case-insensitively
      clinic = await Clinic.findOne({ subdomain: subdomain.toLowerCase() });
    }

    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: "Clinic not found. Please provide a valid subdomain or clinic ID.",
      });
    }

    req.clinicContext = clinic;
    next();
  } catch (error) {
    next(error);
  }
};
