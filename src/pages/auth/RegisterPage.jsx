import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  CheckCircle,
  Activity,
  Award,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import api from "../../lib/api.js";

/**
 * Premium split two-column Register page for new clinics
 */
const RegisterPage = () => {
  // Form fields
  const [clinicName, setClinicName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Simple validations
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      // POST mapping to /api/auth/register
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
      console.error("Registration failure:", err);
      const msg = err.response?.data?.message || "Registration failed. This email or subdomain may already be registered.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={styles.successWrapper}>
        <div className="card animate-fade-in" style={styles.successCard}>
          <div style={styles.successBadge}>
            <CheckCircle size={44} color="white" />
          </div>
          <h2 style={styles.successTitle}>Registration Complete!</h2>
          <p style={styles.successSubtitle}>
            Your ClinicBook dashboard has been successfully created. We have sent a welcome activation email to:
          </p>
          <div style={styles.emailHighlight}>
            <strong>{email}</strong>
          </div>
          <p style={styles.successInstructions}>
            Please review your email to discover your unique subdomain, credentials summary, and onboarding checklist.
          </p>
          <Link to="/dashboard/login" className="btn btn-primary" style={styles.successBtn}>
            <span>Go to Login Dashboard</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.splitPageContainer}>
      {/* Column 1: Gradient Value Proposition */}
      <div style={styles.propositionColumn}>
        <div style={styles.propOverlay}></div>
        <div style={styles.propContent}>
          {/* Logo */}
          <div style={styles.logoSection}>
            <div style={styles.logoBadgeSmall}>
              <Activity size={18} color="white" />
            </div>
            <span style={styles.logoTextProp}>ClinicBook.in</span>
          </div>

          {/* Heading */}
          <div style={styles.propHeader}>
            <h1 style={styles.propMainTitle}>Digitalize Your Private Practice.</h1>
            <p style={styles.propSubtitle}>
              Streamline booking calendars, patient files, queue updates, and digital prescriptions in one premium platform.
            </p>
          </div>

          {/* Bullet points */}
          <div style={styles.bulletsList}>
            <div style={styles.bulletItem}>
              <div style={styles.bulletIconWrapper}>
                <Sparkles size={18} color="hsl(var(--teal-200))" />
              </div>
              <div>
                <h3 style={styles.bulletTitle}>Smart Custom Subdomains</h3>
                <p style={styles.bulletDesc}>
                  Secure a dedicated booking website for patient reservation flows in seconds.
                </p>
              </div>
            </div>

            <div style={styles.bulletItem}>
              <div style={styles.bulletIconWrapper}>
                <Award size={18} color="hsl(var(--teal-200))" />
              </div>
              <div>
                <h3 style={styles.bulletTitle}>Real-time Dashboard & Sockets</h3>
                <p style={styles.bulletDesc}>
                  Monitor patient queues and check-in timeline states live, without reloading.
                </p>
              </div>
            </div>

            <div style={styles.bulletItem}>
              <div style={styles.bulletIconWrapper}>
                <ShieldCheck size={18} color="hsl(var(--teal-200))" />
              </div>
              <div>
                <h3 style={styles.bulletTitle}>Enterprise Prescription PDFs</h3>
                <p style={styles.bulletDesc}>
                  Generate styled scripts with high-performance PDFKit integration.
                </p>
              </div>
            </div>
          </div>

          <div style={styles.propFooter}>
            <span>Joined by hundreds of physicians and private clinics nationwide.</span>
          </div>
        </div>
      </div>

      {/* Column 2: Registration Form */}
      <div style={styles.formColumn}>
        <div style={styles.formColumnContent}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Register Your Clinic</h2>
            <p style={styles.formSubtitle}>Create your account dashboard today</p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div style={styles.errorAlert}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.registerForm}>
            {/* Split row for names */}
            <div style={styles.splitRow}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Clinic Name</label>
                <div style={styles.inputWrapper}>
                  <Building size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Apex Health Clinic"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Owner's Full Name</label>
                <div style={styles.inputWrapper}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Dr. John Doe"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Split row for email/phone */}
            <div style={styles.splitRow}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail size={16} style={styles.inputIcon} />
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="doctor@apexhealth.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Phone Number</label>
                <div style={styles.inputWrapper}>
                  <Phone size={16} style={styles.inputIcon} />
                  <input
                    type="tel"
                    required
                    className="form-input"
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* City input */}
            <div className="form-group">
              <label className="form-label">City</label>
              <div style={styles.inputWrapper}>
                <MapPin size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Split row for Passwords */}
            <div style={styles.splitRow}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Confirm Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    type="password"
                    required
                    className="form-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={styles.submitBtn}
            >
              {isLoading ? "Creating Dashboard..." : "Create My Clinic Dashboard"}
            </button>
          </form>

          {/* Footer Backlink */}
          <div style={styles.formFooter}>
            <span>Already have an active account? </span>
            <Link to="/dashboard/login" style={styles.backToLoginLink}>
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  splitPageContainer: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "hsl(var(--background))",
  },
  // Column 1 Styling
  propositionColumn: {
    flex: "1 1 45%",
    background: "linear-gradient(135deg, hsl(180 80% 24%) 0%, hsl(210 20% 10%) 100%)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    padding: "3.5rem",
    position: "relative",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  propOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "radial-gradient(circle at 80% 20%, hsla(180, 50%, 40%, 0.15) 0%, transparent 60%)",
    pointerEvents: "none",
  },
  propContent: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between",
    zIndex: 2,
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoBadgeSmall: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "hsl(var(--teal-500))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(13, 148, 136, 0.3)",
  },
  logoTextProp: {
    fontSize: "1.125rem",
    fontWeight: "800",
    letterSpacing: "-0.03em",
    color: "white",
  },
  propHeader: {
    marginTop: "4rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  propMainTitle: {
    fontSize: "2.5rem",
    fontWeight: "800",
    letterSpacing: "-0.03em",
    lineHeight: "1.15",
  },
  propSubtitle: {
    fontSize: "1rem",
    color: "hsl(var(--teal-100))",
    lineHeight: "1.6",
    fontWeight: "400",
  },
  bulletsList: {
    margin: "4rem 0",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  bulletItem: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
  },
  bulletIconWrapper: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  bulletTitle: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "white",
  },
  bulletDesc: {
    fontSize: "0.875rem",
    color: "hsl(var(--slate-300))",
    marginTop: "0.25rem",
    lineHeight: "1.4",
  },
  propFooter: {
    fontSize: "0.8125rem",
    color: "hsl(var(--teal-300))",
    fontWeight: "500",
  },
  // Column 2 Styling
  formColumn: {
    flex: "1 1 55%",
    backgroundColor: "hsl(var(--surface))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3.5rem",
    overflowY: "auto",
  },
  formColumnContent: {
    width: "100%",
    maxWidth: "540px",
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  formHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  formTitle: {
    fontSize: "1.75rem",
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
    backgroundColor: "hsl(var(--rose-50) / 0.95)",
    border: "1px solid hsl(var(--rose-200))",
    color: "hsl(var(--rose-500))",
    padding: "0.875rem 1.25rem",
    borderRadius: "var(--radius-md)",
    fontSize: "0.875rem",
    fontWeight: "600",
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
  },
  registerForm: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  splitRow: {
    display: "flex",
    gap: "1rem",
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
    paddingLeft: "2.5rem",
  },
  submitBtn: {
    width: "100%",
    padding: "0.875rem",
    fontSize: "0.9375rem",
    marginTop: "1.25rem",
  },
  formFooter: {
    textAlign: "center",
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "500",
  },
  backToLoginLink: {
    color: "hsl(var(--teal-600))",
    fontWeight: "600",
  },
  // Success Card Wrapper
  successWrapper: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "hsl(var(--background))",
    padding: "1rem",
  },
  successCard: {
    width: "100%",
    maxWidth: "500px",
    padding: "3.5rem",
    textAlign: "center",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-xl)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
  },
  successBadge: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "hsl(var(--teal-500))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 24px rgba(13, 148, 136, 0.3)",
    marginBottom: "0.5rem",
  },
  successTitle: {
    fontSize: "1.875rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em",
  },
  successSubtitle: {
    fontSize: "0.9375rem",
    color: "hsl(var(--text-secondary))",
    lineHeight: "1.5",
  },
  emailHighlight: {
    backgroundColor: "hsl(var(--teal-50))",
    border: "1px solid hsl(var(--teal-200))",
    color: "hsl(var(--teal-700))",
    padding: "0.75rem 1.5rem",
    borderRadius: "var(--radius-md)",
    fontSize: "1rem",
  },
  successInstructions: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    lineHeight: "1.6",
    maxWidth: "400px",
  },
  successBtn: {
    marginTop: "0.5rem",
    width: "100%",
    padding: "0.875rem",
    display: "flex",
    gap: "0.5rem",
  },
};

export default RegisterPage;
