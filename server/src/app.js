import express from "express";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import config from "./config/config.js";

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

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ClinicBook Server is healthy",
    timestamp: new Date(),
  });
});

app.use((err, req, res, next) => {
  console.error("Global Error Handler Catch:", err);
  
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
});

export default app;