import twilio from "twilio";
import config from "../config/config.js";

const accountSid = config.twilio.accountSid;
const authToken = config.twilio.authToken;

let twilioClient = null;
if (accountSid && accountSid.startsWith("AC")) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Send WhatsApp message using Twilio
 * @param {string} phone - Recipient phone number (e.g. +91XXXXXXXXXX)
 * @param {string} message - Message body text
 * @returns {Promise<object>} - Twilio response
 */
export const sendWhatsApp = async (phone, message) => {
  try {
    if (!twilioClient) {
      console.warn(
        "Twilio is not properly configured (requires SID starting with 'AC'). Skipping WhatsApp message.",
      );
      return { sid: "mock_sid_whatsapp", status: "skipped" };
    }

    const formattedTo = phone.startsWith("whatsapp:")
      ? phone
      : `whatsapp:${phone}`;
    const formattedFrom = config.twilio.whatsappNumber.startsWith("whatsapp:")
      ? config.twilio.whatsappNumber
      : `whatsapp:${config.twilio.whatsappNumber}`;

    const response = await twilioClient.messages.create({
      body: message,
      from: formattedFrom,
      to: formattedTo,
    });
    return response;
  } catch (error) {
    console.error("Twilio WhatsApp Error:", error);
    throw error;
  }
};

/**
 * Send SMS using Twilio
 * @param {string} phone - Recipient phone number (e.g. +91XXXXXXXXXX)
 * @param {string} message - Message body text
 * @returns {Promise<object>} - Twilio response
 */
export const sendSMS = async (phone, message) => {
  try {
    if (!twilioClient) {
      console.warn("Twilio is not properly configured (requires SID starting with 'AC'). Skipping SMS.");
      return { sid: "mock_sid_sms", status: "skipped" };
    }

    const response = await twilioClient.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: phone,
    });
    return response;
  } catch (error) {
    console.error("Twilio SMS Error:", error);
    throw error;
  }
};
