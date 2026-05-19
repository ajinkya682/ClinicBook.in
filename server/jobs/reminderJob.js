import cron from "node-cron";
import { sendReminders } from "../src/controllers/notificationController.js";

/**
 * Schedule the appointment reminders cron job to execute every 5 minutes
 */
const startReminderJob = () => {
  // Pattern: Run every 5 minutes (*/5 * * * *)
  cron.schedule("*/5 * * * *", async () => {
    console.log("[Cron Job] Checking for pending appointment reminders...");
    try {
      await sendReminders();
    } catch (err) {
      console.error("[Cron Job] Scheduled reminder job encountered an error:", err);
    }
  });
  
  console.log("[Cron Job] Appointment reminder scheduler successfully initialized.");
};

export default startReminderJob;
