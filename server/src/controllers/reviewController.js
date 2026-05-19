import Review from "../models/reviewModel.js";

/**
 * Get all visible reviews for this clinic, complete with stats
 */
export const getReviews = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;

    // Filter visible reviews (isVisible !== false && isFlagged !== true)
    const reviews = await Review.find({
      clinicId,
      isVisible: { $ne: false },
      isFlagged: { $ne: true },
    })
      .populate("patientId", "name")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    let averageRating = 0;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalReviews > 0) {
      let sum = 0;
      reviews.forEach((review) => {
        sum += review.rating;
        // Group into distribution bucket
        const r = Math.round(review.rating);
        if (ratingDistribution[r] !== undefined) {
          ratingDistribution[r]++;
        }
      });
      averageRating = parseFloat((sum / totalReviews).toFixed(1));
    }

    res.status(200).json({
      success: true,
      reviews,
      stats: {
        averageRating,
        totalReviews,
        ratingDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reply to a review
 */
export const replyToReview = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    const { reviewId, reply } = req.body;

    if (!reviewId || reply === undefined) {
      return res.status(400).json({
        success: false,
        message: "Review ID and reply text are required.",
      });
    }

    const review = await Review.findOne({ _id: reviewId, clinicId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized.",
      });
    }

    review.reply = reply;
    await review.save();

    res.status(200).json({
      success: true,
      message: "Reply saved successfully.",
      review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Flag a review (marks isFlagged as true and hides it by setting isVisible to false)
 */
export const flagReview = async (req, res, next) => {
  try {
    const clinicId = req.clinic._id;
    // Accept reviewId from request body or params for ease of integration
    const reviewId = req.body.reviewId || req.params.id;

    if (!reviewId) {
      return res.status(400).json({
        success: false,
        message: "Review ID is required.",
      });
    }

    const review = await Review.findOne({ _id: reviewId, clinicId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized.",
      });
    }

    // Set flagged and hidden status
    review.isFlagged = true;
    review.isVisible = false;
    await review.save();

    res.status(200).json({
      success: true,
      message: "Review flagged successfully and removed from public view.",
    });
  } catch (error) {
    next(error);
  }
};
