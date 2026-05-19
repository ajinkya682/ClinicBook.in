import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let _toastFn = null;

/**
 * Global toast() function – can be called anywhere without hooks.
 * Use: toast.success("Saved!") | toast.error("Failed!") | toast.warn("Watch out!") | toast("Info")
 */
export const toast = (message, type = "info", duration = 4000) => {
  if (_toastFn) _toastFn(message, type, duration);
};
toast.success = (msg, dur) => toast(msg, "success", dur);
toast.error = (msg, dur) => toast(msg, "error", dur);
toast.warn = (msg, dur) => toast(msg, "warn", dur);
toast.info = (msg, dur) => toast(msg, "info", dur);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warn: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: { bg: "#f0fdf4", border: "#86efac", icon: "#16a34a", text: "#14532d" },
  error:   { bg: "#fff1f2", border: "#fca5a5", icon: "#dc2626", text: "#7f1d1d" },
  warn:    { bg: "#fffbeb", border: "#fcd34d", icon: "#d97706", text: "#78350f" },
  info:    { bg: "#eff6ff", border: "#93c5fd", icon: "#2563eb", text: "#1e3a8a" },
};

let _id = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = ++_id;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    _toastFn = addToast;
    return () => { _toastFn = null; };
  }, [addToast]);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Toast Container – fixed bottom-right */}
      <div style={styles.container}>
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div
              key={t.id}
              className="animate-fade-in"
              style={{
                ...styles.toast,
                backgroundColor: c.bg,
                borderColor: c.border,
                color: c.text,
              }}
            >
              <Icon size={18} style={{ color: c.icon, flexShrink: 0 }} />
              <span style={styles.message}>{t.message}</span>
              <button
                style={{ ...styles.dismiss, color: c.icon }}
                onClick={() => dismiss(t.id)}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return toast; // fallback to global
  return ctx;
};

const styles = {
  container: {
    position: "fixed",
    bottom: "1.5rem",
    right: "1.5rem",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
    maxWidth: "420px",
    width: "calc(100vw - 3rem)",
    pointerEvents: "none",
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1.125rem",
    borderRadius: "12px",
    border: "1.5px solid",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)",
    fontSize: "0.875rem",
    fontWeight: "500",
    lineHeight: "1.4",
    pointerEvents: "all",
    backdropFilter: "blur(8px)",
  },
  message: {
    flex: 1,
  },
  dismiss: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    opacity: 0.6,
  },
};
