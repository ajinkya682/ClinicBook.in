import express from "express";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import http from "http";
import { Server } from "socket.io";
import config from "./config/config.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import socketHandler from "./utils/socketHandler.js";

const app = express();


app.use(morgan("dev"));

app.use(compression());


app.use(helmet());


app.use(
  cors({
    origin: config.frontendURL,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(mongoSanitize());

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/public", publicRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ClinicBook Server is healthy",
    timestamp: new Date(),
  });
});

app.use(errorHandler);

// Create HTTP server from the Express app
const server = http.createServer(app);

// Initialize Socket.io Server instance
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

// Attach io to Express app state
app.set("io", io);

// Call socketHandler
socketHandler(io);

export { app, server };
export default server;