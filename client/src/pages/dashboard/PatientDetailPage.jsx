import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Activity, 
  Calendar, 
  Clock, 
  FileText, 
  Eye, 
  Download, 
  AlertCircle,
  Stethoscope,
  Heart
} from "lucide-react";
import api from "../../lib/api.js";

/**
 * Premium Patient Detail Profile Page showing structured health profiles, visit timelines, and medical prescriptions.
 */
const PatientDetailPage = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();

  // 1. Fetch Patient details (includes basic info + recent appointments list)
  const { data: patientData, isLoading: patientLoading, isError: patientError } = useQuery({
    queryKey: ["patient:detail", patientId],
    queryFn: async () => {
      const response = await api.get(`/patients/${patientId}`);
      return response.data || {};
    }
  });

  // 2. Fetch all Prescriptions for this specific patient
  const { data: prescriptionsData, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["patient:prescriptions", patientId],
    queryFn: async () => {
      const response = await api.get(`/prescriptions/patient/${patientId}`);
      return response.data?.prescriptions || [];
    }
  });

  if (patientLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <span style={styles.loadingText}>Assembling Comprehensive Health Profile...</span>
      </div>
    );
  }

  if (patientError) {
    return (
      <div style={styles.errorContainer} className="card">
        <AlertCircle size={40} style={{ color: "hsl(var(--rose-500))" }} />
        <h3 style={styles.errorTitle}>Profile Loading Interrupted</h3>
        <p style={styles.errorText}>Could not recover the patient database registry. Verify the identifier is correct.</p>
        <button className="btn btn-secondary" onClick={() => navigate("/dashboard/patients")}>
          <ArrowLeft size={16} />
          <span>Back to Directory</span>
        </button>
      </div>
    );
  }

  const patient = patientData?.patient || {};
  const appointments = patientData?.appointments || [];
  const prescriptions = prescriptionsData || [];

  // Map prescriptions by appointment ID for rapid direct lookups in visit timeline
  const prescriptionsMap = prescriptions.reduce((acc, p) => {
    if (p.appointmentId) {
      acc[p.appointmentId] = p;
    }
    return acc;
  }, {});

  // Age calculation helper
  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + " years old";
  };

  // Safe Date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "Never Visited";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending": return <span className="badge badge-pending">Pending</span>;
      case "confirmed": return <span className="badge badge-confirmed">Confirmed</span>;
      case "checkedIn": return <span className="badge" style={{ backgroundColor: "rgba(6, 182, 212, 0.15)", color: "hsl(180, 75%, 36%)" }}>Checked-In</span>;
      case "completed": return <span className="badge badge-completed">Completed</span>;
      case "cancelled": return <span className="badge badge-cancelled">Cancelled</span>;
      default: return <span className="badge badge-noShow">{status}</span>;
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* Back redirection bar */}
      <section style={styles.backHeader}>
        <button className="btn btn-secondary" onClick={() => navigate("/dashboard/patients")} style={styles.backBtn}>
          <ArrowLeft size={16} />
          <span>Back to Patients Directory</span>
        </button>
      </section>

      {/* 1. Patient Profile Summary Header Card */}
      <section className="card" style={styles.profileHeaderCard}>
        <div style={styles.profileHeaderFlex}>
          <div style={styles.largeAvatar}>
            {patient.name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div style={styles.profileHeaderText}>
            <div style={styles.nameRow}>
              <h1 style={styles.patientName}>{patient.name}</h1>
              <span style={styles.genderTag}>{patient.gender || "unspecified"}</span>
            </div>
            <p style={styles.patientSubDetail}>
              Born {formatDate(patient.dateOfBirth)} • {calculateAge(patient.dateOfBirth)}
            </p>
          </div>

          {/* Quick Metrics widget boxes */}
          <div style={styles.headerMetrics}>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>Total Consultations</span>
              <span style={styles.metricVal}>{patient.totalVisits || appointments.length || 0} Visits</span>
            </div>
            <div style={styles.metricItem}>
              <span style={styles.metricLabel}>Last Active Visit</span>
              <span style={styles.metricVal}>{formatDate(patient.lastVisit)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Double column sections layout */}
      <div style={styles.gridColumns}>
        {/* LEFT COLUMN: Health Profile & Contact */}
        <div style={styles.leftCol}>
          {/* Health profile block */}
          <div className="card" style={styles.sectionCard}>
            <div style={styles.sectionTitleRow}>
              <Heart size={18} style={{ color: "hsl(var(--rose-500))" }} />
              <h2 style={styles.sectionTitle}>Medical Health Summary</h2>
            </div>
            
            <div style={styles.healthStatsGrid}>
              <div style={styles.healthStatItem}>
                <span style={styles.healthLabel}>Blood Group</span>
                <span style={{ ...styles.healthValue, color: "hsl(var(--rose-500))" }}>{patient.bloodGroup || "Not Typed"}</span>
              </div>
              <div style={styles.healthStatItem} className="form-group">
                <span style={styles.healthLabel}>Known Drug Allergies</span>
                <div style={styles.tagsContainer}>
                  {Array.isArray(patient.allergies) && patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy) => (
                      <span key={allergy} style={styles.allergyTag}>{allergy}</span>
                    ))
                  ) : (
                    <span style={styles.nilValue}>No known drug allergies reported.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="card" style={styles.sectionCard}>
            <div style={styles.sectionTitleRow}>
              <Phone size={18} style={{ color: "hsl(var(--teal-500))" }} />
              <h2 style={styles.sectionTitle}>Contact & Location</h2>
            </div>

            <div style={styles.contactList}>
              <div style={styles.contactItem}>
                <Phone size={14} />
                <span>Phone: <strong>{patient.phone}</strong></span>
              </div>
              <div style={styles.contactItem}>
                <Mail size={14} />
                <span>Email: <strong>{patient.email || "No email on record"}</strong></span>
              </div>
              <div style={styles.contactItem}>
                <MapPin size={14} />
                <span>Address: <strong>{patient.address || "No address on record"}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Visit timeline & Prescriptions */}
        <div style={styles.rightCol}>
          {/* Visit Timeline section */}
          <div className="card" style={styles.sectionCard}>
            <div style={styles.sectionTitleRow}>
              <Stethoscope size={18} style={{ color: "hsl(var(--indigo-500))" }} />
              <h2 style={styles.sectionTitle}>Consultation Timeline</h2>
            </div>

            <div style={styles.timelineList}>
              {appointments.length === 0 ? (
                <div style={styles.emptyBlock}>No recorded appointments on file.</div>
              ) : (
                appointments.map((app, idx) => {
                  const pres = prescriptionsMap[app._id];
                  return (
                    <div key={app._id} style={styles.timelineItem}>
                      {/* Vertical line connector */}
                      <div style={styles.timelineConnector}>
                        <div style={styles.timelinePoint}></div>
                        {idx !== appointments.length - 1 && <div style={styles.timelineLine}></div>}
                      </div>

                      {/* Timeline content details */}
                      <div style={styles.timelineContentCard}>
                        <div style={styles.timelineCardHeader}>
                          <div style={styles.timelineTime}>
                            <Calendar size={12} />
                            <span>{new Date(app.appointmentDate).toDateString()} • {app.timeSlot}</span>
                          </div>
                          <div>{getStatusBadge(app.status)}</div>
                        </div>

                        <p style={styles.timelineDoc}>
                          Consultant: <strong>Dr. {app.doctorId?.name || "General Practitioner"}</strong> ({app.doctorId?.specialization || "General"})
                        </p>

                        {/* Interactive view prescription triggers */}
                        {pres && (
                          <div style={styles.prescriptionShortcut}>
                            <div style={styles.shortcutText}>
                              <FileText size={14} style={{ color: "hsl(var(--teal-600))" }} />
                              <span>Prescription uploaded successfully</span>
                            </div>
                            <a 
                              href={pres.pdfUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-secondary"
                              style={styles.shortcutBtn}
                            >
                              <Eye size={12} />
                              <span>View Slip</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* All prescriptions table/list */}
          <div className="card" style={styles.sectionCard}>
            <div style={styles.sectionTitleRow}>
              <FileText size={18} style={{ color: "hsl(var(--emerald-500))" }} />
              <h2 style={styles.sectionTitle}>Medical Prescriptions Slip History</h2>
            </div>

            <div style={styles.prescriptionList}>
              {prescriptions.length === 0 ? (
                <div style={styles.emptyBlock}>No prescription slips generated or uploaded yet.</div>
              ) : (
                prescriptions.map((pres) => (
                  <div key={pres._id} style={styles.presCard} className="card">
                    <div style={styles.presCardLeft}>
                      <FileText size={24} style={{ color: "hsl(var(--emerald-500))" }} />
                      <div style={styles.presMeta}>
                        <span style={styles.presDate}>{new Date(pres.createdAt).toDateString()}</span>
                        <span style={styles.presDoc}>Doctor: Dr. {pres.doctorId?.name}</span>
                        {pres.diagnosis && (
                          <span style={styles.presDiagnosis}>Diagnosis: <strong>{pres.diagnosis}</strong></span>
                        )}
                      </div>
                    </div>

                    <div style={styles.presActions}>
                      <a 
                        href={pres.pdfUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary" 
                        style={styles.presActionBtn}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </a>
                      <a 
                        href={pres.pdfUrl} 
                        download 
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary" 
                        style={{ ...styles.presActionBtn, backgroundColor: "hsl(var(--teal-500))" }}
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    paddingBottom: "3rem"
  },
  backHeader: {
    display: "flex"
  },
  backBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.8125rem",
    gap: "0.5rem"
  },
  profileHeaderCard: {
    padding: "2rem",
    backgroundColor: "hsl(var(--surface))"
  },
  profileHeaderFlex: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "2rem"
  },
  largeAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "hsl(var(--teal-500))",
    color: "white",
    fontSize: "1.75rem",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 20px rgba(13, 148, 136, 0.2)"
  },
  profileHeaderText: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flexWrap: "wrap"
  },
  patientName: {
    fontSize: "1.75rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em"
  },
  genderTag: {
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    backgroundColor: "hsl(var(--teal-50))",
    color: "hsl(var(--teal-700))",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px"
  },
  patientSubDetail: {
    fontSize: "0.9rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "500"
  },
  headerMetrics: {
    display: "flex",
    gap: "1.5rem",
    marginLeft: "auto",
    flexWrap: "wrap"
  },
  metricItem: {
    padding: "0.75rem 1.25rem",
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--surface-border))",
    borderRadius: "var(--radius-md)",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  metricLabel: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase"
  },
  metricVal: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))"
  },
  gridColumns: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "2rem",
    alignItems: "start",
    // responsive handling in JS stylesheet injection
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "1fr 2fr"
    }
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  sectionCard: {
    padding: "1.75rem",
    backgroundColor: "hsl(var(--surface))"
  },
  sectionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    borderBottom: "1px solid hsl(var(--surface-border))",
    paddingBottom: "0.875rem",
    marginBottom: "1.25rem"
  },
  sectionTitle: {
    fontSize: "1.125rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))"
  },
  healthStatsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  healthStatItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  healthLabel: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase",
    letterSpacing: "0.025em"
  },
  healthValue: {
    fontSize: "1.25rem",
    fontWeight: "800"
  },
  tagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.375rem"
  },
  allergyTag: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--rose-600))",
    backgroundColor: "hsl(var(--rose-50))",
    border: "1px solid hsl(var(--rose-100))",
    padding: "0.25rem 0.625rem",
    borderRadius: "var(--radius-sm)"
  },
  nilValue: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    fontStyle: "italic"
  },
  contactList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.9rem",
    color: "hsl(var(--text-secondary))"
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  timelineList: {
    display: "flex",
    flexDirection: "column"
  },
  timelineItem: {
    display: "flex",
    gap: "1.5rem",
    position: "relative"
  },
  timelineConnector: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "16px",
    flexShrink: 0
  },
  timelinePoint: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "hsl(var(--teal-500))",
    zIndex: 2,
    border: "2px solid hsl(var(--surface))",
    boxShadow: "0 0 0 2px hsl(var(--teal-100))"
  },
  timelineLine: {
    width: "2px",
    flex: 1,
    backgroundColor: "hsl(var(--surface-border))",
    marginTop: "2px",
    marginBottom: "2px"
  },
  timelineContentCard: {
    flex: 1,
    paddingBottom: "2rem"
  },
  timelineCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  timelineTime: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8125rem",
    fontWeight: "700",
    color: "hsl(var(--text-secondary))"
  },
  timelineDoc: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-primary))",
    marginTop: "0.5rem"
  },
  prescriptionShortcut: {
    marginTop: "0.75rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.625rem 0.875rem",
    backgroundColor: "hsla(180, 72%, 42%, 0.05)",
    border: "1px dashed hsl(var(--teal-200))",
    borderRadius: "var(--radius-md)"
  },
  shortcutText: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8125rem",
    color: "hsl(var(--teal-800))",
    fontWeight: "600"
  },
  shortcutBtn: {
    padding: "0.3rem 0.625rem",
    fontSize: "0.75rem"
  },
  emptyBlock: {
    padding: "2rem",
    textAlign: "center",
    color: "hsl(var(--text-secondary))",
    fontStyle: "italic",
    fontSize: "0.875rem"
  },
  prescriptionList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  presCard: {
    padding: "1rem 1.25rem",
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--surface-border))",
    borderRadius: "var(--radius-md)",
    boxShadow: "none",
    transform: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem"
  },
  presCardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1rem"
  },
  presMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  presDate: {
    fontSize: "0.875rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))"
  },
  presDoc: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))"
  },
  presDiagnosis: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))"
  },
  presActions: {
    display: "flex",
    gap: "0.5rem"
  },
  presActionBtn: {
    padding: "0.375rem 0.75rem",
    fontSize: "0.75rem",
    gap: "0.375rem"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "50vh",
    gap: "1.25rem"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid hsl(var(--teal-100))",
    borderTopColor: "hsl(var(--teal-500))",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  loadingText: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "hsl(var(--teal-700))"
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    textAlign: "center",
    gap: "1rem",
    maxWidth: "500px",
    margin: "4rem auto 0 auto"
  },
  errorTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))"
  },
  errorText: {
    fontSize: "0.9rem",
    color: "hsl(var(--text-secondary))",
    lineHeight: "1.5",
    marginBottom: "1rem"
  }
};

// Inject custom layout media query rules directly inside browser header tag dynamically
if (typeof window !== "undefined") {
  const injectStyle = () => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @media (min-width: 1024px) {
        div[style*="gridColumns"] {
          grid-template-columns: 1fr 2.2fr !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  };
  injectStyle();
}

export default PatientDetailPage;
