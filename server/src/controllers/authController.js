import jwt from "jsonwebtoken";
import Clinic from "../models/clinicModel.js";
import config from "../config/config.js";
import { sendEmail } from "../services/gmail.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinary.js";


const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") 
    .replace(/[^\w\-]+/g, "") 
    .replace(/\-\-+/g, "-"); 
};


const getCityAbbreviation = (city) => {
  const words = city.trim().split(/\s+/);
  if (words.length > 1) {
    return words.map((w) => w[0]).join("").toLowerCase();
  }
  return city.slice(0, 3).toLowerCase();
};


export const register = async (req, res, next) => {
  try {
    const { name, email, phone, clinicName, city, password } = req.body;


    if (!name || !email || !phone || !clinicName || !city || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, email, phone, clinicName, city, password) are required.",
      });
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }


    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }


    const existingClinic = await Clinic.findOne({ ownerEmail: email });
    if (existingClinic) {
      return res.status(409).json({
        success: false,
        message: "A clinic with this email already exists.",
      });
    }


    let subdomain = slugify(clinicName);
    

    const isSubdomainTaken = await Clinic.findOne({ subdomain });
    if (isSubdomainTaken) {
      const abbrev = getCityAbbreviation(city);
      subdomain = `${subdomain}-${abbrev}`;
    }


    const clinic = new Clinic({
      name: clinicName,
      slug: subdomain,
      subdomain,
      ownerName: name,
      ownerEmail: email,
      ownerPhone: phone,
      city,
      passwordHash: password,
    });

    await clinic.save();


    const welcomeHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0EA5E9; margin: 0;">ClinicBook</h1>
          <p style="color: #666; font-size: 14px; margin-top: 5px;">Your Complete Clinic Management Ecosystem</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 16px; color: #333;">Dear ${name},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Welcome to <strong>ClinicBook.in</strong>! We are absolutely thrilled to partner with you in digitizing and growing <strong>${clinicName}</strong> in <strong>${city}</strong>.
        </p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Your clinic portal has been initialized and is accessible at:
        </p>
        <div style="background-color: #f0f9ff; border-left: 4px solid #0EA5E9; padding: 12px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-family: monospace; font-size: 16px; color: #0369a1;">
            <strong>Portal Subdomain:</strong> ${subdomain}.clinicbook.in
          </p>
        </div>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          You can now log into your dashboard using your email (<strong>${email}</strong>) to schedule appointments, manage patients, set up doctor timings, generate prescriptions, and collect online payments.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.frontendURL}" style="background-color: #0EA5E9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
        </div>
        <p style="font-size: 14px; color: #777; line-height: 1.6;">
          If you need any assistance getting started, feel free to reply to this email or contact our support team.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
          &copy; ${new Date().getFullYear()} ClinicBook.in. All rights reserved.
        </p>
      </div>
    `;

    try {
      await sendEmail(email, "Welcome to ClinicBook!", welcomeHtml);
    } catch (emailErr) {
      console.error("Welcome email delivery failed:", emailErr);
    }

    res.status(201).json({
      success: true,
      message: "Clinic registered successfully.",
      subdomain,
    });
  } catch (error) {
    next(error);
  }
};


export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const clinic = await Clinic.findOne({ ownerEmail: email });
    if (!clinic) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isMatch = await clinic.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const token = jwt.sign({ id: clinic._id }, config.jwt.accessSecret, {
      expiresIn: "7d",
    });

    const clinicObject = clinic.toObject();
    delete clinicObject.passwordHash;

    res.status(200).json({
      success: true,
      token,
      clinic: clinicObject,
    });
  } catch (error) {
    next(error);
  }
};


export const getMe = async (req, res, next) => {
  try {
    const clinicObject = req.clinic.toObject();
    delete clinicObject.passwordHash;

    res.status(200).json({
      success: true,
      clinic: clinicObject,
    });
  } catch (error) {
    next(error);
  }
};


export const updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = [
      "name",
      "phone",
      "address",
      "city",
      "openingHours",
      "specializations",
      "primaryColor",
      "secondaryColor",
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.clinic[field] = req.body[field];
      }
    });

    await req.clinic.save();

    const clinicObject = req.clinic.toObject();
    delete clinicObject.passwordHash;

    res.status(200).json({
      success: true,
      clinic: clinicObject,
    });
  } catch (error) {
    next(error);
  }
};


export const changeLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No logo file provided.",
      });
    }


    const result = await uploadToCloudinary(req.file.buffer, "clinic-logos");


    const oldPublicId = req.clinic.logo?.publicId;


    req.clinic.logo = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await req.clinic.save();

  
    if (oldPublicId) {
      try {
        await deleteFromCloudinary(oldPublicId);
      } catch (cloudinaryErr) {
        console.error("Failed to delete old logo from Cloudinary:", cloudinaryErr);
      }
    }

    const clinicObject = req.clinic.toObject();
    delete clinicObject.passwordHash;

    res.status(200).json({
      success: true,
      clinic: clinicObject,
    });
  } catch (error) {
    next(error);
  }
};
