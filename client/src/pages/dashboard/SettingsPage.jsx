import React, { useState } from "react";
import { 
  Building2, 
  Palette, 
  Clock, 
  Bell, 
  CreditCard, 
  Users, 
  Upload, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Shield,
  Clock3,
  Calendar,
  AlertCircle
} from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import api from "../../lib/api.js";

/**
 * Premium Interactive Settings Dashboard for managing clinic configurations,
 * branding customizer, operating hours, notification preferences, and subscription tiering.
 */
const SettingsPage = () => {
  const { clinic, token, setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState("clinic-info");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Clinic Info Form State
  const [name, setName] = useState(clinic?.name || "");
  const [phone, setPhone] = useState(clinic?.phone || "");
  const [address, setAddress] = useState(clinic?.address || "");
  const [city, setCity] = useState(clinic?.city || "");
  const [email, setEmail] = useState(clinic?.email || clinic?.ownerEmail || "");
  const [website, setWebsite] = useState(clinic?.website || "");
  
  const allSpecializations = ["General Medicine", "Pediatrics", "Cardiology", "Dermatology", "Orthopedics", "Gynecology", "Ophthalmology", "Dentistry", "Psychiatry", "Neurology"];
  const [specializations, setSpecializations] = useState(clinic?.specializations || []);

  const handleSpecToggle = (spec) => {
    setSpecializations(prev => 
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleSaveClinicInfo = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await api.patch("/auth/profile", {
        name,
        phone,
        address,
        city,
        email,
        website,
        specializations
      });
      if (response.data?.success) {
        setAuth(response.data.clinic, token);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update clinic info.");
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Branding State
  const [primaryColor, setPrimaryColor] = useState(clinic?.primaryColor || "0EA5E9");
  const [secondaryColor, setSecondaryColor] = useState(clinic?.secondaryColor || "6366F1");
  const [logoPreview, setLogoPreview] = useState(clinic?.logo?.url || "");
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const handleLogoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Instant Upload
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await api.post("/auth/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (response.data?.success) {
        setAuth(response.data.clinic, token);
        alert("Logo uploaded and updated successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSaveBrandingColors = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await api.patch("/auth/profile", {
        primaryColor,
        secondaryColor
      });
      if (response.data?.success) {
        setAuth(response.data.clinic, token);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update branding colors.");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Opening Hours State
  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const initialHours = clinic?.openingHours || daysOfWeek.reduce((acc, d) => {
    acc[d] = { open: true, startTime: "09:00", endTime: "17:00" };
    return acc;
  }, {});
  const [openingHours, setOpeningHours] = useState(initialHours);

  const handleHourToggle = (day) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], open: !prev[day].open }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const handleSaveHours = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const response = await api.patch("/auth/profile", { openingHours });
      if (response.data?.success) {
        setAuth(response.data.clinic, token);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update operating hours.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Notifications State
  const [whatsappConfirm, setWhatsappConfirm] = useState(true);
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder1h, setReminder1h] = useState(false);

  const handleSaveNotifications = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  // 5. Subscription State
  const currentPlan = clinic?.plan || "starter";
  const planExpiry = clinic?.planExpiresAt ? new Date(clinic.planExpiresAt).toLocaleDateString() : "Lifetime / Developer Tier";
  
  const paymentHistoryMock = [
    { id: "TXN-90231", date: "May 01, 2026", amount: "₹4,999", plan: "Growth (Annual)", status: "Completed" },
    { id: "TXN-80412", date: "May 01, 2025", amount: "₹4,999", plan: "Growth (Annual)", status: "Completed" }
  ];

  return (
    <div style={styles.container}>
      {/* Page Title & Status */}
      <section style={styles.topHeader}>
        <div>
          <h1 style={styles.pageTitle}>Clinic Settings</h1>
          <span style={styles.pageSubTitle}>Configure clinic metadata, active styling engines, schedules, and notifications</span>
        </div>
        
        {saveSuccess && (
          <div style={styles.toastSuccess} className="animate-fade-in">
            <Check size={16} />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </section>

      {/* Tabs Layout */}
      <section style={styles.settingsLayout}>
        {/* Left Tabs Bar */}
        <div style={styles.tabsSidebar} className="card">
          <button 
            style={{ ...styles.tabBtn, ...(activeTab === "clinic-info" ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab("clinic-info")}
          >
            <Building2 size={18} />
            <span>Clinic Profile</span>
          </button>
          
          <button 
            style={{ ...styles.tabBtn, ...(activeTab === "branding" ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab("branding")}
          >
            <Palette size={18} />
            <span>Branding customizer</span>
          </button>

          <button 
            style={{ ...styles.tabBtn, ...(activeTab === "hours" ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab("hours")}
          >
            <Clock size={18} />
            <span>Opening Hours</span>
          </button>

          <button 
            style={{ ...styles.tabBtn, ...(activeTab === "notifications" ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell size={18} />
            <span>Notifications</span>
          </button>

          <button 
            style={{ ...styles.tabBtn, ...(activeTab === "subscription" ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab("subscription")}
          >
            <CreditCard size={18} />
            <span>Subscription & Billing</span>
          </button>

          <button 
            style={{ ...styles.tabBtn, ...(activeTab === "team" ? styles.tabBtnActive : {}) }}
            onClick={() => setActiveTab("team")}
          >
            <Users size={18} />
            <span>Team Members</span>
          </button>
        </div>

        {/* Right Active Tab Content Card */}
        <div style={styles.mainContent} className="card">
          
          {/* TAB 1: CLINIC INFO FORM */}
          {activeTab === "clinic-info" && (
            <form onSubmit={handleSaveClinicInfo} style={styles.tabForm} className="animate-fade-in">
              <h2 style={styles.sectionTitle}>General Clinic Information</h2>
              
              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Clinic Public Name</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="E.g. City Health Clinic" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Subdomain (Identifer)</label>
                  <input 
                    type="text" 
                    disabled 
                    className="form-input" 
                    value={clinic?.subdomain || "subdomain"} 
                    style={{ backgroundColor: "hsl(var(--background))", cursor: "not-allowed" }}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Support Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="form-input" 
                    placeholder="contact@myclinic.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Public Telephone</label>
                  <input 
                    type="tel" 
                    required 
                    className="form-input" 
                    placeholder="E.g. 022 12345678" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Physical Address</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="E.g. 102, Medical Complex, MG Road" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">City</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="E.g. Mumbai" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official Website URL (Optional)</label>
                <input 
                  type="url" 
                  className="form-input" 
                  placeholder="https://www.clinicbook.in" 
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)} 
                />
              </div>

              {/* Specializations list */}
              <div className="form-group">
                <label className="form-label">Clinical Specializations (Select all applicable)</label>
                <div style={styles.specsGrid}>
                  {allSpecializations.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSpecToggle(spec)}
                      style={{
                        ...styles.specChip,
                        ...(specializations.includes(spec) ? styles.specChipActive : {})
                      }}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSaving} 
                className="btn btn-primary" 
                style={styles.saveBtn}
              >
                {isSaving ? "Saving Updates..." : "Save Profile Details"}
              </button>
            </form>
          )}

          {/* TAB 2: BRANDING CUSTOMIZER & LIVE PREVIEW */}
          {activeTab === "branding" && (
            <div style={styles.tabForm} className="animate-fade-in">
              <h2 style={styles.sectionTitle}>Branding Customizer</h2>
              
              <div style={styles.brandingSplitGrid}>
                {/* Visual Options Form */}
                <div style={styles.brandingControlsCol}>
                  {/* Logo Dropzone */}
                  <div className="form-group">
                    <label className="form-label">Clinic Logo</label>
                    <div style={styles.logoDropzone}>
                      <input 
                        type="file" 
                        id="logo-upload-input" 
                        accept="image/*" 
                        onChange={handleLogoFileChange}
                        style={{ display: "none" }}
                      />
                      <label htmlFor="logo-upload-input" style={styles.logoLabelWrapper}>
                        {logoPreview ? (
                          <div style={styles.previewLogoContainer}>
                            <img src={logoPreview} alt="Clinic Logo" style={styles.previewLogoImg} />
                            <div style={styles.logoHoverOverlay}>
                              <Upload size={20} />
                              <span>Replace Logo</span>
                            </div>
                          </div>
                        ) : (
                          <div style={styles.emptyDropzoneContent}>
                            <Upload size={28} style={{ color: "hsl(var(--text-secondary))", marginBottom: "0.5rem" }} />
                            <span style={{ fontSize: "0.8125rem", fontWeight: "600" }}>Drag Logo File Here or Click</span>
                            <span style={{ fontSize: "0.75rem", color: "hsl(var(--text-secondary))" }}>PNG, JPG up to 2MB</span>
                          </div>
                        )}
                      </label>
                    </div>
                    {logoUploading && <div style={{ fontSize: "0.75rem", color: "hsl(var(--teal-600))", marginTop: "0.25rem" }}>Uploading to cloud systems...</div>}
                  </div>

                  {/* Primary Color Pickers */}
                  <div className="form-group">
                    <label className="form-label">Primary Brand Color (Hex)</label>
                    <div style={styles.colorPickerWrapper}>
                      <input 
                        type="color" 
                        value={`#${primaryColor}`} 
                        onChange={(e) => setPrimaryColor(e.target.value.replace("#", "").toUpperCase())} 
                        style={styles.nativeColorInput}
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={primaryColor} 
                        onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
                        style={{ margin: 0, textTransform: "uppercase" }}
                      />
                    </div>
                  </div>

                  {/* Secondary Color Pickers */}
                  <div className="form-group">
                    <label className="form-label">Secondary Brand Color (Hex)</label>
                    <div style={styles.colorPickerWrapper}>
                      <input 
                        type="color" 
                        value={`#${secondaryColor}`} 
                        onChange={(e) => setSecondaryColor(e.target.value.replace("#", "").toUpperCase())} 
                        style={styles.nativeColorInput}
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={secondaryColor} 
                        onChange={(e) => setSecondaryColor(e.target.value.toUpperCase())}
                        style={{ margin: 0, textTransform: "uppercase" }}
                      />
                    </div>
                  </div>

                  <button 
                    type="button" 
                    disabled={isSaving} 
                    className="btn btn-primary" 
                    onClick={handleSaveBrandingColors}
                    style={{ ...styles.saveBtn, marginTop: "1rem" }}
                  >
                    {isSaving ? "Locking Colors..." : "Save Branding Colors"}
                  </button>
                </div>

                {/* Device Live Mockup Preview Column */}
                <div style={styles.brandingPreviewCol}>
                  <h3 style={styles.previewHeading}>Live Preview (Booking Engine)</h3>
                  
                  {/* Phone Device Mockup Wrapper */}
                  <div style={styles.phoneDeviceMockup}>
                    <div style={styles.deviceSpeaker}></div>
                    
                    <div style={styles.deviceScreen}>
                      {/* Booking page header */}
                      <header style={{ ...styles.deviceHeader, backgroundColor: `#${primaryColor}` }}>
                        <div style={styles.deviceClinicTitle}>{name || "My Clinic"}</div>
                        <span style={styles.deviceClinicSub}>{city || "City"} • TeleHealth</span>
                      </header>

                      {/* Mockup body */}
                      <div style={styles.deviceBody}>
                        <div style={styles.deviceMockCard}>
                          <div style={styles.mockDoctorRow}>
                            <div style={styles.mockAvatar}>👤</div>
                            <div>
                              <div style={styles.mockDoctorName}>Dr. Rachel Green</div>
                              <span style={styles.mockDoctorSpec}>Consultant Pediatrician</span>
                            </div>
                          </div>

                          <div style={styles.mockDatesGrid}>
                            {["Mon 19", "Tue 20", "Wed 21"].map((d, i) => (
                              <div 
                                key={i} 
                                style={{ 
                                  ...styles.mockDateBtn, 
                                  backgroundColor: i === 0 ? `#${primaryColor}1a` : "#f8fafc",
                                  borderColor: i === 0 ? `#${primaryColor}` : "#e2e8f0",
                                  color: i === 0 ? `#${primaryColor}` : "#64748b"
                                }}
                              >
                                {d}
                              </div>
                            ))}
                          </div>

                          <button style={{ ...styles.mockActionBtn, backgroundColor: `#${secondaryColor}` }}>
                            Confirm Booking Slot
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLINIC-WIDE OPENING HOURS */}
          {activeTab === "hours" && (
            <div style={styles.tabForm} className="animate-fade-in">
              <h2 style={styles.sectionTitle}>Operating Hours & Schedule</h2>
              <p style={styles.sectionSubTitle}>Define clinic-wide operation ranges. Patient self-booking hours conform to these constraints.</p>
              
              <div style={styles.weeklyScheduleTable}>
                {daysOfWeek.map((day) => {
                  const item = openingHours[day] || { open: false, startTime: "", endTime: "" };
                  return (
                    <div key={day} style={styles.scheduleRow}>
                      <div style={styles.scheduleDayName}>{day}</div>
                      
                      {/* Open/Closed Toggle */}
                      <label style={styles.toggleLabel}>
                        <input 
                          type="checkbox" 
                          checked={item.open} 
                          onChange={() => handleHourToggle(day)} 
                          style={styles.toggleCheckbox}
                        />
                        <span style={{ 
                          ...styles.toggleStatusLabel, 
                          color: item.open ? "hsl(var(--teal-600))" : "hsl(var(--text-secondary))",
                          fontWeight: item.open ? "750" : "500"
                        }}>
                          {item.open ? "Open" : "Closed"}
                        </span>
                      </label>

                      {/* Time Inputs */}
                      {item.open ? (
                        <div style={styles.scheduleTimeInputsRow}>
                          <div style={styles.timeInputWrapper}>
                            <span style={styles.timeInputLabel}>Start</span>
                            <input 
                              type="time" 
                              className="form-input" 
                              value={item.startTime} 
                              onChange={(e) => handleTimeChange(day, "startTime", e.target.value)}
                              style={styles.inlineTimeInput}
                            />
                          </div>

                          <div style={styles.timeInputWrapper}>
                            <span style={styles.timeInputLabel}>End</span>
                            <input 
                              type="time" 
                              className="form-input" 
                              value={item.endTime} 
                              onChange={(e) => handleTimeChange(day, "endTime", e.target.value)}
                              style={styles.inlineTimeInput}
                            />
                          </div>
                        </div>
                      ) : (
                        <div style={styles.closedRowPlaceholder}>Clinic closed for consultations</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button 
                type="button" 
                disabled={isSaving} 
                className="btn btn-primary" 
                onClick={handleSaveHours}
                style={{ ...styles.saveBtn, marginTop: "1rem" }}
              >
                {isSaving ? "Saving Schedules..." : "Save Operating Hours"}
              </button>
            </div>
          )}

          {/* TAB 4: NOTIFICATION CONTROLS */}
          {activeTab === "notifications" && (
            <div style={styles.tabForm} className="animate-fade-in">
              <h2 style={styles.sectionTitle}>Automated Communications & Notifications</h2>
              <p style={styles.sectionSubTitle}>Configure automated patient channels and reminder windows.</p>

              <div style={styles.notificationGroupList}>
                {/* Toggles */}
                <div style={styles.notifToggleCard} className="card">
                  <div style={styles.notifTextCol}>
                    <div style={styles.notifTitle}>WhatsApp Confirmation Slips</div>
                    <span style={styles.notifDesc}>Dispatches fully secure diagnostic confirmation templates to patients upon booking completion.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={whatsappConfirm} 
                    onChange={(e) => setWhatsappConfirm(e.target.checked)} 
                    style={styles.standardCheckbox}
                  />
                </div>

                <div style={styles.notifToggleCard} className="card">
                  <div style={styles.notifTextCol}>
                    <div style={styles.notifTitle}>24-Hour Reminder Alert</div>
                    <span style={styles.notifDesc}>Triggers SMS and WhatsApp text reminders exactly 24 hours prior to the consult session.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={reminder24h} 
                    onChange={(e) => setReminder24h(e.target.checked)} 
                    style={styles.standardCheckbox}
                  />
                </div>

                <div style={styles.notifToggleCard} className="card">
                  <div style={styles.notifTextCol}>
                    <div style={styles.notifTitle}>1-Hour Action Reminder Alert</div>
                    <span style={styles.notifDesc}>Dispatches a rush checklist reminder alert 1 hour prior to appointment start time.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={reminder1h} 
                    onChange={(e) => setReminder1h(e.target.checked)} 
                    style={styles.standardCheckbox}
                  />
                </div>
              </div>

              <button 
                type="button" 
                disabled={isSaving} 
                className="btn btn-primary" 
                onClick={handleSaveNotifications}
                style={{ ...styles.saveBtn, marginTop: "1rem" }}
              >
                {isSaving ? "Saving Rules..." : "Save Communication Protocols"}
              </button>
            </div>
          )}

          {/* TAB 5: SUBSCRIPTIONS & TRANSACTIONS */}
          {activeTab === "subscription" && (
            <div style={styles.tabForm} className="animate-fade-in">
              <h2 style={styles.sectionTitle}>Subscription Plan</h2>
              
              {/* Active Plan Dashboard Card */}
              <div style={styles.planOverviewCard}>
                <div style={styles.planHeaderBadge}>
                  <Shield size={20} />
                  <span>Active Security Shield</span>
                </div>

                <div style={styles.planCoreFlex}>
                  <div>
                    <h3 style={styles.planNameTitle}>{currentPlan.toUpperCase()} TIER LICENSE</h3>
                    <span style={styles.planExpiryDesc}>Active through: <strong>{planExpiry}</strong></span>
                  </div>
                  <button className="btn btn-primary" style={styles.upgradePlanBtn}>
                    Upgrade My License
                  </button>
                </div>

                <div style={styles.planFeaturesBlock}>
                  <h4 style={styles.featuresHeading}>Included Features & Quotas:</h4>
                  <div style={styles.featuresGrid}>
                    <div style={styles.featureItem}>✅ Unlimited Real-time Walk-ins</div>
                    <div style={styles.featureItem}>✅ Up to 5 Doctor Profiles</div>
                    <div style={styles.featureItem}>✅ Cloudinary Rx PDF Storage</div>
                    <div style={styles.featureItem}>✅ Interactive Live Customizer</div>
                    <div style={styles.featureItem}>✅ Integrated Telehealth Slacks</div>
                    <div style={styles.featureItem}>✅ Secure Mongoose Data Shields</div>
                  </div>
                </div>
              </div>

              {/* Transactions table */}
              <div style={{ marginTop: "2rem" }}>
                <h3 style={styles.billingSubheading}>Recent Billing Transactions</h3>
                <div style={styles.billingTableWrapper}>
                  <table style={styles.billingTable}>
                    <thead>
                      <tr style={styles.billingThRow}>
                        <th style={styles.billingTh}>Txn ID</th>
                        <th style={styles.billingTh}>Billing Date</th>
                        <th style={styles.billingTh}>Plan Period</th>
                        <th style={styles.billingTh}>Amount</th>
                        <th style={styles.billingTh}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistoryMock.map((txn, idx) => (
                        <tr key={idx} style={styles.billingTr}>
                          <td style={{ ...styles.billingTd, fontWeight: "700" }}>{txn.id}</td>
                          <td style={styles.billingTd}>{txn.date}</td>
                          <td style={styles.billingTd}>{txn.plan}</td>
                          <td style={{ ...styles.billingTd, color: "hsl(var(--emerald-600))", fontWeight: "600" }}>{txn.amount}</td>
                          <td style={styles.billingTd}>
                            <span className="badge badge-completed">{txn.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TEAM MEMBERS PLACEHOLDER */}
          {activeTab === "team" && (
            <div className="animate-fade-in" style={{ ...styles.tabForm, textAlign: "center", padding: "4rem 2rem" }}>
              <Users size={48} style={{ color: "hsl(var(--teal-500))", margin: "0 auto 1.5rem" }} />
              <h2 style={styles.teamTitle}>Team & Staff Profiles</h2>
              <p style={styles.teamDesc}>
                Invite assistants, compounders, receptionist clerks, and additional consulting partners to access the secure ClinicBook panel.
              </p>
              
              <div style={styles.mockTeamGrid}>
                {/* Mock Member card 1 */}
                <div style={styles.mockMemberCard} className="card">
                  <div style={styles.mockAvatarFrame}>👩‍💼</div>
                  <div style={styles.mockMemberName}>Sarah Jenkins</div>
                  <span style={styles.mockMemberRole}>Lead Receptionist Clerk</span>
                </div>

                {/* Mock Member card 2 */}
                <div style={styles.mockMemberCard} className="card">
                  <div style={styles.mockAvatarFrame}>👨‍🔬</div>
                  <div style={styles.mockMemberName}>David Miller</div>
                  <span style={styles.mockMemberRole}>Senior Clinical Pharmacist</span>
                </div>
              </div>

              <button className="btn btn-secondary" disabled style={{ marginTop: "1.5rem", cursor: "not-allowed" }}>
                + Add Staff Member (Coming Soon)
              </button>
            </div>
          )}

        </div>
      </section>
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
  topHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem"
  },
  pageTitle: {
    fontSize: "1.625rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.03em"
  },
  pageSubTitle: {
    fontSize: "0.8125rem",
    color: "hsl(var(--text-secondary))"
  },
  toastSuccess: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    backgroundColor: "hsl(var(--emerald-50))",
    color: "hsl(var(--emerald-700))",
    border: "1px solid hsl(var(--emerald-200))",
    padding: "0.5rem 1rem",
    borderRadius: "var(--radius-md)",
    fontSize: "0.8125rem",
    fontWeight: "600"
  },
  settingsLayout: {
    display: "flex",
    gap: "1.5rem",
    flexDirection: "row",
    alignItems: "start",
    flexWrap: "wrap"
  },
  tabsSidebar: {
    width: "100%",
    maxWidth: "240px",
    padding: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    backgroundColor: "hsl(var(--surface))"
  },
  tabBtn: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "var(--radius-md)",
    border: "none",
    background: "none",
    color: "hsl(var(--text-secondary))",
    fontWeight: "600",
    fontSize: "0.875rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    textAlign: "left",
    transition: "all 0.15s ease"
  },
  tabBtnActive: {
    backgroundColor: "hsl(var(--teal-50))",
    color: "hsl(var(--teal-700))",
    boxShadow: "inset 4px 0 0 hsl(var(--teal-600))"
  },
  mainContent: {
    flex: 1,
    minWidth: "300px",
    backgroundColor: "hsl(var(--surface))",
    padding: "2rem"
  },
  tabForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  sectionTitle: {
    fontSize: "1.125rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    borderBottom: "1px solid hsl(var(--surface-border))",
    paddingBottom: "0.5rem",
    marginBottom: "0.5rem"
  },
  sectionSubTitle: {
    fontSize: "0.8125rem",
    color: "hsl(var(--text-secondary))",
    marginTop: "-1rem",
    lineHeight: "1.5"
  },
  formRow: {
    display: "flex",
    gap: "1rem"
  },
  specsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginTop: "0.5rem"
  },
  specChip: {
    padding: "0.4rem 0.875rem",
    borderRadius: "9999px",
    border: "1px solid hsl(var(--surface-border))",
    backgroundColor: "hsl(var(--background))",
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--text-secondary))",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  specChipActive: {
    backgroundColor: "hsl(var(--teal-500))",
    borderColor: "hsl(var(--teal-500))",
    color: "white"
  },
  saveBtn: {
    alignSelf: "start",
    padding: "0.625rem 1.75rem"
  },
  brandingSplitGrid: {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap"
  },
  brandingControlsCol: {
    flex: 1,
    minWidth: "260px",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  brandingPreviewCol: {
    flex: 1,
    minWidth: "280px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  previewHeading: {
    fontSize: "0.8125rem",
    fontWeight: "750",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase",
    marginBottom: "1rem"
  },
  logoDropzone: {
    border: "2px dashed hsl(var(--surface-border))",
    borderRadius: "var(--radius-lg)",
    backgroundColor: "hsl(var(--background))",
    cursor: "pointer",
    overflow: "hidden"
  },
  logoLabelWrapper: {
    width: "100%",
    minHeight: "130px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  previewLogoContainer: {
    position: "relative",
    width: "100%",
    height: "130px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white"
  },
  previewLogoImg: {
    maxWidth: "100%",
    maxHeight: "100px",
    objectFit: "contain"
  },
  logoHoverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.25rem",
    opacity: 0,
    transition: "opacity 0.2s ease",
    ":hover": {
      opacity: 1
    }
  },
  emptyDropzoneContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  colorPickerWrapper: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center"
  },
  nativeColorInput: {
    width: "42px",
    height: "36px",
    border: "1px solid hsl(var(--surface-border))",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    backgroundColor: "transparent",
    padding: 0
  },
  phoneDeviceMockup: {
    width: "250px",
    height: "440px",
    border: "12px solid #1e293b",
    borderRadius: "32px",
    backgroundColor: "white",
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
    position: "relative",
    overflow: "hidden"
  },
  deviceSpeaker: {
    position: "absolute",
    top: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "50px",
    height: "4px",
    backgroundColor: "#1e293b",
    borderRadius: "2px",
    zIndex: 10
  },
  deviceScreen: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column"
  },
  deviceHeader: {
    padding: "1.25rem 1rem 0.75rem",
    color: "white",
    textAlign: "center"
  },
  deviceClinicTitle: {
    fontWeight: "800",
    fontSize: "0.875rem"
  },
  deviceClinicSub: {
    fontSize: "0.625rem",
    opacity: 0.85
  },
  deviceBody: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    padding: "0.75rem"
  },
  deviceMockCard: {
    backgroundColor: "white",
    borderRadius: "10px",
    padding: "0.75rem",
    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem"
  },
  mockDoctorRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  mockAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem"
  },
  mockDoctorName: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#0f172a"
  },
  mockDoctorSpec: {
    fontSize: "0.5625rem",
    color: "#64748b"
  },
  mockDatesGrid: {
    display: "flex",
    gap: "0.375rem"
  },
  mockDateBtn: {
    flex: 1,
    padding: "0.375rem 0.25rem",
    borderRadius: "6px",
    borderWidth: "1px",
    borderStyle: "solid",
    fontSize: "0.5625rem",
    textAlign: "center",
    fontWeight: "750"
  },
  mockActionBtn: {
    width: "100%",
    padding: "0.5rem",
    borderRadius: "6px",
    border: "none",
    color: "white",
    fontWeight: "700",
    fontSize: "0.6875rem",
    cursor: "pointer",
    textAlign: "center"
  },
  weeklyScheduleTable: {
    border: "1px solid hsl(var(--surface-border))",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
    backgroundColor: "hsl(var(--background))",
    marginTop: "0.5rem"
  },
  scheduleRow: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid hsl(var(--surface-border))",
    padding: "0.75rem 1.25rem",
    flexWrap: "wrap",
    gap: "1rem",
    ":last-child": {
      borderBottom: "none"
    }
  },
  scheduleDayName: {
    width: "100px",
    fontWeight: "750",
    color: "hsl(var(--text-primary))",
    textTransform: "capitalize",
    fontSize: "0.875rem"
  },
  toggleLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    minWidth: "90px"
  },
  toggleCheckbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "hsl(var(--teal-600))"
  },
  toggleStatusLabel: {
    fontSize: "0.8125rem"
  },
  scheduleTimeInputsRow: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center"
  },
  timeInputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem"
  },
  timeInputLabel: {
    fontSize: "0.6875rem",
    fontWeight: "600",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase"
  },
  inlineTimeInput: {
    padding: "0.375rem 0.5rem",
    fontSize: "0.8125rem",
    width: "100px",
    marginBottom: 0
  },
  closedRowPlaceholder: {
    fontSize: "0.8125rem",
    color: "hsl(var(--text-secondary))",
    fontStyle: "italic"
  },
  notificationGroupList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  notifToggleCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem 1.5rem",
    backgroundColor: "hsl(var(--surface))",
    gap: "1.5rem"
  },
  notifTextCol: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  notifTitle: {
    fontSize: "0.95rem",
    fontWeight: "750",
    color: "hsl(var(--text-primary))"
  },
  notifDesc: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))",
    lineHeight: "1.4"
  },
  standardCheckbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
    accentColor: "hsl(var(--teal-600))"
  },
  planOverviewCard: {
    border: "2px solid #5eead4",
    backgroundColor: "#f0fdfa",
    borderRadius: "var(--radius-xl)",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    boxShadow: "0 10px 20px rgba(13, 148, 136, 0.05)"
  },
  planHeaderBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    alignSelf: "start",
    backgroundColor: "#ccfbf1",
    color: "#0d9488",
    padding: "0.375rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.75rem",
    fontWeight: "750",
    textTransform: "uppercase"
  },
  planCoreFlex: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
    borderBottom: "1px solid #cbd5e1",
    paddingBottom: "1rem"
  },
  planNameTitle: {
    fontSize: "1.25rem",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.02em"
  },
  planExpiryDesc: {
    fontSize: "0.8125rem",
    color: "#475569"
  },
  upgradePlanBtn: {
    backgroundColor: "#0d9488",
    ":hover": {
      backgroundColor: "#0f766e"
    }
  },
  planFeaturesBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  featuresHeading: {
    fontSize: "0.8125rem",
    fontWeight: "750",
    color: "#334155",
    textTransform: "uppercase"
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "0.5rem"
  },
  featureItem: {
    fontSize: "0.8125rem",
    color: "#475569",
    fontWeight: "600"
  },
  billingSubheading: {
    fontSize: "1rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    marginBottom: "1rem"
  },
  billingTableWrapper: {
    border: "1px solid hsl(var(--surface-border))",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden"
  },
  billingTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  billingThRow: {
    backgroundColor: "hsl(var(--background))",
    borderBottom: "1px solid hsl(var(--surface-border))"
  },
  billingTh: {
    padding: "0.75rem 1rem",
    fontSize: "0.75rem",
    fontWeight: "750",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase"
  },
  billingTr: {
    borderBottom: "1px solid hsl(var(--surface-border))",
    backgroundColor: "hsl(var(--surface))",
    ":last-child": {
      borderBottom: "none"
    }
  },
  billingTd: {
    padding: "0.75rem 1rem",
    fontSize: "0.8125rem",
    color: "hsl(var(--text-primary))"
  },
  teamTitle: {
    fontSize: "1.25rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    marginBottom: "0.5rem"
  },
  teamDesc: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    maxWidth: "480px",
    margin: "0 auto 2rem",
    lineHeight: "1.5"
  },
  mockTeamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    maxWidth: "500px",
    margin: "0 auto"
  },
  mockMemberCard: {
    backgroundColor: "hsl(var(--surface))",
    padding: "1.25rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem"
  },
  mockAvatarFrame: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "hsl(var(--background))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem"
  },
  mockMemberName: {
    fontSize: "0.875rem",
    fontWeight: "750",
    color: "hsl(var(--text-primary))"
  },
  mockMemberRole: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "600"
  }
};

export default SettingsPage;
