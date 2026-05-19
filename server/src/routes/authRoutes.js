import express from "express";
import multer from "multer";
import {
  register,
  login,
  getMe,
  updateProfile,
  changeLogo,
} from "../controllers/authController.js";
import { authenticateClinic } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5mb max
});

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateClinic, getMe);
router.patch("/profile", authenticateClinic, updateProfile);
router.post("/logo", authenticateClinic, upload.single("logo"), changeLogo);

export default router;
