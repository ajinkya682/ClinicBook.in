import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  Clock, 
  Settings, 
  Check, 
  X, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Info
} from "lucide-react";
import api from "../../lib/api.js";

/**
 * Premium Doctors page with Multi-Step Provisioning Modals, Schedule Calendars, and Real-time Status toggles.
 */
const DoctorsPage = () => {
  const queryClient = useQueryClient();

  // Multi-step modal toggles
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);

  // Active Loading Toggles Map
  const [togglingDoctors, setTogglingDoctors] = useState({});

  // Calendar Modal state
  const [activeCalendarDoc, setActiveCalendarDoc] = useState(null);

  // STEP 1 Form States (Personal Info)
  const [docName, setDocName] = useState("");
  const [docPhone, setDocPhone] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [docSpec, setDocSpec] = useState("");
  const [docExp, setDocExp] = useState(0);
  const [docQuals, setDocQuals] = useState("");
  const [docFee, setDocFee] = useState(0);

  // STEP 2 Form States (Working Schedule Config)
  const defaultSchedule = {
    monday: { open: true, startTime: "09:00", endTime: "17:00", breakStart: "13:00", breakEnd: "14:00" },
    tuesday: { open: true, startTime: "09:00", endTime: "17:00", breakStart: "13:00", breakEnd: "14:00" },
    wednesday: { open: true, startTime: "09:00", endTime: "17:00", breakStart: "13:00", breakEnd: "14:00" },
    thursday: { open: true, startTime: "09:00", endTime: "17:00", breakStart: "13:00", breakEnd: "14:00" },
    friday: { open: true, startTime: "09:00", endTime: "17:00", breakStart: "13:00", breakEnd: "14:00" },
    saturday: { open: false, startTime: "09:00", endTime: "13:00", breakStart: "", breakEnd: "" },
    sunday: { open: false, startTime: "09:00", endTime: "13:00", breakStart: "", breakEnd: "" }
  };
  const [docSchedule, setDocSchedule] = useState(defaultSchedule);

  // STEP 3 Form States (Slot duration)
  const [docSlotDuration, setDocSlotDuration] = useState(20);

  // Query doctors
  const { data: doctorsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["doctors:list"],
    queryFn: async () => {
      const response = await api.get("/doctors");
      return response.data.doctors || [];
    }
  });

  const doctorsList = doctorsData || [];

  // Toggle doctor availability today handler
  const handleToggleAvailable = async (doctorId) => {
    setTogglingDoctors(prev => ({ ...prev, [doctorId]: true }));
    try {
      await api.patch(`/doctors/${doctorId}/toggle-available`);
      queryClient.invalidateQueries({ queryKey: ["doctors:list"] });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle availability today.");
    } finally {
      setTogglingDoctors(prev => ({ ...prev, [doctorId]: false }));
    }
  };

  // Handle Working schedule field changes
  const handleScheduleChange = (day, field, value) => {
    setDocSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  // Submit create doctor API
  const handleCreateDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: docName,
        phone: docPhone,
        email: docEmail,
        specialization: docSpec,
        experience: Number(docExp),
        qualifications: docQuals ? docQuals.split(",").map(q => q.trim()) : [],
        consultationFee: Number(docFee),
        workingDays: docSchedule,
        slotDuration: docSlotDuration
      };

      await api.post("/doctors", payload);
      queryClient.invalidateQueries({ queryKey: ["doctors:list"] });

      // Reset Modal forms
      setIsAddModalOpen(false);
      setModalStep(1);
      setDocName("");
      setDocPhone("");
      setDocEmail("");
      setDocSpec("");
      setDocExp(0);
      setDocQuals("");
      setDocFee(0);
      setDocSchedule(defaultSchedule);
      setDocSlotDuration(20);
    } catch (err) {
      alert(err.response?.data?.message || "Could not register doctor profile.");
    }
  };

  // Calendar Leave Date handlers
  const handleDayClick = async (dateStr, isAlreadyLeave) => {
    if (!activeCalendarDoc) return;
    try {
      if (isAlreadyLeave) {
        // Remove Leave
        await api.delete(`/doctors/${activeCalendarDoc._id}/leave`, {
          data: { date: dateStr }
        });
      } else {
        // Add Leave
        await api.post(`/doctors/${activeCalendarDoc._id}/leave`, {
          date: dateStr
        });
      }

      // Refetch list and sync activeCalendarDoc leaveDates
      const resList = await refetch();
      const updatedDoc = resList.data?.find(d => d._id === activeCalendarDoc._id);
      if (updatedDoc) {
        setActiveCalendarDoc(updatedDoc);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update leave dates.");
    }
  };

  // Calendar Generation Helper for next 4 weeks starting today
  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    for (let i = 0; i < 28; i++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split("T")[0];
      const dayName = dayNames[targetDate.getDay()];
      
      // Determine if a working day
      const dayConfig = activeCalendarDoc?.workingDays?.[dayName];
      const isWorkingDay = dayConfig?.open || false;

      // Determine if currently a leave date
      const isLeave = activeCalendarDoc?.leaveDates?.some(
        ld => new Date(ld).toISOString().split("T")[0] === dateStr
      ) || false;

      days.push({
        date: targetDate,
        dateStr,
        dayName,
        isWorkingDay,
        isLeave
      });
    }
    return days;
  };

  return (
    <div style={styles.container}>
      {/* Page header */}
      <section style={styles.headerRow}>
        <h1 style={styles.pageTitle}>Doctors Management</h1>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} />
          <span>Add New Doctor</span>
        </button>
      </section>

      {/* Main Grid View */}
      {isLoading ? (
        <div style={styles.loaderArea}>
          <div style={styles.spinner}></div>
          <span>Loading doctors roster...</span>
        </div>
      ) : isError ? (
        <div style={styles.errorArea} className="card">
          <AlertCircle size={28} style={{ color: "hsl(var(--rose-500))" }} />
          <span>Could not retrieve active roster. Check database status.</span>
        </div>
      ) : doctorsList.length === 0 ? (
        <div style={styles.emptyArea} className="card">
          <Info size={28} style={{ color: "hsl(var(--slate-400))" }} />
          <span>No active doctors registered for your clinic.</span>
        </div>
      ) : (
        <section style={styles.gridContainer}>
          {doctorsList.map((doc) => (
            <div key={doc._id} style={styles.docCard} className="card">
              {/* Photo Initials Profile */}
              <div style={styles.docCardHeader}>
                {doc.profilePhoto?.url ? (
                  <img src={doc.profilePhoto.url} alt={doc.name} style={styles.profileImg} />
                ) : (
                  <div style={styles.initialsAvatar}>
                    {doc.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                )}
                <div style={styles.headerInfo}>
                  <h3 style={styles.docName}>Dr. {doc.name}</h3>
                  <span style={styles.docSpec}>{doc.specialization}</span>
                </div>
              </div>

              {/* Body Details */}
              <div style={styles.docCardBody}>
                <div style={styles.detailRow}>
                  <Briefcase size={14} />
                  <span>Experience: <strong>{doc.experience} Years</strong></span>
                </div>
                <div style={styles.detailRow}>
                  <DollarSign size={14} style={{ color: "hsl(var(--emerald-500))" }} />
                  <span>Consultation Fee: <strong>₹{doc.consultationFee}</strong></span>
                </div>
                <div style={styles.detailRow}>
                  <Clock size={14} style={{ color: "hsl(var(--indigo-500))" }} />
                  <span>Slot Duration: <strong>{doc.slotDuration || 20} mins</strong></span>
                </div>
              </div>

              {/* Availability Today Switch */}
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Available Today</span>
                {togglingDoctors[doc._id] ? (
                  <div style={styles.miniSpinner}></div>
                ) : (
                  <button 
                    style={styles.toggleTrigger}
                    onClick={() => handleToggleAvailable(doc._id)}
                  >
                    {doc.isAvailableToday ? (
                      <ToggleRight size={28} style={{ color: "hsl(var(--teal-500))" }} />
                    ) : (
                      <ToggleLeft size={28} style={{ color: "hsl(var(--slate-300))" }} />
                    )}
                  </button>
                )}
              </div>

              {/* Footer buttons actions */}
              <div style={styles.docCardFooter}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setActiveCalendarDoc(doc)}
                  style={{ flex: 1, padding: "0.4rem" }}
                >
                  <Calendar size={14} />
                  <span>Schedule</span>
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => alert("ClinicBook premium editing tools are locked in demo modes.")}
                  style={{ flex: 1, padding: "0.4rem" }}
                >
                  Edit profile
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 1. MULTI-STEP PROVISIONING MODAL */}
      {isAddModalOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard} className="card animate-fade-in">
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Register Doctor Profile</h2>
                <span style={styles.modalSubTitle}>Step {modalStep} of 3</span>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDoctorSubmit} style={styles.modalForm}>
              {/* STEP 1: Personal Info */}
              {modalStep === 1 && (
                <div style={styles.stepBlock} className="animate-fade-in">
                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Doctor Name</label>
                      <input 
                        type="text" 
                        required 
                        className="form-input" 
                        placeholder="Dr. Ajinkya" 
                        value={docName} 
                        onChange={(e) => setDocName(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Contact Phone</label>
                      <input 
                        type="tel" 
                        required 
                        className="form-input" 
                        placeholder="9876543210" 
                        value={docPhone} 
                        onChange={(e) => setDocPhone(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        className="form-input" 
                        placeholder="ajinkya@clinicbook.in" 
                        value={docEmail} 
                        onChange={(e) => setDocEmail(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Specialization</label>
                      <input 
                        type="text" 
                        required 
                        className="form-input" 
                        placeholder="Cardiologist" 
                        value={docSpec} 
                        onChange={(e) => setDocSpec(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Experience (Years)</label>
                      <input 
                        type="number" 
                        required 
                        className="form-input" 
                        placeholder="10" 
                        value={docExp} 
                        onChange={(e) => setDocExp(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Consultation Fee (INR)</label>
                      <input 
                        type="number" 
                        required 
                        className="form-input" 
                        placeholder="500" 
                        value={docFee} 
                        onChange={(e) => setDocFee(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Qualifications (Comma separated)</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="MBBS, MD, FACC" 
                      value={docQuals} 
                      onChange={(e) => setDocQuals(e.target.value)} 
                    />
                  </div>

                  <div style={styles.stepFooter}>
                    <button type="button" className="btn btn-primary" onClick={() => setModalStep(2)} style={{ marginLeft: "auto" }}>
                      <span>Next: Work Schedule</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Work Schedule Config Table */}
              {modalStep === 2 && (
                <div style={styles.stepBlock} className="animate-fade-in">
                  <div style={styles.scheduleTableWrapper}>
                    <table style={styles.scheduleTable}>
                      <thead>
                        <tr style={styles.schThRow}>
                          <th style={styles.schTh}>Day</th>
                          <th style={styles.schTh}>Open?</th>
                          <th style={styles.schTh}>Shift Hours</th>
                          <th style={styles.schTh}>Break Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(docSchedule).map((day) => {
                          const conf = docSchedule[day];
                          return (
                            <tr key={day} style={styles.schTr}>
                              <td style={{ ...styles.schTd, textTransform: "capitalize", fontWeight: "600" }}>{day}</td>
                              <td style={styles.schTd}>
                                <input 
                                  type="checkbox" 
                                  checked={conf.open} 
                                  onChange={(e) => handleScheduleChange(day, "open", e.target.checked)} 
                                />
                              </td>
                              <td style={styles.schTd}>
                                {conf.open ? (
                                  <div style={styles.timeInputsFlex}>
                                    <input 
                                      type="time" 
                                      className="form-input" 
                                      value={conf.startTime} 
                                      onChange={(e) => handleScheduleChange(day, "startTime", e.target.value)}
                                      style={styles.timeInput}
                                    />
                                    <span>to</span>
                                    <input 
                                      type="time" 
                                      className="form-input" 
                                      value={conf.endTime} 
                                      onChange={(e) => handleScheduleChange(day, "endTime", e.target.value)}
                                      style={styles.timeInput}
                                    />
                                  </div>
                                ) : (
                                  <span style={styles.closedText}>Closed Roster</span>
                                )}
                              </td>
                              <td style={styles.schTd}>
                                {conf.open ? (
                                  <div style={styles.timeInputsFlex}>
                                    <input 
                                      type="time" 
                                      className="form-input" 
                                      placeholder="Break Start"
                                      value={conf.breakStart} 
                                      onChange={(e) => handleScheduleChange(day, "breakStart", e.target.value)}
                                      style={styles.timeInput}
                                    />
                                    <span>to</span>
                                    <input 
                                      type="time" 
                                      className="form-input" 
                                      placeholder="Break End"
                                      value={conf.breakEnd} 
                                      onChange={(e) => handleScheduleChange(day, "breakEnd", e.target.value)}
                                      style={styles.timeInput}
                                    />
                                  </div>
                                ) : (
                                  <span>-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={styles.stepFooter}>
                    <button type="button" className="btn btn-secondary" onClick={() => setModalStep(1)}>
                      Back
                    </button>
                    <button type="button" className="btn btn-primary" onClick={() => setModalStep(3)}>
                      <span>Next: Duration</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Slot Duration choice */}
              {modalStep === 3 && (
                <div style={styles.stepBlock} className="animate-fade-in">
                  <div style={styles.durationPrompt}>
                    <h3 style={styles.durationTitle}>Consultation Slot Duration</h3>
                    <p style={styles.durationDesc}>Specify the duration in minutes for patient appointment sessions.</p>
                    
                    <div style={styles.durationGrid}>
                      {[10, 15, 20, 30].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDocSlotDuration(mins)}
                          style={{
                            ...styles.durationBtn,
                            ...(docSlotDuration === mins ? styles.durationBtnActive : {})
                          }}
                        >
                          <Clock size={16} />
                          <span>{mins} Minutes</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={styles.stepFooter}>
                    <button type="button" className="btn btn-secondary" onClick={() => setModalStep(2)}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ padding: "0.875rem 2rem" }}>
                      <span>Provision Doctor Profile</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* 2. CALENDAR LEAVE DATES MODAL */}
      {activeCalendarDoc && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: "560px" }} className="card animate-fade-in">
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Dr. {activeCalendarDoc.name}'s Schedule</h2>
                <span style={styles.modalSubTitle}>Leave Management (4-Week Grid)</span>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setActiveCalendarDoc(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.calendarModalBody}>
              <div style={styles.legendFlex}>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendBox, backgroundColor: "hsl(var(--teal-500))" }}></div>
                  <span>Working Day</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendBox, backgroundColor: "hsl(var(--rose-500))" }}></div>
                  <span>On Leave / Out</span>
                </div>
                <div style={styles.legendItem}>
                  <div style={{ ...styles.legendBox, backgroundColor: "hsl(var(--slate-200))" }}></div>
                  <span>Default Off</span>
                </div>
              </div>

              <div style={styles.calendarGrid}>
                {getCalendarDays().map((item) => {
                  let dayBg = "hsl(var(--slate-100))";
                  let dayText = "hsl(var(--text-secondary))";
                  let borderStyle = "1px solid hsl(var(--surface-border))";

                  if (item.isLeave) {
                    dayBg = "hsl(var(--rose-500))";
                    dayText = "white";
                  } else if (item.isWorkingDay) {
                    dayBg = "hsl(var(--teal-500))";
                    dayText = "white";
                  }

                  return (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => handleDayClick(item.dateStr, item.isLeave)}
                      style={{
                        ...styles.calendarDayBtn,
                        backgroundColor: dayBg,
                        color: dayText,
                        border: borderStyle
                      }}
                      title={`${item.date.toDateString()}${item.isLeave ? " (Leave)" : ""}`}
                    >
                      <span style={styles.dayNum}>{item.date.getDate()}</span>
                      <span style={styles.dayMonth}>{item.date.toLocaleDateString("en-IN", { month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
              
              <div style={styles.calendarTip}>
                <Info size={14} />
                <span>Click on any date to toggle a leave absence for Dr. {activeCalendarDoc.name}.</span>
              </div>
            </div>

            <div style={styles.calendarModalFooter}>
              <button className="btn btn-primary" onClick={() => setActiveCalendarDoc(null)} style={{ width: "100%", justifyContent: "center" }}>
                <span>Close Schedule View</span>
              </button>
            </div>
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
  headerRow: {
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
  loaderArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "5rem 2rem",
    gap: "1rem"
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "3px solid hsl(var(--teal-100))",
    borderTopColor: "hsl(var(--teal-500))",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  miniSpinner: {
    width: "18px",
    height: "18px",
    border: "2px solid hsl(var(--teal-100))",
    borderTopColor: "hsl(var(--teal-500))",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  errorArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    gap: "0.75rem",
    color: "hsl(var(--rose-500))"
  },
  emptyArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 2rem",
    gap: "0.75rem",
    color: "hsl(var(--text-secondary))"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem"
  },
  docCard: {
    backgroundColor: "hsl(var(--surface))",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  docCardHeader: {
    display: "flex",
    gap: "1rem",
    alignItems: "center"
  },
  profileImg: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid hsl(var(--teal-500))"
  },
  initialsAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "hsl(var(--teal-500))",
    color: "white",
    fontSize: "1rem",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  headerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  docName: {
    fontSize: "0.95rem",
    fontWeight: "750",
    color: "hsl(var(--text-primary))"
  },
  docSpec: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--teal-700))",
    textTransform: "uppercase",
    letterSpacing: "0.025em"
  },
  docCardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  detailRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8125rem",
    color: "hsl(var(--text-secondary))"
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid hsl(var(--surface-border))",
    paddingTop: "0.75rem"
  },
  toggleLabel: {
    fontSize: "0.8125rem",
    fontWeight: "600",
    color: "hsl(var(--text-primary))"
  },
  toggleTrigger: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center"
  },
  docCardFooter: {
    display: "flex",
    gap: "0.5rem",
    borderTop: "1px solid hsl(var(--surface-border))",
    paddingTop: "0.75rem"
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
  modalCard: {
    width: "100%",
    maxWidth: "600px",
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
    fontWeight: "750",
    color: "hsl(var(--text-primary))"
  },
  modalSubTitle: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--teal-600))",
    textTransform: "uppercase"
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
    flexDirection: "column"
  },
  stepBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  formRow: {
    display: "flex",
    gap: "1rem"
  },
  stepFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid hsl(var(--surface-border))",
    paddingTop: "1rem",
    marginTop: "0.5rem"
  },
  scheduleTableWrapper: {
    maxHeight: "350px",
    overflowY: "auto",
    border: "1px solid hsl(var(--surface-border))",
    borderRadius: "var(--radius-md)"
  },
  scheduleTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  schThRow: {
    backgroundColor: "hsl(var(--background))",
    borderBottom: "1px solid hsl(var(--surface-border))"
  },
  schTh: {
    padding: "0.75rem 1rem",
    fontSize: "0.75rem",
    fontWeight: "750",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase"
  },
  schTr: {
    borderBottom: "1px solid hsl(var(--surface-border))"
  },
  schTd: {
    padding: "0.75rem 1rem",
    fontSize: "0.8125rem",
    color: "hsl(var(--text-secondary))",
    verticalAlign: "middle"
  },
  timeInputsFlex: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem"
  },
  timeInput: {
    padding: "0.375rem 0.5rem",
    fontSize: "0.8125rem",
    width: "100px",
    marginBottom: 0
  },
  closedText: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--rose-500))",
    textTransform: "uppercase"
  },
  durationPrompt: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "2rem 1rem",
    gap: "0.75rem"
  },
  durationTitle: {
    fontSize: "1.25rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))"
  },
  durationDesc: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    marginBottom: "1rem"
  },
  durationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "0.75rem",
    width: "100%",
    maxWidth: "360px"
  },
  durationBtn: {
    padding: "0.875rem 1.25rem",
    borderRadius: "var(--radius-md)",
    border: "1px solid hsl(var(--slate-200))",
    backgroundColor: "hsl(var(--background))",
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "hsl(var(--text-primary))",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    transition: "all 0.15s ease"
  },
  durationBtnActive: {
    backgroundColor: "hsl(var(--teal-500))",
    borderColor: "hsl(var(--teal-500))",
    color: "white",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)"
  },
  calendarModalBody: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    maxHeight: "75vh",
    overflowY: "auto"
  },
  legendFlex: {
    display: "flex",
    justifyContent: "center",
    gap: "1.25rem",
    flexWrap: "wrap"
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--text-secondary))"
  },
  legendBox: {
    width: "14px",
    height: "14px",
    borderRadius: "3px"
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "0.5rem",
    marginTop: "0.5rem"
  },
  calendarDayBtn: {
    padding: "0.625rem 0.375rem",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.25rem",
    transition: "transform 0.15s ease",
    outline: "none",
    ":hover": {
      transform: "scale(1.05)"
    }
  },
  dayNum: {
    fontSize: "0.95rem",
    fontWeight: "750"
  },
  dayMonth: {
    fontSize: "0.625rem",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  calendarTip: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--text-secondary))",
    backgroundColor: "hsl(var(--background))",
    padding: "0.75rem 1rem",
    borderRadius: "var(--radius-md)"
  },
  calendarModalFooter: {
    padding: "1.25rem 1.5rem",
    borderTop: "1px solid hsl(var(--surface-border))",
    backgroundColor: "hsl(var(--background))"
  }
};

// Inject animations inside DOM context safely
if (typeof window !== "undefined") {
  const injectStyle = () => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .schTr:hover {
        background-color: hsl(var(--background)) !important;
      }
    `;
    document.head.appendChild(styleEl);
  };
  injectStyle();
}

export default DoctorsPage;
