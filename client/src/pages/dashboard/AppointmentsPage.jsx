import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  User, 
  Search, 
  Download, 
  Plus, 
  MoreVertical, 
  X, 
  Check, 
  AlertCircle, 
  UserCheck, 
  Trash2, 
  Info,
  Clock,
  Phone,
  FileText,
  DollarSign
} from "lucide-react";
import api from "../../lib/api.js";
import { toast } from "../../components/Toast.jsx";

// Utility to format date in Indian style: 15 January 2024
const formatIndianDate = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  const day = d.getDate();
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Premium Appointments Page containing the list, filters, walk-in creation engine, and detailed slide-in side panel
 */
const AppointmentsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split("T")[0];

  // Filters State
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // UI Interactive States
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Walk-in Modal Form States
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinPatientId, setWalkinPatientId] = useState("");
  const [walkinName, setWalkinName] = useState("");
  const [walkinEmail, setWalkinEmail] = useState("");
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [walkinDoctor, setWalkinDoctor] = useState("");
  const [walkinDate, setWalkinDate] = useState(todayStr);
  const [walkinSlot, setWalkinSlot] = useState("");
  const [walkinNotes, setWalkinNotes] = useState("");

  // Slots search states
  const [availableSlots, setAvailableSlots] = useState({ morning: [], afternoon: [], evening: [] });
  const [loadingSlots, setLoadingSlots] = useState(false);

  // 1. Fetch Doctors list for filters
  const { data: doctorsData } = useQuery({
    queryKey: ["doctors:list"],
    queryFn: async () => {
      const response = await api.get("/doctors");
      return response.data.doctors || [];
    }
  });
  const doctorsList = doctorsData || [];

  // 2. Fetch Appointments list based on filters
  const { data: appointmentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["appointments:list", selectedDate, selectedDoctor, selectedStatus],
    queryFn: async () => {
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (selectedDoctor !== "all") params.doctorId = selectedDoctor;
      if (selectedStatus !== "all") params.status = selectedStatus;

      const response = await api.get("/appointments", { params });
      return response.data.appointments || response.data || [];
    }
  });

  const appointmentsList = Array.isArray(appointmentsData) ? appointmentsData : [];

  // Apply search query filter client-side for rapid response
  const filteredAppointments = appointmentsList.filter((app) => {
    const pName = app.patientId?.name || "";
    return pName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 3. Fetch slots whenever doctor or date changes in Walk-in Modal
  useEffect(() => {
    if (!walkinDoctor || !walkinDate) {
      setAvailableSlots({ morning: [], afternoon: [], evening: [] });
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const response = await api.get(`/doctors/${walkinDoctor}/availability`, {
          params: { date: walkinDate }
        });
        setAvailableSlots({
          morning: response.data.morning || [],
          afternoon: response.data.afternoon || [],
          evening: response.data.evening || []
        });
      } catch (err) {
        console.error("Failed to load doctor slots:", err);
        setAvailableSlots({ morning: [], afternoon: [], evening: [] });
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [walkinDoctor, walkinDate]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // 4. Action Handlers
  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      await api.patch("/appointments/status", { appointmentId, status });
      queryClient.invalidateQueries({ queryKey: ["appointments:list"] });
      // If updating the active details panel, sync that state too
      if (selectedAppointment?._id === appointmentId) {
        setSelectedAppointment((prev) => ({ ...prev, status }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update appointment status.");
    }
  };

  const handlePhoneBlur = async () => {
    if (!walkinPhone || walkinPhone.length < 10) return;
    try {
      const response = await api.get("/patients/search", {
        params: { phone: walkinPhone }
      });
      const patient = response.data.patient;
      if (patient) {
        setWalkinPatientId(patient._id);
        setWalkinName(patient.name);
        setWalkinEmail(patient.email || "");
        setIsNewPatient(false);
      }
    } catch (err) {
      // Patient not found: prompt registration inputs
      setWalkinPatientId("");
      setWalkinName("");
      setWalkinEmail("");
      setIsNewPatient(true);
    }
  };

  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    if (!walkinDoctor || !walkinSlot) {
      toast.warn("Please select a doctor and a valid available time slot.");
      return;
    }

    try {
      const body = {
        doctorId: walkinDoctor,
        date: walkinDate,
        timeSlot: walkinSlot,
        notes: walkinNotes,
        channel: "walk-in"
      };

      // If existing patient, pass patientId, else pass name/email/phone for creation
      if (walkinPatientId) {
        body.patientId = walkinPatientId;
      } else {
        body.name = walkinName;
        body.phone = walkinPhone;
        body.email = walkinEmail;
      }

      await api.post("/appointments", body);
      queryClient.invalidateQueries({ queryKey: ["appointments:list"] });
      
      // Reset Modal Form
      setIsAddModalOpen(false);
      setWalkinPhone("");
      setWalkinPatientId("");
      setWalkinName("");
      setWalkinEmail("");
      setWalkinDoctor("");
      setWalkinSlot("");
      setWalkinNotes("");
      setIsNewPatient(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book walk-in appointment.");
    }
  };

  // 5. CSV Export Engine
  const handleExportCSV = () => {
    if (filteredAppointments.length === 0) {
      toast.warn("No appointments available to export for the selected filters.");
      return;
    }

    const headers = ["Time Slot", "Patient Name", "Phone", "Doctor Name", "Channel", "Status", "Consultation Fee"];
    const rows = filteredAppointments.map((app) => [
      app.timeSlot,
      app.patientId?.name || "Anonymous",
      app.patientId?.phone || "N/A",
      app.doctorId?.name || "General Roster",
      app.channel || "app",
      app.status,
      app.consultationFee || 0
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Appointments_Export_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div style={styles.container}>
      {/* Top action header bar */}
      <section style={styles.topActionBar}>
        <h1 style={styles.pageTitle}>Appointments Roster</h1>
        <div style={styles.topButtons}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export to CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Add Walk-in Appointment</span>
          </button>
        </div>
      </section>

      {/* Filter controls row layout */}
      <section className="card" style={styles.filtersCard}>
        <div style={styles.filtersRow}>
          {/* Date Picker */}
          <div className="form-group" style={styles.filterGroup}>
            <label className="form-label">Date Filter</label>
            <input 
              type="date" 
              className="form-input" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          </div>

          {/* Doctor Dropdown */}
          <div className="form-group" style={styles.filterGroup}>
            <label className="form-label">Doctor Roster</label>
            <select 
              className="form-input" 
              value={selectedDoctor} 
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              <option value="all">All Doctors</option>
              {doctorsList.map((doc) => (
                <option key={doc._id} value={doc._id}>Dr. {doc.name}</option>
              ))}
            </select>
          </div>

          {/* Search patient */}
          <div className="form-group" style={{ ...styles.filterGroup, flexGrow: 1 }}>
            <label className="form-label">Search Patient</label>
            <div style={styles.searchWrapper}>
              <Search size={16} style={styles.searchIcon} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search patient name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>
        </div>

        {/* Status Chip Filters */}
        <div style={styles.chipsRow}>
          {["all", "pending", "confirmed", "checkedIn", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                ...styles.statusChip,
                ...(selectedStatus === status ? styles.statusChipActive : {})
              }}
            >
              {status === "all" ? "All Statuses" : status === "checkedIn" ? "Checked-In" : status}
            </button>
          ))}
        </div>
      </section>

      {/* Main Table view */}
      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div style={styles.tableMessage}>
            <div style={styles.spinner}></div>
            <span>Fetching appointments...</span>
          </div>
        ) : isError ? (
          <div style={styles.tableMessage}>
            <AlertCircle size={24} style={{ color: "hsl(var(--rose-500))" }} />
            <span>Could not fetch records. Please check database connectivity.</span>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div style={styles.tableMessage}>
            <Info size={28} style={{ color: "hsl(var(--slate-400))" }} />
            <span>No appointments found matching current filter scope.</span>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Patient Name</th>
                  <th style={styles.th}>Patient Phone</th>
                  <th style={styles.th}>Doctor</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Fee</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((app) => (
                  <tr key={app._id} style={styles.tableRow}>
                    <td style={{ ...styles.td, fontWeight: "600" }}>{app.timeSlot}</td>
                    <td style={{ ...styles.td, fontWeight: "600", color: "hsl(var(--text-primary))" }}>
                      {app.patientId?.name || "Anonymous Patient"}
                    </td>
                    <td style={styles.td}>{app.patientId?.phone || "N/A"}</td>
                    <td style={styles.td}>Dr. {app.doctorId?.name || "General Roster"}</td>
                    <td style={styles.td}>
                      <span 
                        style={{
                          ...styles.channelTag,
                          backgroundColor: app.channel === "walk-in" ? "hsla(239, 84%, 67%, 0.1)" : "hsla(180, 72%, 42%, 0.1)",
                          color: app.channel === "walk-in" ? "hsl(239, 84%, 55%)" : "hsl(180, 72%, 30%)"
                        }}
                      >
                        {app.channel || "app"}
                      </span>
                    </td>
                    <td style={styles.td}>{getStatusBadge(app.status)}</td>
                    <td style={styles.td}>₹{(app.consultationFee || 0).toLocaleString("en-IN")}</td>
                    <td style={{ ...styles.td, textAlign: "right", position: "relative" }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === app._id ? null : app._id);
                        }}
                        style={styles.menuTrigger}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu actions */}
                      {activeMenuId === app._id && (
                        <div style={styles.dropdownMenu} className="card">
                          <button 
                            style={styles.dropdownItem} 
                            onClick={() => handleUpdateStatus(app._id, "confirmed")}
                          >
                            <Check size={14} style={{ color: "hsl(var(--teal-500))" }} />
                            <span>Confirm</span>
                          </button>
                          <button 
                            style={styles.dropdownItem} 
                            onClick={() => handleUpdateStatus(app._id, "completed")}
                          >
                            <UserCheck size={14} style={{ color: "hsl(var(--emerald-500))" }} />
                            <span>Mark Complete</span>
                          </button>
                          <button 
                            style={styles.dropdownItem} 
                            onClick={() => handleUpdateStatus(app._id, "cancelled")}
                          >
                            <Trash2 size={14} style={{ color: "hsl(var(--rose-500))" }} />
                            <span>Cancel Slot</span>
                          </button>
                          <button 
                            style={{ ...styles.dropdownItem, borderTop: "1px solid hsl(var(--surface-border))" }} 
                            onClick={() => setSelectedAppointment(app)}
                          >
                            <Info size={14} style={{ color: "hsl(var(--indigo-500))" }} />
                            <span>View Details</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 6. View Details Slide-in Panel from the Right */}
      {selectedAppointment && (
        <div style={styles.panelBackdrop} onClick={() => setSelectedAppointment(null)}>
          <div style={styles.sidePanel} onClick={(e) => e.stopPropagation()} className="animate-slide-in">
            <div style={styles.panelHeaderContainer}>
              <h2 style={styles.panelHeaderTitle}>Appointment Details</h2>
              <button style={styles.panelCloseBtn} onClick={() => setSelectedAppointment(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.panelBody}>
              {/* Status Badge Box */}
              <div style={styles.panelSection} className="card">
                <div style={styles.metaFlex}>
                  <div style={styles.timeBadge}>
                    <Clock size={14} />
                    <span>{selectedAppointment.timeSlot}</span>
                  </div>
                  <div>
                    {getStatusBadge(selectedAppointment.status)}
                  </div>
                </div>
                <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "hsl(var(--text-secondary))" }}>
                  <span>Booking ID: <strong>{selectedAppointment.bookingId || "N/A"}</strong></span>
                </div>
              </div>

              {/* Patient details block */}
              <div style={styles.panelSection}>
                <h3 style={styles.panelSubTitle}>Patient Profile</h3>
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <User size={16} />
                    <span>{selectedAppointment.patientId?.name || "Anonymous Patient"}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <Phone size={16} />
                    <span>{selectedAppointment.patientId?.phone || "N/A"}</span>
                  </div>
                  {selectedAppointment.patientId?.email && (
                    <div style={styles.detailItem}>
                      <span style={{ fontSize: "0.8125rem", color: "hsl(var(--text-secondary))" }}>Email:</span>
                      <span style={{ fontSize: "0.875rem" }}>{selectedAppointment.patientId.email}</span>
                    </div>
                  )}
                  {selectedAppointment.patientId?.gender && (
                    <div style={styles.detailItem}>
                      <span style={{ fontSize: "0.8125rem", color: "hsl(var(--text-secondary))" }}>Gender:</span>
                      <span style={{ fontSize: "0.875rem" }}>{selectedAppointment.patientId.gender}</span>
                    </div>
                  )}
                  {selectedAppointment.patientId?.dateOfBirth && (
                    <div style={styles.detailItem}>
                      <span style={{ fontSize: "0.8125rem", color: "hsl(var(--text-secondary))" }}>DOB:</span>
                      <span style={{ fontSize: "0.875rem" }}>{new Date(selectedAppointment.patientId.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Details */}
              <div style={styles.panelSection}>
                <h3 style={styles.panelSubTitle}>Doctor Assigned</h3>
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <User size={16} style={{ color: "hsl(var(--teal-500))" }} />
                    <span style={{ fontWeight: "600" }}>Dr. {selectedAppointment.doctorId?.name || "General Doctor"}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={{ fontSize: "0.8125rem", color: "hsl(var(--text-secondary))" }}>Spec:</span>
                    <span style={{ fontSize: "0.875rem" }}>{selectedAppointment.doctorId?.specialization || "General Medicine"}</span>
                  </div>
                </div>
              </div>

              {/* Consult fee */}
              <div style={styles.panelSection}>
                <h3 style={styles.panelSubTitle}>Billing Details</h3>
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <DollarSign size={16} style={{ color: "hsl(var(--emerald-500))" }} />
                    <span>Fee Charge: <strong>₹{(selectedAppointment.consultationFee || 0).toLocaleString("en-IN")}</strong></span>
                  </div>
                </div>
              </div>

              {/* Notes block */}
              {selectedAppointment.notes && (
                <div style={styles.panelSection} className="card">
                  <h3 style={{ ...styles.panelSubTitle, border: "none", padding: 0, marginBottom: "0.5rem" }}>Consultation Notes</h3>
                  <p style={{ fontSize: "0.875rem", color: "hsl(var(--text-secondary))", lineHeight: "1.5" }}>{selectedAppointment.notes}</p>
                </div>
              )}
            </div>

            {/* Quick action bar */}
            <div style={styles.panelFooter}>
              {selectedAppointment.status !== "completed" && selectedAppointment.status !== "cancelled" && (
                <>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleUpdateStatus(selectedAppointment._id, "cancelled")}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  {selectedAppointment.status === "pending" && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleUpdateStatus(selectedAppointment._id, "confirmed")}
                      style={{ flex: 1, borderColor: "hsl(var(--teal-300))", color: "hsl(var(--teal-600))" }}
                    >
                      Confirm
                    </button>
                  )}
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleUpdateStatus(selectedAppointment._id, "completed")}
                    style={{ flex: 2 }}
                  >
                    Complete
                  </button>
                </>
              )}
              {selectedAppointment.status === "completed" && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setSelectedAppointment(null);
                    navigate("/dashboard/prescriptions", { state: { writePrescApp: selectedAppointment } });
                  }}
                  style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}
                >
                  <FileText size={16} />
                  <span>Write Prescription</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Add Walk-in Appointment Modal */}
      {isAddModalOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContainer} className="card animate-fade-in">
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>New Walk-in Appointment</h2>
              <button style={styles.modalCloseBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWalkin} style={styles.modalForm}>
              {/* Phone Lookup Blur trigger */}
              <div className="form-group">
                <label className="form-label" htmlFor="walkin-phone">Patient Phone (Lookup)</label>
                <div style={styles.inputContainer}>
                  <Phone size={16} style={styles.inputIcon} />
                  <input 
                    id="walkin-phone"
                    type="tel" 
                    required 
                    className="form-input" 
                    placeholder="Enter phone to auto-fill..." 
                    value={walkinPhone} 
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    onBlur={handlePhoneBlur}
                    style={{ paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>

              {/* Dynamic New Patient form fields */}
              {isNewPatient && (
                <div style={styles.newPatientBlock} className="animate-fade-in">
                  <div style={styles.newPatientHeader}>
                    <Info size={14} />
                    <span>New Patient Details Required</span>
                  </div>
                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" htmlFor="walkin-name">Full Name</label>
                      <input 
                        id="walkin-name"
                        type="text" 
                        required 
                        className="form-input" 
                        placeholder="John Doe" 
                        value={walkinName} 
                        onChange={(e) => setWalkinName(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" htmlFor="walkin-email">Email Address</label>
                      <input 
                        id="walkin-email"
                        type="email" 
                        className="form-input" 
                        placeholder="john@doe.com" 
                        value={walkinEmail} 
                        onChange={(e) => setWalkinEmail(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Existing Patient details display */}
              {walkinPatientId && !isNewPatient && (
                <div style={styles.patientFoundAlert}>
                  <Check size={14} />
                  <span>Existing Patient Found: <strong>{walkinName}</strong></span>
                </div>
              )}

              {/* Doctor and Date Selection row */}
              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="walkin-doc-select">Select Doctor</label>
                  <select 
                    id="walkin-doc-select"
                    required
                    className="form-input" 
                    value={walkinDoctor} 
                    onChange={(e) => setWalkinDoctor(e.target.value)}
                  >
                    <option value="">Choose Doctor</option>
                    {doctorsList.map((doc) => (
                      <option key={doc._id} value={doc._id}>Dr. {doc.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="walkin-date-picker">Date Picker</label>
                  <input 
                    id="walkin-date-picker"
                    type="date" 
                    required 
                    className="form-input" 
                    value={walkinDate} 
                    onChange={(e) => setWalkinDate(e.target.value)} 
                  />
                </div>
              </div>

              {/* Slots selector engine */}
              <div className="form-group">
                <label className="form-label">Available Slots</label>
                {loadingSlots ? (
                  <div style={styles.slotLoader}>Loading doctor schedules...</div>
                ) : !walkinDoctor ? (
                  <div style={styles.slotPlaceholder}>Please choose a doctor to check time availability.</div>
                ) : (
                  <div style={styles.slotsPanel}>
                    {/* Morning */}
                    {availableSlots.morning.length > 0 && (
                      <div style={styles.slotGroup}>
                        <span style={styles.slotGroupTitle}>Morning</span>
                        <div style={styles.slotsGrid}>
                          {availableSlots.morning.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setWalkinSlot(t)}
                              style={{
                                ...styles.slotBtn,
                                ...(walkinSlot === t ? styles.slotBtnActive : {})
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Afternoon */}
                    {availableSlots.afternoon.length > 0 && (
                      <div style={styles.slotGroup}>
                        <span style={styles.slotGroupTitle}>Afternoon</span>
                        <div style={styles.slotsGrid}>
                          {availableSlots.afternoon.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setWalkinSlot(t)}
                              style={{
                                ...styles.slotBtn,
                                ...(walkinSlot === t ? styles.slotBtnActive : {})
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evening */}
                    {availableSlots.evening.length > 0 && (
                      <div style={styles.slotGroup}>
                        <span style={styles.slotGroupTitle}>Evening</span>
                        <div style={styles.slotsGrid}>
                          {availableSlots.evening.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setWalkinSlot(t)}
                              style={{
                                ...styles.slotBtn,
                                ...(walkinSlot === t ? styles.slotBtnActive : {})
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableSlots.morning.length === 0 && 
                     availableSlots.afternoon.length === 0 && 
                     availableSlots.evening.length === 0 && (
                      <div style={{ ...styles.slotPlaceholder, color: "hsl(var(--rose-500))" }}>
                        No slots available for the doctor on this date.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Consultation notes */}
              <div className="form-group">
                <label className="form-label" htmlFor="walkin-notes">Consultation Notes (Optional)</label>
                <textarea 
                  id="walkin-notes"
                  className="form-input" 
                  placeholder="Reason for visit, symptoms..." 
                  rows={2}
                  value={walkinNotes}
                  onChange={(e) => setWalkinNotes(e.target.value)}
                  style={{ resize: "none" }}
                />
              </div>

              {/* Actions submit */}
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={styles.modalSubmitBtn}
              >
                Create My Appointment
              </button>
            </form>
          </div>
        </div>
      )}
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
  topActionBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem"
  },
  pageTitle: {
    fontSize: "1.625rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em"
  },
  topButtons: {
    display: "flex",
    gap: "0.75rem"
  },
  filtersCard: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    padding: "1.5rem",
    backgroundColor: "hsl(var(--surface))"
  },
  filtersRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    alignItems: "center"
  },
  filterGroup: {
    marginBottom: 0,
    minWidth: "200px"
  },
  searchWrapper: {
    position: "relative",
    width: "100%"
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "hsl(var(--text-secondary))"
  },
  chipsRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    borderTop: "1px solid hsl(var(--surface-border))",
    paddingTop: "1rem"
  },
  statusChip: {
    padding: "0.4rem 0.875rem",
    borderRadius: "9999px",
    border: "1px solid hsl(var(--surface-border))",
    backgroundColor: "hsl(var(--background))",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--text-secondary))",
    cursor: "pointer",
    textTransform: "capitalize",
    transition: "all 0.2s ease"
  },
  statusChipActive: {
    backgroundColor: "hsl(var(--teal-500))",
    borderColor: "hsl(var(--teal-500))",
    color: "white",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.15)"
  },
  tableMessage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "5rem 2rem",
    gap: "1rem",
    color: "hsl(var(--text-secondary))"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid hsl(var(--teal-100))",
    borderTopColor: "hsl(var(--teal-500))",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  tableHeaderRow: {
    borderBottom: "1px solid hsl(var(--surface-border))",
    backgroundColor: "hsl(var(--background))"
  },
  th: {
    padding: "1rem 1.5rem",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  tableRow: {
    borderBottom: "1px solid hsl(var(--surface-border))",
    transition: "background-color 0.2s ease",
    cursor: "pointer"
  },
  td: {
    padding: "1.125rem 1.5rem",
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    verticalAlign: "middle"
  },
  channelTag: {
    padding: "0.25rem 0.625rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    borderRadius: "9999px",
    textTransform: "uppercase"
  },
  menuTrigger: {
    background: "none",
    border: "none",
    color: "hsl(var(--text-secondary))",
    cursor: "pointer",
    padding: "0.25rem",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease",
    ":hover": {
      backgroundColor: "hsl(var(--background))"
    }
  },
  dropdownMenu: {
    position: "absolute",
    right: "1.5rem",
    top: "2.5rem",
    zIndex: 50,
    minWidth: "160px",
    padding: "0.375rem 0",
    boxShadow: "var(--shadow-lg)",
    border: "1px solid hsl(var(--surface-border))"
  },
  dropdownItem: {
    width: "100%",
    padding: "0.625rem 1rem",
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    fontSize: "0.8125rem",
    fontWeight: "500",
    color: "hsl(var(--text-primary))",
    border: "none",
    background: "none",
    textAlign: "left",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    ":hover": {
      backgroundColor: "hsl(var(--background))"
    }
  },
  panelBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 100
  },
  sidePanel: {
    width: "100%",
    maxWidth: "460px",
    height: "100%",
    backgroundColor: "hsl(var(--surface))",
    boxShadow: "var(--shadow-xl)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  panelHeaderContainer: {
    padding: "1.5rem",
    borderBottom: "1px solid hsl(var(--surface-border))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  panelHeaderTitle: {
    fontSize: "1.125rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))"
  },
  panelCloseBtn: {
    background: "none",
    border: "none",
    color: "hsl(var(--text-secondary))",
    cursor: "pointer"
  },
  panelBody: {
    flex: 1,
    overflowY: "auto",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  panelSubTitle: {
    fontSize: "0.875rem",
    fontWeight: "700",
    color: "hsl(var(--teal-700))",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid hsl(var(--surface-border))",
    paddingBottom: "0.5rem",
    marginBottom: "0.75rem"
  },
  panelSection: {
    display: "flex",
    flexDirection: "column"
  },
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem"
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.9rem",
    color: "hsl(var(--text-primary))"
  },
  metaFlex: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  panelFooter: {
    padding: "1.25rem",
    borderTop: "1px solid hsl(var(--surface-border))",
    backgroundColor: "hsl(var(--background))",
    display: "flex",
    gap: "0.5rem"
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "1.5rem"
  },
  modalContainer: {
    width: "100%",
    maxWidth: "520px",
    backgroundColor: "hsl(var(--surface))",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-xl)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    maxHeight: "90vh"
  },
  modalHeader: {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid hsl(var(--surface-border))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  modalTitle: {
    fontSize: "1.125rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))"
  },
  modalCloseBtn: {
    background: "none",
    border: "none",
    color: "hsl(var(--text-secondary))",
    cursor: "pointer"
  },
  modalForm: {
    padding: "1.5rem",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  formRow: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap"
  },
  inputContainer: {
    position: "relative",
    width: "100%"
  },
  inputIcon: {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "hsl(var(--text-secondary))"
  },
  newPatientBlock: {
    padding: "1rem",
    backgroundColor: "hsla(239, 84%, 67%, 0.05)",
    border: "1px dashed hsl(var(--indigo-500))",
    borderRadius: "var(--radius-md)",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  },
  newPatientHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8125rem",
    fontWeight: "600",
    color: "hsl(var(--indigo-500))"
  },
  patientFoundAlert: {
    padding: "0.75rem 1rem",
    backgroundColor: "hsl(var(--emerald-500) / 0.1)",
    border: "1px solid hsl(var(--emerald-500) / 0.2)",
    color: "hsl(var(--emerald-500))",
    borderRadius: "var(--radius-md)",
    fontSize: "0.8125rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  slotPlaceholder: {
    fontSize: "0.8125rem",
    color: "hsl(var(--text-secondary))",
    textAlign: "center",
    padding: "1.5rem",
    border: "1px dashed hsl(var(--slate-200))",
    borderRadius: "var(--radius-md)"
  },
  slotLoader: {
    fontSize: "0.8125rem",
    color: "hsl(var(--teal-600))",
    textAlign: "center",
    padding: "1.5rem"
  },
  slotsPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    maxHeight: "220px",
    overflowY: "auto",
    padding: "0.5rem",
    border: "1px solid hsl(var(--slate-200))",
    borderRadius: "var(--radius-md)"
  },
  slotGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem"
  },
  slotGroupTitle: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase"
  },
  slotsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.375rem"
  },
  slotBtn: {
    padding: "0.375rem 0.625rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    borderRadius: "var(--radius-sm)",
    border: "1px solid hsl(var(--slate-200))",
    backgroundColor: "hsl(var(--surface))",
    color: "hsl(var(--text-primary))",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  slotBtnActive: {
    backgroundColor: "hsl(var(--teal-500))",
    borderColor: "hsl(var(--teal-500))",
    color: "white",
    boxShadow: "0 2px 6px rgba(13, 148, 136, 0.2)"
  },
  modalSubmitBtn: {
    width: "100%",
    padding: "0.875rem",
    fontSize: "0.95rem",
    marginTop: "0.5rem"
  }
};

// Inject side panel slide-in animation stylesheet
if (typeof window !== "undefined") {
  const injectStyle = () => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
      .animate-slide-in {
        animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
    `;
    document.head.appendChild(styleEl);
  };
  injectStyle();
}

export default AppointmentsPage;
