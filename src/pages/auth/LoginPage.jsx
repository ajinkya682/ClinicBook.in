import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Building, Eye, EyeOff, Activity, ArrowRight, AlertCircle } from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import api from "../../lib/api.js";

/**
 * Centered Clinic Dashboard Login screen
 */
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("error"); // "error" | "success"

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const showToast = (message, type = "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { clinic, token } = response.data;
      
      setAuth(clinic, token);
      showToast("Signed in successfully!", "success");
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      console.error("Login failure:", err);
      const msg = err.response?.data?.message || "Invalid email or password. Please try again.";
      showToast(msg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    showToast("Password reset link has been dispatched to admin support.", "success");
  };

  return (
    <div style={styles.pageWrapper}>
      {/* Premium Toast Notification */}
      {toastMessage && (
        <div style={{
          ...styles.toast,
          ...(toastType === "success" ? styles.toastSuccess : styles.toastError)
        }}>
          <AlertCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Login Card */}
      <div className="card animate-fade-in" style={styles.card}>
        {/* Brand Logo & Heading */}
        <div style={styles.logoContainer}>
          <div style={styles.logoBadge}>
            <Activity size={24} color="white" />
          </div>
          <span style={styles.logoText}>ClinicBook</span>
        </div>

        <div style={styles.headerText}>
          <h2 style={styles.heading}>Clinic Dashboard Login</h2>
          <p style={styles.subheading}>Access clinic scheduler and records</p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                required
                className="form-input"
                placeholder="doctor@clinicbook.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "0.5rem" }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleBtn}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={styles.forgotRow}>
            <a href="#" onClick={handleForgotPassword} style={styles.linkAccent}>
              Forgot Password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={styles.submitBtn}
          >
            {isLoading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Registration Link */}
        <div style={styles.footerRow}>
          <span>Don't have a dashboard yet? </span>
          <Link to="/dashboard/register" style={styles.linkTeal}>
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
    backgroundColor: "hsl(var(--background))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    position: "relative",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    padding: "2.5rem",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-lg)",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  logoBadge: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    backgroundColor: "hsl(var(--teal-500))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(13, 148, 136, 0.2)",
  },
  logoText: {
    fontSize: "1.25rem",
    fontWeight: "800",
    color: "hsl(var(--teal-600))",
    letterSpacing: "-0.03em",
  },
  headerText: {
    textAlign: "center",
  },
  heading: {
    fontSize: "1.375rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.02em",
  },
  subheading: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    marginTop: "0.25rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  inputWrapper: {
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
    paddingRight: "2.75rem",
  },
  toggleBtn: {
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
    padding: 0,
  },
  forgotRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "1rem",
  },
  linkAccent: {
    fontSize: "0.8125rem",
    fontWeight: "500",
    color: "hsl(var(--text-secondary))",
    transition: "color 0.2s ease",
  },
  submitBtn: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "0.9375rem",
  },
  footerRow: {
    textAlign: "center",
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    marginTop: "0.5rem",
    fontWeight: "500",
  },
  linkTeal: {
    color: "hsl(var(--teal-600))",
    fontWeight: "600",
    cursor: "pointer",
  },
  toast: {
    position: "absolute",
    top: "1.5rem",
    right: "1.5rem",
    padding: "0.875rem 1.25rem",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-lg)",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: "600",
    zIndex: 9999,
    animation: "fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
  },
  toastSuccess: {
    backgroundColor: "hsl(var(--teal-50))",
    border: "1px solid hsl(var(--teal-200))",
    color: "hsl(var(--teal-600))",
  },
  toastError: {
    backgroundColor: "hsl(var(--rose-50) / 0.95)",
    border: "1px solid hsl(var(--rose-200))",
    color: "hsl(var(--rose-500))",
  },
};

export default LoginPage;
