import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  Share2, 
  AlertCircle,
  Activity,
  Heart,
  FileText,
  Mail,
  Info,
  CalendarDays,
  Smartphone,
  ChevronRight
} from "lucide-react";
import api from "../../lib/api.js";

// Helper to convert hex to RGB for alpha channels
const hexToRgb = (hex) => {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
};

// Helper to render star rating stars
const renderStars = (rating) => {
  return (
    <div style={{ display: "flex", gap: "2px", color: "#f59e0b" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ fontSize: "1.1rem" }}>
          {i < Math.round(rating) ? "★" : "☆"}
        </span>
      ))}
    </div>
  );
};

// Helper to format patient name to first name and last initial
const formatName = (patientName) => {
  if (!patientName) return "Anonymous Patient";
  const parts = patientName.trim().split(" ");
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

const ClinicBookingPage = () => {
  const { subdomain } = useParams();
  const bookingSectionRef = useRef(null);

  // States
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  
  // Booking Form state
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientNotes, setPatientNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // 1. Fetch Clinic Public Context & Profile Info
  const { 
    data: clinicData, 
    isLoading: isClinicLoading, 
    isError: isClinicError 
  } = useQuery({
    queryKey: ["publicClinic", subdomain],
    queryFn: async () => {
      const response = await api.get("/public/clinic", {
        params: { subdomain }
      });
      return response.data?.clinic;
    },
    enabled: !!subdomain
  });

  // 2. Fetch Public Doctors List
  const { 
    data: doctorsList, 
    isLoading: isDoctorsLoading 
  } = useQuery({
    queryKey: ["publicDoctors", subdomain],
    queryFn: async () => {
      const response = await api.get("/public/doctors", {
        params: { subdomain }
      });
      return response.data?.doctors || [];
    },
    enabled: !!subdomain
  });

  // 3. Fetch Availability Slots for selected doctor and date
  const { 
    data: availabilitySlots, 
    isLoading: isSlotsLoading,
    refetch: refetchSlots
  } = useQuery({
    queryKey: ["publicAvailability", selectedDoctor?._id, selectedDate],
    queryFn: async () => {
      if (!selectedDoctor || !selectedDate) return null;
      const response = await api.get("/public/availability", {
        params: {
          subdomain,
          doctorId: selectedDoctor._id,
          date: selectedDate
        }
      });
      return response.data?.availableSlots || [];
    },
    enabled: !!selectedDoctor && !!selectedDate
  });

  // Re-fetch slots when doctor or date changes
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      refetchSlots();
    }
  }, [selectedDoctor, selectedDate]);

  // 4. Fetch Public Reviews & Stats
  const { 
    data: reviewsData
  } = useQuery({
    queryKey: ["publicReviews", subdomain],
    queryFn: async () => {
      const response = await api.get("/public/reviews", {
        params: { subdomain }
      });
      return response.data;
    },
    enabled: !!subdomain
  });

  // Dynamic next 7 days compiler
  const [weekDays, setWeekDays] = useState([]);

  useEffect(() => {
    if (!clinicData) return;

    const days = [];
    const today = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + i);
      const targetDateString = targetDate.toISOString().split("T")[0];
      const dayOfWeek = dayNames[targetDate.getDay()];
      
      // Determine if clinic is operating on this day of week
      const clinicDayConfig = clinicData.openingHours?.[dayOfWeek];
      const isWorking = clinicDayConfig ? clinicDayConfig.open : false;

      days.push({
        dateString: targetDateString,
        dayName: i === 0 ? "Today" : targetDate.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: targetDate.getDate(),
        isWorking,
        label: targetDate.toLocaleDateString("en-US", { day: "numeric", month: "short" })
      });
    }

    setWeekDays(days);
    // Default to the first active working day
    const firstWorkingDay = days.find(d => d.isWorking);
    if (firstWorkingDay) {
      setSelectedDate(firstWorkingDay.dateString);
    }
  }, [clinicData]);

  // Handle doctor select and auto scroll to booking layout
  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot("");
    
    setTimeout(() => {
      bookingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  // Submit booking request
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const response = await api.post("/public/book", {
        subdomain,
        doctorId: selectedDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        name: patientName,
        phone: patientPhone,
        email: patientEmail,
        notes: patientNotes
      });

      if (response.data?.success) {
        setBookingSuccess(response.data.appointment);
      }
    } catch (err) {
      alert(err.response?.data?.message || "This slot was just booked or conflict detected. Please select another slot.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper groupings for slots
  const categorizeSlots = (slots) => {
    const morning = [];
    const afternoon = [];
    const evening = [];

    slots.forEach(slot => {
      const hour = parseInt(slot.split(":")[0]);
      const suffix = slot.toLowerCase().includes("pm");

      if (suffix && hour !== 12) {
        // PM hour
        if (hour < 4) afternoon.push(slot);
        else evening.push(slot);
      } else {
        // AM hour or 12 PM
        if (hour === 12 || (hour >= 12 && suffix)) afternoon.push(slot);
        else if (hour < 12) morning.push(slot);
      }
    });

    // Fallback simple split if no PM indicator
    if (morning.length === 0 && afternoon.length === 0 && evening.length === 0) {
      slots.forEach((slot, idx) => {
        if (idx < slots.length / 3) morning.push(slot);
        else if (idx < (slots.length * 2) / 3) afternoon.push(slot);
        else evening.push(slot);
      });
    }

    return { morning, afternoon, evening };
  };

  if (isClinicLoading) {
    return (
      <div style={styles.loadingScreen}>
        <Activity size={32} className="animate-spin" style={{ color: "hsl(var(--teal-600))" }} />
        <span style={{ marginTop: "1rem", fontWeight: "600" }}>Resolving clinic configurations...</span>
      </div>
    );
  }

  if (isClinicError || !clinicData) {
    return (
      <div style={styles.errorScreen}>
        <AlertCircle size={48} style={{ color: "hsl(var(--destructive))", marginBottom: "1rem" }} />
        <h2>Clinic Link Expired or Not Found</h2>
        <p>This booking link does not exist. Please check the subdomain and try again.</p>
      </div>
    );
  }

  // Active theme colors
  const primaryColor = clinicData.primaryColor || "0EA5E9";
  const secondaryColor = clinicData.secondaryColor || "6366F1";
  const logoUrl = clinicData.logo?.url || "";

  // Dynamic slots breakdown
  const slotsObj = availabilitySlots ? categorizeSlots(availabilitySlots) : { morning: [], afternoon: [], evening: [] };
  const totalSlotsCount = (slotsObj.morning?.length || 0) + (slotsObj.afternoon?.length || 0) + (slotsObj.evening?.length || 0);

  // Success Screen Share URL & Share Text
  const shareText = `Hey! I just booked an appointment at ${clinicData.name} with ${selectedDoctor?.name} on ${selectedDate} at ${selectedSlot}. Booking ID: ${bookingSuccess?.bookingId}.`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  if (bookingSuccess) {
    return (
      <div style={styles.successScreen} className="animate-fade-in">
        {/* Dynamic Stylesheet Override Injector */}
        <style>{`
          :root {
            --clinic-primary: #${primaryColor};
            --clinic-primary-rgb: ${hexToRgb(primaryColor)};
            --clinic-secondary: #${secondaryColor};
          }
          .success-accent-btn {
            background-color: var(--clinic-primary);
            color: white;
            transition: all 0.2s ease;
          }
          .success-accent-btn:hover {
            background-color: var(--clinic-secondary);
            transform: translateY(-2px);
          }
        `}</style>

        <div className="card animate-scale-in" style={styles.successCard}>
          <div style={styles.successBadge}>
            <CheckCircle2 size={48} style={{ color: "hsl(var(--emerald-500))" }} />
          </div>
          
          <h1 style={styles.successHeading}>Appointment Confirmed!</h1>
          <p style={styles.successSub}>Your consultation schedule is locked. Secure your clinic ticket slip below.</p>

          <div style={styles.ticketSlip}>
            <div style={styles.ticketSection}>
              <span style={styles.ticketLabel}>BOOKING QR CODE</span>
              <div style={styles.qrContainer}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${bookingSuccess.bookingId}`} 
                  alt="Check-in QR Code" 
                  style={styles.qrImage}
                />
                <span style={styles.ticketValueMonospace}>{bookingSuccess.bookingId}</span>
              </div>
            </div>

            <div style={styles.ticketDivider}></div>

            <div style={styles.ticketSectionRight}>
              <div style={styles.ticketRow}>
                <span style={styles.ticketLabel}>CLINIC</span>
                <span style={styles.ticketValueBold}>{clinicData.name}</span>
              </div>

              <div style={styles.ticketRow}>
                <span style={styles.ticketLabel}>DOCTOR IN-CHARGE</span>
                <span style={styles.ticketValue}>{selectedDoctor?.name}</span>
              </div>

              <div style={styles.ticketRow}>
                <span style={styles.ticketLabel}>DATE & TIME SLOT</span>
                <span style={styles.ticketValueBold}>
                  {new Date(bookingSuccess.appointmentDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • {bookingSuccess.timeSlot}
                </span>
              </div>

              <div style={styles.ticketRow}>
                <span style={styles.ticketLabel}>PATIENT FULL NAME</span>
                <span style={styles.ticketValue}>{patientName}</span>
              </div>

              <div style={styles.ticketRow}>
                <span style={styles.ticketLabel}>CONSULTATION FEE</span>
                <span style={{ ...styles.ticketValueBold, color: "hsl(var(--emerald-600))" }}>₹{selectedDoctor?.consultationFee || 500}</span>
              </div>
            </div>
          </div>

          <div style={styles.successActions}>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary" 
              style={{ ...styles.successActionBtn, borderColor: "hsl(var(--emerald-300))", color: "hsl(var(--emerald-700))", backgroundColor: "hsl(var(--emerald-50))" }}
            >
              <Share2 size={16} />
              <span>Share Slip on WhatsApp</span>
            </a>

            <button 
              className="btn success-accent-btn" 
              onClick={() => window.location.reload()}
              style={styles.successActionBtn}
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Dynamic Theme Styles Override */}
      <style>{`
        :root {
          --clinic-primary: #${primaryColor};
          --clinic-primary-rgb: ${hexToRgb(primaryColor)};
          --clinic-secondary: #${secondaryColor};
        }
        .clinic-accent-bg {
          background-color: var(--clinic-primary) !important;
        }
        .clinic-accent-color {
          color: var(--clinic-primary) !important;
        }
        .clinic-accent-border {
          border-color: var(--clinic-primary) !important;
        }
        .clinic-accent-btn {
          background-color: var(--clinic-primary);
          color: white;
          border: none;
          transition: all 0.2s ease;
        }
        .clinic-accent-btn:hover {
          background-color: var(--clinic-secondary);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(var(--clinic-primary-rgb), 0.3);
        }
        .clinic-accent-btn:disabled {
          background-color: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .clinic-doctor-card:hover {
          border-color: var(--clinic-primary) !important;
          box-shadow: 0 10px 25px rgba(var(--clinic-primary-rgb), 0.08) !important;
        }
        .clinic-slot-btn {
          border: 1.5px solid #e2e8f0;
          background-color: white;
          color: #334155;
          transition: all 0.15s ease;
        }
        .clinic-slot-btn:hover:not(:disabled) {
          border-color: var(--clinic-primary);
          color: var(--clinic-primary);
          background-color: rgba(var(--clinic-primary-rgb), 0.04);
        }
        .clinic-slot-btn-selected {
          background-color: var(--clinic-primary) !important;
          border-color: var(--clinic-primary) !important;
          color: white !important;
          box-shadow: 0 4px 10px rgba(var(--clinic-primary-rgb), 0.2);
        }
        .clinic-date-btn {
          border: 1px solid #e2e8f0;
          background-color: white;
          color: #64748b;
          transition: all 0.15s ease;
        }
        .clinic-date-btn:hover:not(:disabled) {
          border-color: var(--clinic-primary);
          color: var(--clinic-primary);
        }
        .clinic-date-btn-selected {
          border-color: var(--clinic-primary) !important;
          background-color: rgba(var(--clinic-primary-rgb), 0.08) !important;
          color: var(--clinic-primary) !important;
          box-shadow: inset 0 0 0 1px var(--clinic-primary);
        }
      `}</style>

      {/* 1. Clinic Cover & Logo Header */}
      <header style={styles.clinicHeader}>
        <div style={styles.coverGradient}></div>
        
        <div style={styles.headerContent}>
          {logoUrl ? (
            <div style={styles.logoFrame}>
              <img src={logoUrl} alt="Clinic Logo" style={styles.logoImg} />
            </div>
          ) : (
            <div style={{ ...styles.logoFrame, backgroundColor: `rgba(${hexToRgb(primaryColor)}, 0.1)` }}>
              <span style={{ fontSize: "2rem", color: `#${primaryColor}` }}>🏥</span>
            </div>
          )}

          <h1 style={styles.clinicTitle}>{clinicData.name}</h1>
          
          <div style={styles.clinicMetaRow}>
            <span style={styles.metaItem}>
              <MapPin size={14} />
              <span>{clinicData.address}, {clinicData.city}</span>
            </span>

            <span style={styles.metaItem}>
              <Phone size={14} />
              <span>{clinicData.phone || "No Public Line"}</span>
            </span>
          </div>

          <div style={styles.statusBadgeRow}>
            <span style={styles.statusBadgeActive}>
              <Activity size={14} />
              <span>Verified ClinicBook Domain</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <main style={styles.mainLayout}>
        
        {/* SECTION A: SELECT DOCTOR */}
        <section style={styles.sectionBlock}>
          <h2 style={styles.sectionHeading}>1. Choose Consulting Specialist</h2>
          <span style={styles.sectionSubHeading}>Select a verified clinical practitioner to view slot availability calendar</span>
          
          <div style={styles.doctorsGrid}>
            {doctorsList?.map((doctor) => {
              const isSelected = selectedDoctor?._id === doctor._id;
              return (
                <div 
                  key={doctor._id}
                  className="card clinic-doctor-card"
                  onClick={() => handleDoctorSelect(doctor)}
                  style={{
                    ...styles.doctorCard,
                    ...(isSelected ? { borderColor: `#${primaryColor}`, borderWidth: "2px", transform: "translateY(-4px)" } : {})
                  }}
                >
                  <div style={styles.docAvatarSection}>
                    <div style={styles.docAvatarFrame}>
                      {doctor.profilePhoto?.url ? (
                        <img src={doctor.profilePhoto.url} alt={doctor.name} style={styles.docAvatarImg} />
                      ) : (
                        <span style={{ fontSize: "1.5rem" }}>👨‍⚕️</span>
                      )}
                    </div>
                    {isSelected && (
                      <div style={{ ...styles.checkBadge, backgroundColor: `#${primaryColor}` }}>
                        <CheckCircle2 size={12} color="white" />
                      </div>
                    )}
                  </div>

                  <div style={styles.docInfoSection}>
                    <h3 style={styles.docName}>{doctor.name}</h3>
                    <span style={{ ...styles.docSpecialization, color: `#${primaryColor}` }}>{doctor.specialization}</span>
                    
                    <div style={styles.docStatsRow}>
                      <span style={styles.docStatItem}>⭐ {doctor.experience} Yrs Exp</span>
                      <span style={styles.docStatItem}>💰 ₹{doctor.consultationFee}</span>
                    </div>

                    <button 
                      className="btn" 
                      style={{ 
                        ...styles.selectDoctorBtn,
                        backgroundColor: isSelected ? `#${primaryColor}` : "transparent",
                        borderColor: `#${primaryColor}`,
                        color: isSelected ? "white" : `#${primaryColor}`
                      }}
                    >
                      {isSelected ? "Specialist Selected" : "Book Consultant"}
                    </button>
                  </div>
                </div>
              );
            })}

            {(!doctorsList || doctorsList.length === 0) && (
              <div style={styles.emptyState}>No practitioners currently available for online bookings.</div>
            )}
          </div>
        </section>

        {/* SECTION B: DATE & SLOT SELECTION (TWO COLUMN DESKTOP) */}
        {selectedDoctor && (
          <section ref={bookingSectionRef} style={styles.sectionBlock} className="animate-fade-in">
            <h2 style={styles.sectionHeading}>2. Pick Booking Slot</h2>
            <span style={styles.sectionSubHeading}>Select an available date range followed by a morning, afternoon, or evening session time.</span>

            <div style={styles.bookingContainerSplit}>
              {/* Column 1: Date Picker */}
              <div className="card" style={styles.datePickerCard}>
                <h3 style={styles.pickerSubHeading}>
                  <CalendarDays size={18} style={{ color: `#${primaryColor}` }} />
                  <span>Choose Date</span>
                </h3>

                <div style={styles.weekListColumn}>
                  {weekDays.map((day) => (
                    <button
                      key={day.dateString}
                      type="button"
                      disabled={!day.isWorking}
                      onClick={() => {
                        setSelectedDate(day.dateString);
                        setSelectedSlot("");
                      }}
                      className={`clinic-date-btn ${selectedDate === day.dateString ? "clinic-date-btn-selected" : ""}`}
                      style={{
                        ...styles.dateListItem,
                        ...(!day.isWorking ? styles.dateListItemDisabled : {})
                      }}
                    >
                      <div style={styles.dateTextLeft}>
                        <span style={styles.dateDayName}>{day.dayName}</span>
                        <span style={styles.dateDayFull}>{day.label}</span>
                      </div>
                      <div style={styles.dateActionRight}>
                        {day.isWorking ? (
                          <ChevronRight size={16} />
                        ) : (
                          <span style={styles.closedPill}>Closed</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 2: Slots List */}
              <div className="card" style={styles.slotsCard}>
                <h3 style={styles.pickerSubHeading}>
                  <Clock size={18} style={{ color: `#${primaryColor}` }} />
                  <span>Available Consultation Times ({totalSlotsCount} Slots)</span>
                </h3>

                {isSlotsLoading ? (
                  <div style={styles.loadingSlots}>
                    <Activity size={24} className="animate-spin" style={{ color: `#${primaryColor}` }} />
                    <span style={{ marginTop: "0.5rem", fontSize: "0.8125rem" }}>Compiling specialist slots...</span>
                  </div>
                ) : totalSlotsCount > 0 ? (
                  <div style={styles.slotsSessionList}>
                    
                    {/* Morning Session */}
                    {slotsObj.morning?.length > 0 && (
                      <div style={styles.slotsSessionBlock}>
                        <h4 style={styles.sessionTitle}>🌅 Morning Consults</h4>
                        <div style={styles.slotsGridBtnWrapper}>
                          {slotsObj.morning.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`clinic-slot-btn ${selectedSlot === slot ? "clinic-slot-btn-selected" : ""}`}
                              style={styles.slotBtnItem}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Session */}
                    {slotsObj.afternoon?.length > 0 && (
                      <div style={styles.slotsSessionBlock}>
                        <h4 style={styles.sessionTitle}>☀️ Afternoon Consults</h4>
                        <div style={styles.slotsGridBtnWrapper}>
                          {slotsObj.afternoon.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`clinic-slot-btn ${selectedSlot === slot ? "clinic-slot-btn-selected" : ""}`}
                              style={styles.slotBtnItem}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evening Session */}
                    {slotsObj.evening?.length > 0 && (
                      <div style={styles.slotsSessionBlock}>
                        <h4 style={styles.sessionTitle}>🌙 Evening Consults</h4>
                        <div style={styles.slotsGridBtnWrapper}>
                          {slotsObj.evening.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`clinic-slot-btn ${selectedSlot === slot ? "clinic-slot-btn-selected" : ""}`}
                              style={styles.slotBtnItem}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div style={styles.emptySlotsBlock}>
                    <AlertCircle size={28} style={{ color: "hsl(var(--text-secondary))", marginBottom: "0.5rem" }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "hsl(var(--text-primary))" }}>No Available Slots</span>
                    <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-secondary))", textAlign: "center" }}>
                      This specialist has no open consult slots on this date. Please select another calendar date.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* SECTION C: CONTACT DETAILS BOOKING FORM */}
        {selectedDoctor && selectedDate && selectedSlot && (
          <section style={styles.sectionBlock} className="animate-fade-in">
            <h2 style={styles.sectionHeading}>3. Provide Contact Information</h2>
            <span style={styles.sectionSubHeading}>Complete your booking secure ticket slip. All details are kept 100% confidential.</span>

            <form onSubmit={handleBookAppointment} className="card" style={styles.bookingFormCard}>
              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Patient Legal Full Name</label>
                  <div style={styles.inputIconWrapper}>
                    <User size={16} style={styles.inputIcon} />
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="E.g. Ajinkya Salve" 
                      value={patientName} 
                      onChange={(e) => setPatientName(e.target.value)} 
                      style={{ paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">WhatsApp Contact Number</label>
                  <div style={styles.inputIconWrapper}>
                    <Smartphone size={16} style={styles.inputIcon} />
                    <input 
                      type="tel" 
                      required 
                      className="form-input" 
                      placeholder="E.g. 9876543210" 
                      value={patientPhone} 
                      onChange={(e) => setPatientPhone(e.target.value)} 
                      style={{ paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Email Address (Optional)</label>
                  <div style={styles.inputIconWrapper}>
                    <Mail size={16} style={styles.inputIcon} />
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="alex@example.com" 
                      value={patientEmail} 
                      onChange={(e) => setPatientEmail(e.target.value)} 
                      style={{ paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Reason for Visit / Consult Notes (Optional)</label>
                  <div style={styles.inputIconWrapper}>
                    <FileText size={16} style={styles.inputIcon} />
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="E.g. Routine general checkup, persistent cough" 
                      value={patientNotes} 
                      onChange={(e) => setPatientNotes(e.target.value)} 
                      style={{ paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.formSummaryBlock}>
                <span style={styles.summaryText}>
                  Selected Appointment: <strong>{selectedDoctor?.name}</strong> • <strong>{selectedDate}</strong> at <strong>{selectedSlot}</strong>. Fee: <strong>₹{selectedDoctor?.consultationFee}</strong>
                </span>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn clinic-accent-btn" 
                style={styles.bookSubmitBtn}
              >
                {isSubmitting ? "Locking Booking Slip..." : "Confirm & Book Slot"}
              </button>
            </form>
          </section>
        )}

        {/* SECTION D: REVIEWS & RATINGS */}
        {reviewsData && (
          <section style={styles.sectionBlock} className="animate-fade-in">
            <h2 style={styles.sectionHeading}>Patient Reviews & Ratings</h2>
            <span style={styles.sectionSubHeading}>Read authentic feedback from patients verified by ClinicBook networks</span>

            {/* Overall stats layout */}
            <div className="card" style={styles.reviewsStatsCard}>
              <div style={styles.statsLeftCol}>
                <span style={styles.largeRatingNum}>{reviewsData.stats?.averageRating || "0.0"}</span>
                <div style={{ margin: "0.25rem 0" }}>
                  {renderStars(reviewsData.stats?.averageRating || 5)}
                </div>
                <span style={styles.statsReviewsCount}>{reviewsData.stats?.totalReviews || 0} Ratings</span>
              </div>

              <div style={styles.statsDivider}></div>

              <div style={styles.statsRightCol}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviewsData.stats?.ratingDistribution?.[rating] || 0;
                  const total = reviewsData.stats?.totalReviews || 1;
                  const pct = reviewsData.stats?.totalReviews > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={rating} style={styles.distRow}>
                      <span style={styles.distLabel}>{rating} Stars</span>
                      <div style={styles.distBarBg}>
                        <div style={{ ...styles.distBarFill, width: `${pct}%`, backgroundColor: `#${primaryColor}` }}></div>
                      </div>
                      <span style={styles.distCount}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Latest reviews list */}
            <div style={styles.reviewsList}>
              {reviewsData.reviews?.map((review) => (
                <div key={review._id} className="card" style={styles.reviewCardItem}>
                  <div style={styles.reviewHeader}>
                    <div style={{ ...styles.reviewerAvatar, backgroundColor: `rgba(${hexToRgb(primaryColor)}, 0.08)`, color: `#${primaryColor}` }}>
                      {review.patientId?.name ? review.patientId.name[0].toUpperCase() : "P"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.reviewerName}>{formatName(review.patientId?.name)}</div>
                      <div style={styles.reviewDateRow}>
                        {renderStars(review.rating)}
                        <span style={styles.reviewDot}>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>

                  <p style={styles.reviewComment}>{review.comment || "No comment provided by the patient."}</p>

                  {review.reply && (
                    <div style={{ ...styles.clinicReplyBox, borderLeftColor: `#${primaryColor}` }}>
                      <div style={styles.replyHeader}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#334155" }}>Response from {clinicData.name}</span>
                      </div>
                      <p style={styles.replyText}>{review.reply}</p>
                    </div>
                  )}
                </div>
              ))}

              {(!reviewsData.reviews || reviewsData.reviews.length === 0) && (
                <div style={styles.emptyReviews}>No patient reviews recorded yet. Be the first to share your experience!</div>
              )}
            </div>
          </section>
        )}

      </main>

      {/* Footer credits */}
      <footer style={styles.footer}>
        <div style={styles.footerRow}>
          <span>Powered by <strong>ClinicBook.in</strong> secure telehealth networks</span>
          <span>© 2026 • SSL Encryption Active</span>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc"
  },
  errorScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    padding: "2rem",
    textAlign: "center"
  },
  pageWrapper: {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column"
  },
  clinicHeader: {
    position: "relative",
    backgroundColor: "white",
    borderBottom: "1px solid #cbd5e1"
  },
  coverGradient: {
    height: "160px",
    background: "linear-gradient(135deg, var(--clinic-primary), var(--clinic-secondary))",
    width: "100%"
  },
  headerContent: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "0 2rem 2rem",
    textAlign: "center",
    position: "relative",
    marginTop: "-50px"
  },
  logoFrame: {
    width: "100px",
    height: "100px",
    borderRadius: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    margin: "0 auto 1rem",
    border: "4px solid white"
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  clinicTitle: {
    fontSize: "1.75rem",
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: "-0.03em"
  },
  clinicMetaRow: {
    display: "flex",
    justifyContent: "center",
    gap: "1.5rem",
    marginTop: "0.5rem",
    color: "#64748b",
    fontSize: "0.8125rem",
    flexWrap: "wrap"
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem"
  },
  statusBadgeRow: {
    marginTop: "0.75rem",
    display: "flex",
    justifyContent: "center"
  },
  statusBadgeActive: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "750"
  },
  mainLayout: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "2.5rem 2rem",
    width: "100%",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3rem"
  },
  sectionBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem"
  },
  sectionHeading: {
    fontSize: "1.125rem",
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: "-0.02em"
  },
  sectionSubHeading: {
    fontSize: "0.8125rem",
    color: "#64748b",
    marginBottom: "1rem"
  },
  doctorsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem"
  },
  doctorCard: {
    cursor: "pointer",
    display: "flex",
    flexDirection: "row",
    gap: "1.25rem",
    padding: "1.25rem",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1.5px solid #e2e8f0",
    backgroundColor: "white"
  },
  docAvatarSection: {
    position: "relative"
  },
  docAvatarFrame: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  docAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  checkBadge: {
    position: "absolute",
    bottom: "-4px",
    right: "-4px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid white"
  },
  docInfoSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  docName: {
    fontSize: "0.875rem",
    fontWeight: "800",
    color: "#0f172a"
  },
  docSpecialization: {
    fontSize: "0.75rem",
    fontWeight: "750"
  },
  docStatsRow: {
    display: "flex",
    gap: "0.75rem",
    fontSize: "0.6875rem",
    color: "#64748b",
    fontWeight: "600",
    marginTop: "0.25rem"
  },
  docStatItem: {
    backgroundColor: "#f8fafc",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px"
  },
  selectDoctorBtn: {
    width: "100%",
    padding: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: "750",
    borderRadius: "6px",
    border: "1px solid",
    marginTop: "0.75rem",
    textAlign: "center"
  },
  emptyState: {
    textAlign: "center",
    padding: "2rem",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    borderRadius: "var(--radius-lg)",
    fontSize: "0.875rem"
  },
  bookingContainerSplit: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
    width: "100%"
  },
  datePickerCard: {
    flex: 1,
    minWidth: "290px",
    padding: "1.5rem",
    backgroundColor: "white"
  },
  slotsCard: {
    flex: 2,
    minWidth: "300px",
    padding: "1.5rem",
    backgroundColor: "white"
  },
  pickerSubHeading: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: "1.25rem",
    textTransform: "uppercase"
  },
  weekListColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  dateListItem: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    textAlign: "left"
  },
  dateListItemDisabled: {
    backgroundColor: "#f1f5f9",
    opacity: 0.5,
    cursor: "not-allowed",
    borderColor: "#e2e8f0"
  },
  dateTextLeft: {
    display: "flex",
    flexDirection: "column"
  },
  dateDayName: {
    fontWeight: "800",
    fontSize: "0.8125rem"
  },
  dateDayFull: {
    fontSize: "0.6875rem",
    opacity: 0.8
  },
  dateActionRight: {
    display: "flex",
    alignItems: "center"
  },
  closedPill: {
    fontSize: "0.625rem",
    padding: "0.25rem 0.5rem",
    backgroundColor: "#e2e8f0",
    color: "#64748b",
    borderRadius: "4px",
    fontWeight: "750"
  },
  loadingSlots: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem"
  },
  slotsSessionList: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  slotsSessionBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  },
  sessionTitle: {
    fontSize: "0.8125rem",
    fontWeight: "800",
    color: "#475569"
  },
  slotsGridBtnWrapper: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
    gap: "0.5rem"
  },
  slotBtnItem: {
    padding: "0.5rem",
    borderRadius: "8px",
    fontSize: "0.75rem",
    fontWeight: "750",
    textAlign: "center",
    cursor: "pointer"
  },
  emptySlotsBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1.5rem",
    backgroundColor: "#f8fafc",
    borderRadius: "10px"
  },
  bookingFormCard: {
    padding: "2rem",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  formRow: {
    display: "flex",
    gap: "1.25rem",
    flexWrap: "wrap"
  },
  inputIconWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%"
  },
  inputIcon: {
    position: "absolute",
    left: "12px",
    color: "#94a3b8"
  },
  formSummaryBlock: {
    backgroundColor: "#f8fafc",
    padding: "1rem",
    borderRadius: "8px",
    textAlign: "center",
    border: "1px dashed #cbd5e1"
  },
  summaryText: {
    fontSize: "0.8125rem",
    color: "#334155"
  },
  bookSubmitBtn: {
    width: "100%",
    padding: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: "800",
    borderRadius: "10px",
    marginTop: "0.5rem"
  },
  successScreen: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem"
  },
  successCard: {
    width: "100%",
    maxWidth: "500px",
    padding: "2.5rem 2rem",
    textAlign: "center",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  successBadge: {
    marginBottom: "1rem"
  },
  successHeading: {
    fontSize: "1.5rem",
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: "-0.03em"
  },
  successSub: {
    fontSize: "0.8125rem",
    color: "#64748b",
    marginBottom: "1.5rem",
    lineHeight: "1.4"
  },
  ticketSlip: {
    border: "1.5px solid #cbd5e1",
    borderRadius: "14px",
    backgroundColor: "#f8fafc",
    width: "100%",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "row",
    gap: "1.25rem",
    alignItems: "center",
    textAlign: "left",
    marginBottom: "1.5rem",
    backgroundImage: "radial-gradient(circle at top left, transparent 8px, #f8fafc 8px), radial-gradient(circle at top right, transparent 8px, #f8fafc 8px)"
  },
  ticketSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    flexShrink: 0
  },
  qrContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.375rem"
  },
  qrImage: {
    width: "110px",
    height: "110px",
    border: "4px solid white",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
  },
  ticketLabel: {
    fontSize: "0.5625rem",
    fontWeight: "750",
    color: "#94a3b8",
    letterSpacing: "0.05em",
    textTransform: "uppercase"
  },
  ticketValueMonospace: {
    fontFamily: "monospace",
    fontSize: "0.6875rem",
    fontWeight: "800",
    color: "#334155"
  },
  ticketDivider: {
    width: "1px",
    alignSelf: "stretch",
    borderLeft: "2px dashed #cbd5e1"
  },
  ticketSectionRight: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem"
  },
  ticketRow: {
    display: "flex",
    flexDirection: "column"
  },
  ticketValueBold: {
    fontSize: "0.8125rem",
    fontWeight: "800",
    color: "#0f172a"
  },
  ticketValue: {
    fontSize: "0.75rem",
    color: "#475569",
    fontWeight: "600"
  },
  successActions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    width: "100%"
  },
  successActionBtn: {
    width: "100%",
    padding: "0.625rem",
    fontSize: "0.8125rem",
    fontWeight: "800",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem"
  },
  footer: {
    backgroundColor: "white",
    borderTop: "1px solid #e2e8f0",
    padding: "1.5rem 2rem",
    marginTop: "auto"
  },
  footerRow: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.75rem",
    color: "#64748b",
    flexWrap: "wrap",
    gap: "0.5rem"
  },
  reviewsStatsCard: {
    display: "flex",
    padding: "1.5rem",
    backgroundColor: "white",
    alignItems: "center",
    gap: "2rem",
    flexWrap: "wrap"
  },
  statsLeftCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "140px"
  },
  largeRatingNum: {
    fontSize: "2.75rem",
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: "1"
  },
  statsReviewsCount: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontWeight: "600",
    marginTop: "0.25rem"
  },
  statsDivider: {
    width: "1px",
    height: "100px",
    backgroundColor: "#e2e8f0",
    alignSelf: "stretch",
    display: "block"
  },
  statsRightCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    minWidth: "200px"
  },
  distRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.75rem",
    color: "#475569"
  },
  distLabel: {
    width: "55px",
    fontWeight: "600"
  },
  distBarBg: {
    flex: 1,
    height: "6px",
    backgroundColor: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden"
  },
  distBarFill: {
    height: "100%",
    borderRadius: "3px"
  },
  distCount: {
    width: "20px",
    textAlign: "right",
    fontWeight: "750",
    color: "#0f172a"
  },
  reviewsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginTop: "1rem"
  },
  reviewCardItem: {
    padding: "1.25rem",
    backgroundColor: "white",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  },
  reviewHeader: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center"
  },
  reviewerAvatar: {
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "0.875rem"
  },
  reviewerName: {
    fontSize: "0.8125rem",
    fontWeight: "850",
    color: "#0f172a"
  },
  reviewDateRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.6875rem",
    color: "#64748b"
  },
  reviewDot: {
    opacity: 0.5
  },
  reviewComment: {
    fontSize: "0.8125rem",
    color: "#334155",
    lineHeight: "1.5"
  },
  clinicReplyBox: {
    borderLeft: "3.5px solid",
    backgroundColor: "#f8fafc",
    padding: "0.75rem 1rem",
    borderRadius: "0 8px 8px 0",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    marginTop: "0.25rem"
  },
  replyHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  replyText: {
    fontSize: "0.75rem",
    color: "#475569",
    lineHeight: "1.5"
  },
  emptyReviews: {
    textAlign: "center",
    padding: "2.5rem",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    borderRadius: "10px",
    fontSize: "0.8125rem"
  }
};

export default ClinicBookingPage;
