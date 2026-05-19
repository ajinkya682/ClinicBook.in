import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Activity, AlertCircle, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import api from "../../lib/api.js";

/**
 * Centered Clinic Dashboard Login Card with high-fidelity styles
 */
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Premium toast notification state
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("error"); // "error" | "success"

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const showToast = (message, type = "error") => {
    setToastMessage(message);
    setToastType(type);
    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setToastMessage("");

    try {
      const response = await api.post("/auth/login", { email, password });
      const { clinic, token } = response.data;
      
      setAuth(clinic, token);
      showToast("Signed in successfully!", "success");
      
      // Delay navigation slightly to let user see success state
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      console.error("Login failure:", err);
      const errMsg = err.response?.data?.message || "Failed to sign in. Please verify your credentials.";
      showToast(errMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Dynamic Blur blobs */}
      <div style={styles.blurBlobLeft}></div>
      <div style={styles.blurBlobRight}></div>

      {/* Modern Top-floating Toast */}
      {toastMessage && (
        <div 
          className="animate-fade-in"
          style={{
            ...styles.toast,
            backgroundColor: toastType === "success" ? "hsl(var(--emerald-500))" : "hsl(var(--rose-500))",
          }}
        >
          <AlertCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Centered Login Card */}
      <div className="glassmorphism animate-fade-in" style={styles.cardContainer}>
        {/* ClinicBook logo */}
        <div style={styles.brandHeader}>
          <div style={styles.brandBadge}>
            <Activity size={24} style={styles.brandIcon} />
          </div>
          <h2 style={styles.brandTitle}>ClinicBook</h2>
          <p style={styles.brandSubtitle}>Clinic Dashboard Login</p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div style={styles.inputContainer}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="login-email"
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

          <div className="form-group" style={{ marginBottom: "0.75rem" }}>
            <div style={styles.passwordHeader}>
              <label className="form-label" htmlFor="login-password">Password</label>
              <a href="#" style={styles.forgotLink}>Forgot Password?</a>
            </div>
            <div style={styles.inputContainer}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, paddingRight: "3rem" }}
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                style={styles.eyeToggleBtn}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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

        {/* Redirect Suggestion to registration */}
        <div style={styles.footerSection}>
          <span style={styles.footerText}>New to our platform? </span>
          <Link to="/dashboard/register" style={styles.footerLink}>
            Register Your Clinic
          </Link>
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
    backgroundColor: "hsl(var(--slate-100))", // Light Gray background as requested
    overflow: "hidden",
    position: "relative",
  },
  blurBlobLeft: {
    position: "absolute",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    backgroundColor: "hsla(180, 72%, 42%, 0.08)",
    filter: "blur(60px)",
    top: "-50px",
    left: "-50px",
    zIndex: 0,
  },
  blurBlobRight: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    backgroundColor: "hsla(239, 84%, 67%, 0.06)",
    filter: "blur(80px)",
    bottom: "-50px",
    right: "-50px",
    zIndex: 0,
  },
  toast: {
    position: "absolute",
    top: "24px",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    borderRadius: "var(--radius-md)",
    color: "white",
    fontWeight: "600",
    fontSize: "0.875rem",
    boxShadow: "var(--shadow-lg)",
    zIndex: 100,
  },
  cardContainer: {
    width: "100%",
    maxWidth: "420px",
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
    width: "50px",
    height: "50px",
    borderRadius: "14px",
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
    fontSize: "1.625rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em",
  },
  brandSubtitle: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "500",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  passwordHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--teal-600))",
    cursor: "pointer",
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
  eyeToggleBtn: {
    position: "absolute",
    right: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "hsl(var(--text-secondary))",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtn: {
    width: "100%",
    padding: "0.875rem",
    marginTop: "1.25rem",
    fontSize: "0.95rem",
    display: "flex",
    gap: "0.5rem",
  },
  footerSection: {
    textAlign: "center",
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    marginTop: "0.25rem",
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
