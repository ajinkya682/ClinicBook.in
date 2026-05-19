import nodemailer from "nodemailer";
import config from "../config/config.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.email.user || "placeholder@gmail.com",
    pass: config.email.pass || "placeholder_pass",
  },
});

/**
 * Sends an email using Gmail SMTP.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject line.
 * @param {string} html - HTML email body.
 * @returns {Promise<object>} - Nodemailer send result.
 */
export const sendEmail = async (to, subject, html) => {
  try {
    if (!config.email.user || !config.email.pass) {
      console.warn(
        "Gmail SMTP credentials not configured. Skipping email dispatch.",
      );
      return { messageId: "mock_msg_id", status: "skipped" };
    }

    const mailOptions = {
      from: `"ClinicBook" <${config.email.user}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Gmail Send Error:", error);
    throw error;
  }
};
