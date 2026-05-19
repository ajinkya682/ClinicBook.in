import express from "express";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import config from "./config/config.js";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";

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

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ClinicBook Server is healthy",
    timestamp: new Date(),
  });
});

app.use(errorHandler);

export default app;