import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Star, 
  MessageSquare, 
  Flag, 
  Check, 
  AlertTriangle, 
  Activity, 
  Smile, 
  CornerDownRight, 
  Send 
} from "lucide-react";
import api from "../../lib/api.js";

// Helper to render star rating stars
const renderStars = (rating) => {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          size={16} 
          fill={i < Math.round(rating) ? "hsl(var(--amber-500))" : "none"} 
          color={i < Math.round(rating) ? "hsl(var(--amber-500))" : "hsl(var(--text-secondary))"} 
        />
      ))}
    </div>
  );
};

const ReviewsPage = () => {
  const queryClient = useQueryClient();
  const [replyTexts, setReplyTexts] = useState({});

  // 1. Fetch dashboard reviews and statistics
  const { 
    data: reviewsData, 
    isLoading: isReviewsLoading,
    isError: isReviewsError 
  } = useQuery({
    queryKey: ["dashboardReviews"],
    queryFn: async () => {
      const response = await api.get("/reviews");
      return response.data;
    }
  });

  // 2. Reply Mutation
  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, reply }) => {
      const response = await api.patch("/reviews/reply", { reviewId, reply });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardReviews"] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to submit reply. Please try again.");
    }
  });

  // 3. Flag Mutation
  const flagMutation = useMutation({
    mutationFn: async (reviewId) => {
      const response = await api.patch("/reviews/flag", { reviewId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardReviews"] });
    },
    onError: (err) => {
      alert(err.response?.data?.message || "Failed to flag review. Please try again.");
    }
  });

  // Handle reply submit
  const handleReplySubmit = (reviewId) => {
    const text = replyTexts[reviewId];
    if (!text || !text.trim()) return;

    replyMutation.mutate({ reviewId, reply: text });
    setReplyTexts(prev => ({ ...prev, [reviewId]: "" }));
  };

  if (isReviewsLoading) {
    return (
      <div style={styles.loadingWrapper}>
        <Activity size={32} className="animate-spin" style={{ color: "hsl(var(--teal-600))" }} />
        <span style={{ marginTop: "1rem", fontWeight: "600" }}>Compiling patient feedback ledger...</span>
      </div>
    );
  }

  if (isReviewsError) {
    return (
      <div style={styles.errorWrapper}>
        <AlertTriangle size={48} style={{ color: "hsl(var(--destructive))", marginBottom: "1rem" }} />
        <h2>Failed to load reviews data</h2>
        <p>Ensure your clinic dashboard connection remains online.</p>
      </div>
    );
  }

  const reviews = reviewsData?.reviews || [];
  const stats = reviewsData?.stats || { averageRating: 0, totalReviews: 0, ratingDistribution: {} };

  return (
    <div style={styles.container} className="animate-fade-in">
      
      {/* Upper header action bar */}
      <div style={styles.headerBar}>
        <div>
          <h1 style={styles.pageTitle}>Patient Reviews & Moderation</h1>
          <p style={styles.pageSubtitle}>Monitor patients feedback, post official replies, and flag inappropriate comments.</p>
        </div>
      </div>

      {/* Grid: Left stats summary, Right distribution bars */}
      <div style={styles.statsPanelGrid}>
        
        {/* Left Side: Rating summary */}
        <div className="card" style={styles.statsCardLeft}>
          <Smile size={42} style={{ color: "hsl(var(--teal-600))", marginBottom: "0.5rem" }} />
          <h2 style={styles.ratingNumber}>{stats.averageRating || "0.0"}</h2>
          <div style={{ marginBottom: "0.5rem" }}>
            {renderStars(stats.averageRating || 5)}
          </div>
          <span style={styles.ratingCountSub}>{stats.totalReviews || 0} Patient Reviews</span>
        </div>

        {/* Right Side: Rating distribution bars */}
        <div className="card" style={styles.statsCardRight}>
          <h3 style={styles.distributionTitle}>Rating Distribution</h3>
          <div style={styles.distributionList}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution?.[rating] || 0;
              const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

              return (
                <div key={rating} style={styles.distRow}>
                  <span style={styles.distLabel}>{rating} Star</span>
                  <div style={styles.distBarBg}>
                    <div style={{ ...styles.distBarFill, width: `${pct}%` }}></div>
                  </div>
                  <span style={styles.distCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Reviews list title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2rem", marginBottom: "1rem" }}>
        <MessageSquare size={18} style={{ color: "hsl(var(--teal-700))" }} />
        <h3 style={styles.reviewsTitle}>All Visible Feedback ({reviews.length} Items)</h3>
      </div>

      {/* Reviews items list */}
      <div style={styles.reviewsListContainer}>
        {reviews.map((review) => {
          const hasReply = !!review.reply;
          return (
            <div key={review._id} className="card" style={styles.reviewItemCard}>
              <div style={styles.reviewHeader}>
                
                {/* User info details */}
                <div style={styles.reviewUserSection}>
                  <div style={styles.userAvatar}>
                    {review.patientId?.name ? review.patientId.name[0].toUpperCase() : "P"}
                  </div>
                  <div>
                    <h4 style={styles.reviewerName}>{review.patientId?.name || "Anonymous Patient"}</h4>
                    <div style={styles.metaRow}>
                      {renderStars(review.rating)}
                      <span style={styles.metaDivider}>•</span>
                      <span>{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>

                {/* Moderation actions header */}
                <div style={styles.moderationActionsHeader}>
                  <button 
                    className="btn btn-secondary" 
                    title="Flag comment to remove from public view"
                    onClick={() => {
                      if (confirm("Are you sure you want to flag this review? It will be immediately hidden from the public patient booking page.")) {
                        flagMutation.mutate(review._id);
                      }
                    }}
                    style={styles.flagBtn}
                  >
                    <Flag size={14} />
                    <span>Flag</span>
                  </button>
                </div>

              </div>

              {/* Review Text comment */}
              <p style={styles.commentContent}>{review.comment || "No comment content provided by the patient."}</p>

              {/* Saved reply bubble */}
              {hasReply && (
                <div style={styles.savedReplyBubble}>
                  <div style={styles.savedReplyHeader}>
                    <CornerDownRight size={14} style={{ color: "hsl(var(--teal-600))" }} />
                    <span style={{ fontSize: "0.75rem", fontWeight: "750", color: "hsl(var(--text-primary))" }}>Your Dashboard Response:</span>
                  </div>
                  <p style={styles.savedReplyText}>{review.reply}</p>
                </div>
              )}

              {/* Reply modifier section */}
              <div style={styles.replyBoxFooter}>
                <div style={styles.inputWrapper}>
                  <input 
                    type="text" 
                    placeholder={hasReply ? "Modify response..." : "Type reply to this review..."} 
                    value={replyTexts[review._id] || ""}
                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [review._id]: e.target.value }))}
                    className="form-input"
                    style={styles.replyInput}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleReplySubmit(review._id);
                    }}
                  />
                  <button 
                    type="button" 
                    disabled={replyMutation.isPending}
                    onClick={() => handleReplySubmit(review._id)}
                    className="btn btn-primary"
                    style={styles.replySubmitBtn}
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {reviews.length === 0 && (
          <div style={styles.emptyCard}>
            <MessageSquare size={36} style={{ color: "hsl(var(--text-secondary))", marginBottom: "0.5rem" }} />
            <span>No Visible Reviews</span>
            <p style={{ fontSize: "0.75rem", color: "hsl(var(--text-secondary))", marginTop: "0.25rem" }}>
              Active patient reviews will populate here. Completed appointments automatically invite reviews from patients.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

const styles = {
  loadingWrapper: {
    minHeight: "400px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  errorWrapper: {
    minHeight: "450px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center"
  },
  container: {
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem"
  },
  pageTitle: {
    fontSize: "1.5rem",
    fontWeight: "900",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em"
  },
  pageSubtitle: {
    fontSize: "0.8125rem",
    color: "hsl(var(--text-secondary))"
  },
  statsPanelGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "1.5rem",
    flexWrap: "wrap"
  },
  statsCardLeft: {
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    textAlign: "center"
  },
  ratingNumber: {
    fontSize: "3.5rem",
    fontWeight: "950",
    color: "hsl(var(--text-primary))",
    lineHeight: "1"
  },
  ratingCountSub: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "600"
  },
  statsCardRight: {
    padding: "1.5rem 2rem",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },
  distributionTitle: {
    fontSize: "0.875rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    marginBottom: "1rem"
  },
  distributionList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  distRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))"
  },
  distLabel: {
    width: "40px",
    fontWeight: "600"
  },
  distBarBg: {
    flex: 1,
    height: "8px",
    backgroundColor: "hsl(var(--slate-100))",
    borderRadius: "4px",
    overflow: "hidden"
  },
  distBarFill: {
    height: "100%",
    backgroundColor: "hsl(var(--teal-500))",
    borderRadius: "4px"
  },
  distCount: {
    width: "25px",
    textAlign: "right",
    fontWeight: "750",
    color: "hsl(var(--text-primary))"
  },
  reviewsTitle: {
    fontSize: "0.9375rem",
    fontWeight: "900",
    color: "hsl(var(--text-primary))"
  },
  reviewsListContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  reviewItemCard: {
    padding: "1.5rem",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "0.5rem"
  },
  reviewUserSection: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center"
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    color: "hsl(var(--teal-600))",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.9375rem"
  },
  reviewerName: {
    fontSize: "0.875rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))"
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.6875rem",
    color: "hsl(var(--text-secondary))",
    marginTop: "0.125rem"
  },
  metaDivider: {
    opacity: 0.5
  },
  moderationActionsHeader: {
    display: "flex",
    gap: "0.5rem"
  },
  flagBtn: {
    padding: "0.25rem 0.5rem",
    fontSize: "0.6875rem",
    fontWeight: "750",
    color: "hsl(var(--destructive))",
    backgroundColor: "hsl(var(--destructive-50))",
    borderColor: "hsl(var(--destructive-200))",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "6px"
  },
  commentContent: {
    fontSize: "0.8125rem",
    color: "hsl(var(--text-primary))",
    lineHeight: "1.5",
    backgroundColor: "hsl(var(--slate-50))",
    padding: "0.75rem 1rem",
    borderRadius: "8px"
  },
  savedReplyBubble: {
    borderLeft: "3.5px solid hsl(var(--teal-500))",
    backgroundColor: "rgba(13, 148, 136, 0.03)",
    padding: "0.75rem 1rem",
    borderRadius: "0 8px 8px 0",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  savedReplyHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem"
  },
  savedReplyText: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))",
    lineHeight: "1.5"
  },
  replyBoxFooter: {
    borderTop: "1px solid hsl(var(--border-light))",
    paddingTop: "0.75rem",
    display: "flex"
  },
  inputWrapper: {
    display: "flex",
    width: "100%",
    gap: "0.5rem"
  },
  replyInput: {
    flex: 1,
    padding: "0.375rem 0.75rem",
    fontSize: "0.75rem",
    borderRadius: "6px"
  },
  replySubmitBtn: {
    padding: "0 0.75rem",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "hsl(var(--teal-600))",
    border: "none",
    color: "white"
  },
  emptyCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3.5rem 1.5rem",
    backgroundColor: "white",
    borderRadius: "var(--radius-lg)",
    textAlign: "center",
    color: "hsl(var(--text-secondary))",
    fontSize: "0.8125rem",
    fontWeight: "750"
  }
};

export default ReviewsPage;
