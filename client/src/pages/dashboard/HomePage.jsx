import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { 
  Calendar, 
  Users, 
  IndianRupee, 
  TrendingUp, 
  Clock, 
  Check, 
  UserCheck, 
  CheckSquare, 
  AlertCircle,
  Building,
  User
} from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import api from "../../lib/api.js";
import { toast } from "../../components/Toast.jsx";

/**
 * Custom individual Stat Card Component
 */
const StatCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="card animate-fade-in" style={styles.statCard}>
      <div style={styles.statCardLeft}>
        <span style={styles.statCardTitle}>{title}</span>
        <span style={styles.statCardValue}>{value}</span>
      </div>
      <div 
        style={{
          ...styles.statCardIconBox,
          backgroundColor: `${color}15`,
          color: color
        }}
      >
        <Icon size={24} />
      </div>
    </div>
  );
};

/**
 * Premium Home Page Dashboard for Clinic Staff and Doctors
 */
const HomePage = () => {
  const { clinic } = useAuthStore();
  const queryClient = useQueryClient();

  // 1. TanStack Query to fetch all Dashboard details in parallel
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard:home"],
    queryFn: async () => {
      const [timelineRes, statsRes, patientStatsRes] = await Promise.all([
        api.get("/appointments/timeline"),
        api.get("/appointments/stats"),
        api.get("/patients/stats").catch(() => null)
      ]);

      return {
        timeline: timelineRes.data.timeline || [],
        stats: statsRes.data.stats || {},
        totalPatients: patientStatsRes?.data?.stats?.totalPatients || clinic?.totalPatients || 0
      };
    }
  });

  // 2. Client-Side Socket.io Integration
  useEffect(() => {
    if (!clinic?._id) return;

    // Connect to Socket.io Server (matches backend server root address)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin.replace("5173", "3000");
    const socket = io(socketUrl, {
      transports: ["websocket"]
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected to server, joining room:", clinic._id);
      socket.emit("join", clinic._id);
    });

    // Invalidate queries on new/updated appointment events to trigger automatic UI refreshes
    socket.on("appointment:new", (newApp) => {
      console.log("[Socket] Real-time appointment created:", newApp);
      queryClient.invalidateQueries({ queryKey: ["dashboard:home"] });
    });

    socket.on("appointment:updated", (updatedApp) => {
      console.log("[Socket] Real-time appointment updated:", updatedApp);
      queryClient.invalidateQueries({ queryKey: ["dashboard:home"] });
    });

    socket.on("queue:updated", (queue) => {
      console.log("[Socket] Real-time queue updated.");
      queryClient.invalidateQueries({ queryKey: ["dashboard:home"] });
    });

    // Clean up on component unmount
    return () => {
      socket.disconnect();
      console.log("[Socket] Disconnected from server");
    };
  }, [clinic?._id, queryClient]);

  // 3. Action Helpers
  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await api.patch("/appointments/status", { appointmentId, status });
      // Invalidate queries for instant refresh
      queryClient.invalidateQueries({ queryKey: ["dashboard:home"] });
    } catch (err) {
      console.error("Failed to update appointment status:", err);
      toast.error(err.response?.data?.message || "Could not update status. Please try again.");
    }
  };

  const handleBulkConfirm = async (pendingIds) => {
    if (!pendingIds || pendingIds.length === 0) return;
    try {
      await api.post("/appointments/bulk-confirm", { appointmentIds: pendingIds });
      queryClient.invalidateQueries({ queryKey: ["dashboard:home"] });
    } catch (err) {
      console.error("Failed to bulk confirm appointments:", err);
      toast.error(err.response?.data?.message || "Bulk confirmation failed. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div style={styles.dashboardContainer} className="animate-fade-in">
        {/* Skeleton Top Row Grid */}
        <section style={styles.statsGrid}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="card" style={styles.statCard}>
              <div style={{ ...styles.statCardLeft, width: "70%" }}>
                <div className="skeleton" style={{ height: "12px", width: "80px", borderRadius: "4px", marginBottom: "8px" }}></div>
                <div className="skeleton" style={{ height: "24px", width: "50px", borderRadius: "6px" }}></div>
              </div>
              <div className="skeleton" style={{ width: "48px", height: "48px", borderRadius: "12px" }}></div>
            </div>
          ))}
        </section>

        {/* Skeleton Bottom Grid Columns */}
        <div style={styles.colsGrid}>
          <section style={styles.leftColumn} className="card">
            <div style={{ ...styles.sectionHeader, borderBottom: "1px solid hsl(var(--surface-border))" }}>
              <div className="skeleton" style={{ height: "20px", width: "180px", borderRadius: "4px" }}></div>
            </div>
            <div style={styles.timelineList}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} style={styles.timelineCard} className="card">
                  <div style={styles.timelineCardMain}>
                    <div className="skeleton" style={{ height: "28px", width: "90px", borderRadius: "6px" }}></div>
                    <div style={{ flex: 1, marginLeft: "1rem" }}>
                      <div className="skeleton" style={{ height: "14px", width: "120px", borderRadius: "4px", marginBottom: "6px" }}></div>
                      <div className="skeleton" style={{ height: "10px", width: "80px", borderRadius: "3px" }}></div>
                    </div>
                    <div className="skeleton" style={{ height: "14px", width: "100px", borderRadius: "4px", marginLeft: "auto" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={styles.rightColumn} className="card">
            <div style={styles.panelHeader}>
              <div className="skeleton" style={{ height: "20px", width: "150px", borderRadius: "4px" }}></div>
            </div>
            <div style={styles.pendingList}>
              {Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} style={styles.pendingCard}>
                  <div className="skeleton" style={{ height: "14px", width: "110px", borderRadius: "4px", marginBottom: "8px" }}></div>
                  <div className="skeleton" style={{ height: "10px", width: "140px", borderRadius: "3px" }}></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={styles.errorContainer} className="card">
        <AlertCircle size={40} style={{ color: "hsl(var(--rose-500))" }} />
        <h3 style={styles.errorTitle}>Synchronization Outage</h3>
        <p style={styles.errorText}>Could not communicate with the cloud booking server. Please verify your connection.</p>
        <button className="btn btn-secondary" onClick={() => refetch()}>Retry Connection</button>
      </div>
    );
  }

  const timeline = data?.timeline || [];
  const stats = data?.stats || {};
  const totalPatients = data?.totalPatients || 0;

  // Filter pending lists
  const pendingAppointments = timeline.filter((app) => app.status === "pending");
  const pendingIds = pendingAppointments.map((app) => app._id);

  // Status Badge Mapper helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-pending">Pending</span>;
      case "confirmed":
        return <span className="badge badge-confirmed">Confirmed</span>;
      case "checkedIn":
        return <span className="badge" style={{ backgroundColor: "rgba(6, 182, 212, 0.15)", color: "hsl(180, 75%, 36%)" }}>Checked-In</span>;
      case "completed":
        return <span className="badge badge-completed">Completed</span>;
      case "cancelled":
        return <span className="badge badge-cancelled">Cancelled</span>;
      default:
        return <span className="badge badge-noShow">{status}</span>;
    }
  };

  return (
    <div style={styles.dashboardContainer} className="animate-fade-in">
      {/* 1. Stat cards top row grid */}
      <section style={styles.statsGrid}>
        <StatCard 
          title="Today's Appointments" 
          value={stats.todayCount || 0} 
          icon={Calendar} 
          color="hsl(var(--teal-500))" 
        />
        <StatCard 
          title="Total Patients" 
          value={totalPatients} 
          icon={Users} 
          color="hsl(var(--indigo-500))" 
        />
        <StatCard 
          title="This Month's Revenue" 
          value={`₹${(stats.revenueThisMonth || 0).toLocaleString("en-IN")}`} 
          icon={IndianRupee} 
          color="hsl(var(--emerald-500))" 
        />
        <StatCard 
          title="Completion Rate" 
          value={`${stats.completionRate || 0}%`} 
          icon={TrendingUp} 
          color="hsl(var(--amber-500))" 
        />
      </section>

      {/* 2. Double columns bottom layout */}
      <div style={styles.colsGrid}>
        {/* Left Column: Today's Timeline */}
        <section style={styles.leftColumn} className="card">
          <div style={styles.sectionHeader}>
            <Clock size={20} style={{ color: "hsl(var(--teal-500))" }} />
            <h2 style={styles.sectionTitle}>Today's Appointment Timeline</h2>
            <span style={styles.timelineCountBadge}>{timeline.length} slots booked</span>
          </div>

          <div style={styles.timelineList}>
            {timeline.length === 0 ? (
              <div style={styles.emptyState}>
                <Calendar size={48} style={styles.emptyStateIcon} />
                <p style={styles.emptyStateText}>No appointments booked for today yet.</p>
              </div>
            ) : (
              timeline.map((app) => (
                <div key={app._id} style={styles.timelineCard} className="card">
                  {/* Card Header information */}
                  <div style={styles.timelineCardMain}>
                    <div style={styles.timeBadge}>
                      <Clock size={14} />
                      <span>{app.timeSlot}</span>
                    </div>

                    <div style={styles.patientMeta}>
                      <span style={styles.patientName}>{app.patientId?.name || "Anonymous Patient"}</span>
                      <span style={styles.patientPhone}>{app.patientId?.phone || "No phone details"}</span>
                    </div>

                    <div style={styles.doctorMeta}>
                      <User size={14} style={{ color: "hsl(var(--teal-500))" }} />
                      <span style={styles.doctorName}>Dr. {app.doctorId?.name || "General Roster"}</span>
                    </div>

                    <div style={styles.badgeWrapper}>
                      {getStatusBadge(app.status)}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {app.status !== "completed" && app.status !== "cancelled" && (
                    <div style={styles.timelineActions}>
                      {app.status === "pending" && (
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleUpdateStatus(app._id, "confirmed")}
                          style={styles.actionBtn}
                        >
                          <Check size={14} />
                          <span>Confirm</span>
                        </button>
                      )}

                      {app.status !== "checkedIn" && (
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleUpdateStatus(app._id, "checkedIn")}
                          style={styles.actionBtn}
                        >
                          <UserCheck size={14} />
                          <span>Check-in</span>
                        </button>
                      )}

                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleUpdateStatus(app._id, "completed")}
                        style={{ ...styles.actionBtn, ...styles.completeBtn }}
                      >
                        <CheckSquare size={14} />
                        <span>Complete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Pending Confirmations */}
        <section style={styles.rightColumn} className="card">
          <div style={styles.panelHeader}>
            <div style={styles.panelHeaderLeft}>
              <AlertCircle size={20} style={{ color: "hsl(var(--amber-500))" }} />
              <h2 style={styles.panelTitle}>Pending Confirmations</h2>
            </div>
            {pendingAppointments.length > 0 && (
              <button 
                className="btn btn-primary animate-pulse" 
                onClick={() => handleBulkConfirm(pendingIds)}
                style={styles.confirmAllBtn}
              >
                <span>Confirm All ({pendingAppointments.length})</span>
              </button>
            )}
          </div>

          <div style={styles.pendingList}>
            {pendingAppointments.length === 0 ? (
              <div style={styles.emptyStateMini}>
                <CheckCircleIcon size={36} color="hsl(var(--emerald-500))" />
                <p style={styles.emptyStateTextMini}>All scheduled slots are fully confirmed!</p>
              </div>
            ) : (
              pendingAppointments.map((app) => (
                <div key={app._id} style={styles.pendingCard}>
                  <div style={styles.pendingCardHeader}>
                    <span style={styles.pendingPatientName}>{app.patientId?.name || "Anonymous Patient"}</span>
                    <span style={styles.pendingTime}>{app.timeSlot}</span>
                  </div>
                  <div style={styles.pendingCardFooter}>
                    <span style={styles.pendingDocName}>Dr. {app.doctorId?.name}</span>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleUpdateStatus(app._id, "confirmed")}
                      style={styles.pendingConfirmBtn}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

// Check Circle Icon auxiliary helper
const CheckCircleIcon = ({ size = 24, color }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const styles = {
  dashboardContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    paddingBottom: "3rem"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.5rem"
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.75rem",
    backgroundColor: "hsl(var(--surface))"
  },
  statCardLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  statCardTitle: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase",
    letterSpacing: "0.025em"
  },
  statCardValue: {
    fontSize: "1.875rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em"
  },
  statCardIconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  colsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "2rem",
    alignItems: "start",
    // responsive handling handled in inline JS styling
    "@media (min-width: 1024px)": {
      gridTemplateColumns: "1.7fr 1fr"
    }
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    padding: "2rem",
    backgroundColor: "hsl(var(--surface))"
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    borderBottom: "1px solid hsl(var(--surface-border))",
    paddingBottom: "1rem"
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))"
  },
  timelineCountBadge: {
    marginLeft: "auto",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--teal-600))",
    backgroundColor: "hsl(var(--teal-50))",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px"
  },
  timelineList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  timelineCard: {
    padding: "1.25rem",
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--surface-border))",
    borderRadius: "var(--radius-md)",
    boxShadow: "none",
    transform: "none",
    transition: "all 0.2s ease"
  },
  timelineCardMain: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem"
  },
  timeBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.375rem 0.75rem",
    backgroundColor: "hsl(var(--surface))",
    border: "1px solid hsl(var(--surface-border))",
    borderRadius: "var(--radius-sm)",
    fontSize: "0.8125rem",
    fontWeight: "600",
    color: "hsl(var(--text-primary))"
  },
  patientMeta: {
    display: "flex",
    flexDirection: "column",
    minWidth: "160px"
  },
  patientName: {
    fontSize: "0.95rem",
    fontWeight: "600",
    color: "hsl(var(--text-primary))"
  },
  patientPhone: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))"
  },
  doctorMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    color: "hsl(var(--text-secondary))",
    minWidth: "150px"
  },
  doctorName: {
    whiteSpace: "nowrap"
  },
  badgeWrapper: {
    marginLeft: "auto"
  },
  timelineActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
    borderTop: "1px solid hsl(var(--surface-border))",
    paddingTop: "0.875rem",
    justifyContent: "flex-end"
  },
  actionBtn: {
    padding: "0.375rem 0.75rem",
    fontSize: "0.75rem",
    gap: "0.375rem"
  },
  completeBtn: {
    backgroundColor: "hsl(var(--teal-500))"
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    padding: "2rem",
    backgroundColor: "hsl(var(--surface))"
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid hsl(var(--surface-border))",
    paddingBottom: "1rem",
    flexWrap: "wrap",
    gap: "0.75rem"
  },
  panelHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  panelTitle: {
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))"
  },
  confirmAllBtn: {
    padding: "0.4rem 0.875rem",
    fontSize: "0.8125rem",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)"
  },
  pendingList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem"
  },
  pendingCard: {
    padding: "1rem",
    backgroundColor: "hsl(var(--background))",
    borderRadius: "var(--radius-md)",
    border: "1px solid hsl(var(--surface-border))",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  pendingCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  pendingPatientName: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "hsl(var(--text-primary))"
  },
  pendingTime: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "hsl(var(--teal-600))"
  },
  pendingCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.25rem"
  },
  pendingDocName: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))"
  },
  pendingConfirmBtn: {
    padding: "0.25rem 0.625rem",
    fontSize: "0.75rem",
    backgroundColor: "hsl(var(--surface))"
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 2rem",
    textAlign: "center",
    gap: "0.75rem"
  },
  emptyStateIcon: {
    color: "hsl(var(--slate-300))"
  },
  emptyStateText: {
    fontSize: "0.95rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "500"
  },
  emptyStateMini: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1.5rem",
    textAlign: "center",
    gap: "0.75rem"
  },
  emptyStateTextMini: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "500"
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
    lineHeight: "1.5"
  }
};

// Dynamically inject layout media queries & animations in DOM context safely
if (typeof window !== "undefined") {
  const injectStyle = () => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @media (min-width: 1024px) {
        div[style*="colsGrid"] {
          grid-template-columns: 1.7fr 1fr !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  };
  injectStyle();
}

export default HomePage;
