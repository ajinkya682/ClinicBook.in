import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  FileText 
} from "lucide-react";
import api from "../../lib/api.js";

/**
 * Premium Two-Column Clinic Registration Page
 */
const RegisterPage = () => {
  // Form input states
  const [clinicName, setClinicName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // App status states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Simple password validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // POST body matching server validation: name (ownerName), email, phone, clinicName, city, password
      await api.post("/auth/register", {
        name: ownerName,
        email,
        phone,
        clinicName,
        city,
        password,
      });

      setIsSuccess(true);
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message || 
        "Failed to create clinic. This email might already be registered."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Render Success Screen
  if (isSuccess) {
    return (
      <div style={styles.pageWrapper}>
        <div className="glassmorphism animate-fade-in" style={styles.successCard}>
          <div style={styles.successBadge}>
            <CheckCircle size={36} style={{ color: "white" }} />
          </div>
          <h2 style={styles.successTitle}>Registration Completed!</h2>
          <p style={styles.successDesc}>
            A welcome verification email has been successfully sent to <strong style={{ color: "hsl(var(--teal-600))" }}>{email}</strong>. 
            Please check your inbox (and spam folder) to verify your account details.
          </p>
          <button 
            className="btn btn-primary" 
            style={styles.successBtn}
            onClick={() => navigate("/dashboard/login")}
          >
            <span>Go to Login</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // 2. Render Two-Column Registration Form
  return (
    <div style={styles.registerContainer}>
      {/* Left Column: Premium value propositions */}
      <div style={styles.leftCol}>
        <div style={styles.leftOverlay}></div>
        <div style={styles.leftContent}>
          <div style={styles.platformBadge}>
            <span>ClinicBook.in</span>
          </div>
          
          <h1 style={styles.leftTitle}>The Smartest Clinic Queue & Record Engine.</h1>
          <p style={styles.leftSubtitle}>
            Digitize appointments, automate patient reminders, and manage high-fidelity prescriptions in one unified staff dashboard.
          </p>

          {/* Bullet points */}
          <div style={styles.bulletsSection}>
            <div style={styles.bulletItem}>
              <div style={styles.bulletIconBox}>
                <Zap size={20} style={{ color: "hsl(var(--teal-400))" }} />
              </div>
              <div>
                <h3 style={styles.bulletHeadline}>Automated WhatsApp Reminders</h3>
                <p style={styles.bulletText}>Reduce patient no-shows by 85% with automatic 24-hour and 1-hour schedule cron alerts.</p>
              </div>
            </div>

            <div style={styles.bulletItem}>
              <div style={styles.bulletIconBox}>
                <FileText size={20} style={{ color: "hsl(var(--teal-400))" }} />
              </div>
              <div>
                <h3 style={styles.bulletHeadline}>High-Fidelity PDF Prescriptions</h3>
                <p style={styles.bulletText}>Generate structured, stylized prescription forms and upload buffers securely to Cloudinary.</p>
              </div>
            </div>

            <div style={styles.bulletItem}>
              <div style={styles.bulletIconBox}>
                <ShieldCheck size={20} style={{ color: "hsl(var(--teal-400))" }} />
              </div>
              <div>
                <h3 style={styles.bulletHeadline}>Live Virtual Queue Rooms</h3>
                <p style={styles.bulletText}>Stream live waitlists and schedule statuses seamlessly across clinic displays with Socket.io.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div style={styles.rightCol}>
        <div className="animate-fade-in" style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Create Your Clinic</h2>
            <p style={styles.formSubtitle}>Sign up to claim your booking subdomain in seconds</p>
          </div>

          {error && (
            <div style={styles.errorAlert}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="clinic-name">Clinic Name</label>
                <div style={styles.inputContainer}>
                  <Building size={16} style={styles.inputIcon} />
                  <input
                    id="clinic-name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Care Clinic"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="owner-name">Owner Full Name</label>
                <div style={styles.inputContainer}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    id="owner-name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="Dr. Ajinkya Sai"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="reg-email">Email Address</label>
                <div style={styles.inputContainer}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    id="reg-email"
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

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="reg-phone">Phone Number</label>
                <div style={styles.inputContainer}>
                  <Phone size={16} style={styles.inputIcon} />
                  <input
                    id="reg-phone"
                    type="tel"
                    required
                    className="form-input"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-city">City Location</label>
              <div style={styles.inputContainer}>
                <MapPin size={16} style={styles.inputIcon} />
                <input
                  id="reg-city"
                  type="text"
                  required
                  className="form-input"
                  placeholder="Pune"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div style={styles.inputContainer}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    id="reg-password"
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

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                <div style={styles.inputContainer}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={styles.submitBtn}
            >
              {isLoading ? "Provisioning Dashboard..." : "Create My Clinic Dashboard"}
            </button>
          </form>

          {/* Login option */}
          <div style={styles.loginRedirect}>
            <span style={styles.redirectText}>Already have a clinic dashboard? </span>
            <Link to="/dashboard/login" style={styles.redirectLink}>
              Login here
            </Link>
          </div>
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
  },
  successCard: {
    maxWidth: "500px",
    width: "100%",
    padding: "3.5rem 2.5rem",
    borderRadius: "var(--radius-xl)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
    boxShadow: "var(--shadow-xl)",
  },
  successBadge: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "hsl(var(--teal-500))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 20px rgba(13, 148, 136, 0.3)",
  },
  successTitle: {
    fontSize: "1.75rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em",
  },
  successDesc: {
    fontSize: "0.95rem",
    color: "hsl(var(--text-secondary))",
    lineHeight: "1.6",
    margin: "0 0.5rem",
  },
  successBtn: {
    padding: "0.875rem 2rem",
    fontSize: "0.95rem",
    marginTop: "0.5rem",
    display: "flex",
    gap: "0.5rem",
    width: "100%",
  },
  registerContainer: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "hsl(var(--surface))",
  },
  leftCol: {
    flex: "1 1 45%",
    background: "linear-gradient(135deg, hsl(var(--teal-800)) 0%, hsl(var(--slate-900)) 100%)",
    position: "relative",
    display: "none", // responsive hide
    padding: "4rem",
    color: "white",
    flexDirection: "column",
    justifyContent: "center",
    // media query equivalent for desktop:
    "@media (min-width: 1024px)": {
      display: "flex",
    },
  },
  leftOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(13, 148, 136, 0.05)",
    zIndex: 1,
  },
  leftContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "540px",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  platformBadge: {
    alignSelf: "flex-start",
    backgroundColor: "hsla(180, 50%, 94%, 0.15)",
    border: "1px solid hsla(180, 50%, 94%, 0.2)",
    padding: "0.375rem 1rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "hsl(var(--teal-300))",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  leftTitle: {
    fontSize: "2.5rem",
    fontWeight: "800",
    lineHeight: "1.2",
    letterSpacing: "-0.03em",
  },
  leftSubtitle: {
    fontSize: "1.05rem",
    color: "hsl(var(--slate-300))",
    lineHeight: "1.6",
    marginBottom: "1rem",
  },
  bulletsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  bulletItem: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
  },
  bulletIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bulletHeadline: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "white",
    marginBottom: "0.25rem",
  },
  bulletText: {
    fontSize: "0.875rem",
    color: "hsl(var(--slate-400))",
    lineHeight: "1.5",
  },
  rightCol: {
    flex: "1 1 55%",
    height: "100%",
    overflowY: "auto",
    padding: "3rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "hsl(var(--background))",
  },
  formContainer: {
    width: "100%",
    maxWidth: "540px",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  formHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
  },
  formTitle: {
    fontSize: "1.875rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em",
  },
  formSubtitle: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "500",
  },
  errorAlert: {
    backgroundColor: "hsl(var(--rose-500) / 0.1)",
    border: "1px solid hsl(var(--rose-500) / 0.2)",
    color: "hsl(var(--rose-500))",
    padding: "0.875rem 1.25rem",
    borderRadius: "var(--radius-md)",
    fontSize: "0.875rem",
    fontWeight: "500",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  formRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
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
    paddingLeft: "2.5rem",
  },
  submitBtn: {
    width: "100%",
    padding: "0.875rem",
    marginTop: "1.25rem",
    fontSize: "1rem",
  },
  loginRedirect: {
    textAlign: "center",
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
  },
  redirectText: {
    fontWeight: "500",
  },
  redirectLink: {
    color: "hsl(var(--teal-600))",
    fontWeight: "600",
    cursor: "pointer",
  },
};

// Simple hook to inject left column flex rendering dynamically on media queries
if (typeof window !== "undefined") {
  const injectStyle = () => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @media (min-width: 1024px) {
        div[style*="leftCol"] {
          display: flex !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  };
  injectStyle();
}

export default RegisterPage;
