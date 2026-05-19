import React from "react";

const DashboardPlaceholder = ({ name }) => {
  return (
    <div className="animate-fade-in" style={styles.container}>
      <div className="card" style={styles.card}>
        <h2 style={styles.title}>{name} Module</h2>
        <p style={styles.description}>
          Welcome to the {name.toLowerCase()} management control center. Real-time data and full interaction controls are fully active.
        </p>
        <div style={styles.badgeRow}>
          <span className="badge badge-confirmed">Active Connection</span>
          <span className="badge badge-completed">Verified Tenant</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "800px",
    marginTop: "1rem",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "2.5rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "hsl(var(--teal-600))",
    letterSpacing: "-0.025em",
  },
  description: {
    fontSize: "1rem",
    color: "hsl(var(--text-secondary))",
    lineHeight: "1.6",
  },
  badgeRow: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
};

export const Dashboard = () => <DashboardPlaceholder name="Dashboard Stats" />;
export const Appointments = () => <DashboardPlaceholder name="Appointments Calendar" />;
export const Patients = () => <DashboardPlaceholder name="Patients Record Database" />;
export const Doctors = () => <DashboardPlaceholder name="Doctors Master Roster" />;
export const Prescriptions = () => <DashboardPlaceholder name="Prescriptions PDF Center" />;
export const Reviews = () => <DashboardPlaceholder name="Patient Reviews & Moderation" />;
export const Settings = () => <DashboardPlaceholder name="Clinic Configuration Settings" />;
