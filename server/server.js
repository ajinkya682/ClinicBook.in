import server from "./src/app.js";
import connectToDB from "./src/config/database.js";
import startReminderJob from "./jobs/reminderJob.js";

connectToDB();

// Start the cron scheduler for appointment reminders
startReminderJob();

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
