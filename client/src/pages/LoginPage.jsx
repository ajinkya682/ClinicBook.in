import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Building, ArrowRight, Activity } from "lucide-react";
import { useAuthStore } from "../store/authStore.js";
import api from "../lib/api.js";

/**
 * Premium dashboard Login Page for registered clinics
 */
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { clinic, token } = response.data;
      
      setAuth(clinic, token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failure:", err);
      setError(
        err.response?.data?.message || 
        "Failed to authenticate. Please check your credentials and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Dynamic Animated Decorative Gradients */}
      <div style={styles.blurBlobLeft}></div>
      <div style={styles.blurBlobRight}></div>

      {/* Glassmorphic Container Card */}
      <div className="glassmorphism animate-fade-in" style={styles.cardContainer}>
        {/* Brand/Logo Section */}
        <div style={styles.brandHeader}>
          <div style={styles.brandBadge}>
            <Activity size={24} style={styles.brandIcon} />
          </div>
          <h2 style={styles.brandTitle}>ClinicBook.in</h2>
          <p style={styles.brandSubtitle}>Clinic & Queue Management Portal</p>
        </div>

        {/* Error alert banner */}
        {error && (
          <div style={styles.errorBanner}>
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputContainer}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                required
                className="form-input"
                placeholder="doctor@clinic.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputContainer}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={styles.submitBtn}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Register suggestion */}
        <div style={styles.footerSection}>
          <span style={styles.footerText}>New to ClinicBook? </span>
          <a href="#" style={styles.footerLink}>Register your clinic</a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "hsl(var(--background))",
    overflow: "hidden",
    position: "relative",
  },
  blurBlobLeft: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    backgroundColor: "hsla(180, 72%, 42%, 0.1)",
    filter: "blur(80px)",
    top: "-100px",
    left: "-100px",
    zIndex: 0,
  },
  blurBlobRight: {
    position: "absolute",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    backgroundColor: "hsla(239, 84%, 67%, 0.08)",
    filter: "blur(100px)",
    bottom: "-100px",
    right: "-100px",
    zIndex: 0,
  },
  cardContainer: {
    width: "100%",
    maxWidth: "440px",
    borderRadius: "var(--radius-xl)",
    padding: "3rem 2.5rem",
    boxShadow: "var(--shadow-xl)",
    display: "flex",
    flexDirection: "column",
    gap: "1.75rem",
    zIndex: 1,
  },
  brandHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "0.5rem",
  },
  brandBadge: {
    width: "54px",
    height: "54px",
    borderRadius: "16px",
    backgroundColor: "hsl(var(--teal-500))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px rgba(13, 148, 136, 0.2)",
    marginBottom: "0.5rem",
  },
  brandIcon: {
    color: "white",
  },
  brandTitle: {
    fontSize: "1.75rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em",
  },
  brandSubtitle: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "500",
  },
  errorBanner: {
    backgroundColor: "hsl(var(--rose-500) / 0.1)",
    border: "1px solid hsl(var(--rose-500) / 0.2)",
    color: "hsl(var(--rose-500))",
    padding: "0.75rem 1rem",
    borderRadius: "var(--radius-md)",
    fontSize: "0.875rem",
    fontWeight: "500",
    lineHeight: "1.4",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  inputContainer: {
    position: "relative",
    width: "100%",
  },
  inputIcon: {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "hsl(var(--text-secondary))",
    pointerEvents: "none",
  },
  input: {
    paddingLeft: "2.75rem",
  },
  submitBtn: {
    width: "100%",
    padding: "0.875rem",
    marginTop: "1rem",
    fontSize: "1rem",
    display: "flex",
    gap: "0.5rem",
  },
  footerSection: {
    textAlign: "center",
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    marginTop: "0.5rem",
  },
  footerText: {
    fontWeight: "500",
  },
  footerLink: {
    color: "hsl(var(--teal-600))",
    fontWeight: "600",
    cursor: "pointer",
    transition: "color 0.2s ease",
  },
};

export default LoginPage;
