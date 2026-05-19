import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Building,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { useAuthStore } from "../store/authStore.js";

/**
 * Premium dashboard shell layout containing the left sidebar navigation and the main display port
 */
const DashboardLayout = () => {
  const { clinic, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  // Sidebar collapse state
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem("sidebar-collapsed") === "true"
  );

  // Dark theme state
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark"
  );

  // Initialize Dark Mode theme settings
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem("theme", nextMode ? "dark" : "light");
  };

  const toggleSidebar = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    localStorage.setItem("sidebar-collapsed", nextCollapsed ? "true" : "false");
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/dashboard/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Appointments", path: "/dashboard/appointments", icon: Calendar },
    { name: "Patients", path: "/dashboard/patients", icon: Users },
    { name: "Doctors", path: "/dashboard/doctors", icon: Stethoscope },
    { name: "Prescriptions", path: "/dashboard/prescriptions", icon: FileText },
    { name: "Reviews", path: "/dashboard/reviews", icon: MessageSquare },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div style={styles.layoutContainer}>
      {/* Sidebar Navigation */}
      <aside style={{ ...styles.sidebar, width: isCollapsed ? "75px" : "240px" }}>
        {/* Header/Logo */}
        <div style={{ ...styles.logoSection, padding: isCollapsed ? "1.5rem 0.5rem" : "1.5rem 1.25rem", justifyContent: isCollapsed ? "center" : "flex-start" }}>
          {clinic?.logo ? (
            <img src={clinic.logo} alt={clinic.name} style={styles.logoImage} />
          ) : (
            <div style={styles.logoPlaceholder}>
              <Building size={20} />
            </div>
          )}
          {!isCollapsed && <span style={styles.logoText}>ClinicBook</span>}
        </div>

        {/* Navigation Items */}
        <nav style={styles.navMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                title={isCollapsed ? item.name : undefined}
                style={({ isActive }) => ({
                  ...styles.navLink,
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  padding: isCollapsed ? "0.75rem 0" : "0.75rem 1rem",
                  ...(isActive ? styles.navLinkActive : {}),
                })}
              >
                <Icon size={18} />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Sidebar Trigger Button */}
        <div style={{ ...styles.collapseTriggerRow, padding: isCollapsed ? "1rem 0" : "1rem 1.25rem", justifyContent: isCollapsed ? "center" : "flex-start" }}>
          <button 
            type="button" 
            onClick={toggleSidebar} 
            style={styles.collapseBtn}
            title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>Collapse Sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Main viewport area */}
      <div style={styles.mainContent}>
        {/* Top Header Bar */}
        <header style={styles.header}>
          <div style={styles.headerTitleSection}>
            <Building size={18} style={styles.headerIcon} />
            <h1 style={styles.clinicName}>{clinic?.name || "My Clinic"}</h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Dark Mode Toggle Button */}
            <button 
              type="button" 
              onClick={toggleDarkMode} 
              style={styles.themeToggleBtn}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun size={18} style={{ color: "hsl(var(--amber-500))" }} />
              ) : (
                <Moon size={18} style={{ color: "hsl(var(--text-secondary))" }} />
              )}
            </button>

            <button onClick={handleLogout} className="btn btn-secondary" style={styles.logoutBtn}>
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Router Outlet for nested pages */}
        <main style={styles.pageContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Vanilla CSS styles in JS to ensure extreme premium layouts
const styles = {
  layoutContainer: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    backgroundColor: "hsl(var(--background))",
  },
  sidebar: {
    width: "240px",
    height: "100%",
    backgroundColor: "hsl(var(--surface))",
    borderRight: "1px solid hsl(var(--surface-border))",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    zIndex: 10,
  },
  logoSection: {
    padding: "1.5rem 1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    borderBottom: "1px solid hsl(var(--surface-border))",
  },
  logoImage: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    objectFit: "cover",
    border: "1px solid hsl(var(--surface-border))",
  },
  logoPlaceholder: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: "hsl(var(--teal-50))",
    color: "hsl(var(--teal-500))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontWeight: "700",
    fontSize: "1.125rem",
    color: "hsl(var(--teal-600))",
    letterSpacing: "-0.025em",
  },
  navMenu: {
    padding: "1.25rem 0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    flex: 1,
    overflowY: "auto",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    color: "hsl(var(--text-secondary))",
    borderRadius: "var(--radius-md)",
    fontSize: "0.875rem",
    fontWeight: "500",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    cursor: "pointer",
  },
  navLinkActive: {
    backgroundColor: "hsl(var(--teal-500))",
    color: "white",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.15)",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  header: {
    height: "70px",
    backgroundColor: "hsl(var(--surface))",
    borderBottom: "1px solid hsl(var(--surface-border))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 2rem",
    flexShrink: 0,
  },
  headerTitleSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  headerIcon: {
    color: "hsl(var(--teal-500))",
  },
  clinicName: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "hsl(var(--text-primary))",
  },
  logoutBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
  },
  pageContent: {
    flex: 1,
    overflowY: "auto",
    padding: "2rem",
    backgroundColor: "hsl(var(--background))",
  },
  collapseTriggerRow: {
    borderTop: "1px solid hsl(var(--surface-border))",
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  collapseBtn: {
    background: "transparent",
    border: "none",
    color: "hsl(var(--text-secondary))",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.5rem 0",
    transition: "all 0.2s ease",
  },
  themeToggleBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    transition: "all 0.2s ease",
  }
};

export default DashboardLayout;
