import express from "express";
import {
  getReviews,
  replyToReview,
  flagReview,
} from "../controllers/reviewController.js";
import { authenticateClinic } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware globally to all review endpoints
router.use(authenticateClinic);

router.get("/", getReviews);
router.patch("/reply", replyToReview);
router.patch("/flag", flagReview);
router.patch("/:id/flag", flagReview);

export default router;
