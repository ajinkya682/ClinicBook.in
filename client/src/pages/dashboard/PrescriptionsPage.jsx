import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { 
  Search, 
  Plus, 
  FileText, 
  Eye, 
  Download, 
  X, 
  User, 
  Calendar, 
  Check, 
  AlertCircle,
  PlusCircle,
  Trash2,
  Heart,
  Activity,
  ClipboardList
} from "lucide-react";
import api from "../../lib/api.js";

/**
 * Premium Prescriptions Hub for clinic staff to search, view, download PDFs, and write new prescriptions.
 */
const PrescriptionsPage = () => {
  const queryClient = useQueryClient();
  const location = useLocation();

  // Search filter state
  const [searchVal, setSearchVal] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Direct Write Redirect hook state listener
  useEffect(() => {
    if (location.state?.writePrescApp) {
      setWritePrescApp(location.state.writePrescApp);
    }
  }, [location.state]);

  // Modal active states
  const [viewPrescription, setViewPrescription] = useState(null);
  const [writePrescApp, setWritePrescApp] = useState(null); // When open, writes prescription for this appointment

  // Prescription Writing Form States
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([
    { name: "", dosage: "", frequency: "Once daily", duration: "5 days", instructions: "Take after meals" }
  ]);
  const [labTests, setLabTests] = useState([""]);
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successPrescription, setSuccessPrescription] = useState(null);

  // Debouncing for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Query all prescriptions for the clinic
  const { data: prescriptionsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["prescriptions:list", debouncedSearch],
    queryFn: async () => {
      const response = await api.get("/prescriptions", {
        params: { search: debouncedSearch }
      });
      return response.data?.prescriptions || [];
    }
  });

  const prescriptionsList = prescriptionsData || [];

  // Query completed appointments to easily let staff write prescriptions directly
  const { data: completedAppsData } = useQuery({
    queryKey: ["appointments:completed-list"],
    queryFn: async () => {
      const response = await api.get("/appointments", {
        params: { status: "completed" }
      });
      return response.data || [];
    }
  });
  const completedAppointments = completedAppsData || [];

  // Medicine items handlers
  const handleAddMedicine = () => {
    setMedicines(prev => [
      ...prev,
      { name: "", dosage: "", frequency: "Once daily", duration: "5 days", instructions: "Take after meals" }
    ]);
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMedicineChange = (idx, field, value) => {
    setMedicines(prev => prev.map((med, i) => i === idx ? { ...med, [field]: value } : med));
  };

  // Lab Tests handlers
  const handleAddLabTest = () => {
    setLabTests(prev => [...prev, ""]);
  };

  const handleRemoveLabTest = (idx) => {
    setLabTests(prev => prev.filter((_, i) => i !== idx));
  };

  const handleLabTestChange = (idx, value) => {
    setLabTests(prev => prev.map((test, i) => i === idx ? value : test));
  };

  // Handle Prescription Submission
  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!writePrescApp) return;

    setIsSubmitting(true);
    try {
      const payload = {
        appointmentId: writePrescApp._id,
        diagnosis,
        medicines: medicines.filter(m => m.name.trim() !== ""),
        labTests: labTests.filter(t => t.trim() !== ""),
        followUpDate: followUpDate || undefined,
        notes
      };

      const response = await api.post("/prescriptions", payload);
      const generated = response.data?.prescription;

      queryClient.invalidateQueries({ queryKey: ["prescriptions:list"] });
      queryClient.invalidateQueries({ queryKey: ["patient:prescriptions"] });

      // Set Success display
      setSuccessPrescription(generated);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate prescription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeWriteModal = () => {
    setWritePrescApp(null);
    setSuccessPrescription(null);
    setDiagnosis("");
    setMedicines([{ name: "", dosage: "", frequency: "Once daily", duration: "5 days", instructions: "Take after meals" }]);
    setLabTests([""]);
    setFollowUpDate("");
    setNotes("");
  };

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div style={styles.container}>
      {/* 1. Top Header Action bar */}
      <section style={styles.topActionBar}>
        <h1 style={styles.pageTitle}>Prescriptions Directory</h1>
        
        {/* Write from recent completed select list */}
        {completedAppointments.length > 0 && (
          <div style={styles.quickWriteBtnWrapper}>
            <select 
              className="form-input"
              style={styles.quickWriteSelect}
              onChange={(e) => {
                const appVal = completedAppointments.find(a => a._id === e.target.value);
                if (appVal) {
                  setWritePrescApp(appVal);
                  e.target.value = "";
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>✍️ Write Prescription for Recent Visit...</option>
              {completedAppointments.map(app => (
                <option key={app._id} value={app._id}>
                  {app.patientId?.name} ({new Date(app.appointmentDate).toLocaleDateString()}) - Dr. {app.doctorId?.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* 2. Search & Metrics section */}
      <section className="card" style={styles.searchCard}>
        <div style={styles.searchWrapper}>
          <Search size={18} style={styles.searchIcon} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search prescriptions by patient name, date, or diagnosis..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </section>

      {/* 3. Prescription list */}
      {isLoading ? (
        <div style={styles.loaderArea}>
          <div style={styles.spinner}></div>
          <span>Retreiving clinical prescription history...</span>
        </div>
      ) : isError ? (
        <div style={styles.errorArea} className="card">
          <AlertCircle size={28} style={{ color: "hsl(var(--rose-500))" }} />
          <span>Failed to fetch prescription slips. Please try again.</span>
        </div>
      ) : prescriptionsList.length === 0 ? (
        <div style={styles.emptyArea} className="card">
          <ClipboardList size={32} style={{ color: "hsl(var(--slate-400))", marginBottom: "0.5rem" }} />
          <span>No recorded prescriptions found matching search criteria.</span>
        </div>
      ) : (
        <section style={styles.presListFlex}>
          {prescriptionsList.map((pres) => (
            <div key={pres._id} style={styles.presCard} className="card">
              <div style={styles.presCardHeader}>
                <div style={styles.presAvatar}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={styles.patientName}>{pres.patientId?.name || "Anonymous Patient"}</h3>
                  <span style={styles.doctorName}>Consultant: Dr. {pres.doctorId?.name || "General Practitioner"}</span>
                </div>
                <div style={styles.dateTag}>
                  <Calendar size={12} />
                  <span>{formatDate(pres.createdAt)}</span>
                </div>
              </div>

              <div style={styles.presCardBody}>
                {pres.diagnosis && (
                  <p style={styles.diagText}>
                    Diagnosis: <strong>{pres.diagnosis}</strong>
                  </p>
                )}
                <div style={styles.medsCount}>
                  <span>{pres.medicines?.length || 0} prescribed medications</span>
                  {pres.labTests?.length > 0 && (
                    <span> • {pres.labTests.length} lab tests requested</span>
                  )}
                </div>
              </div>

              <div style={styles.presCardFooter}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setViewPrescription(pres)}
                  style={{ padding: "0.4rem 1rem", fontSize: "0.8125rem" }}
                >
                  <Eye size={14} />
                  <span>View Slip</span>
                </button>
                <a 
                  href={pres.pdfUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-primary"
                  style={{ padding: "0.4rem 1rem", fontSize: "0.8125rem" }}
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 4. VIEW PRESCRIPTION PAPER MOCKUP MODAL */}
      {viewPrescription && (
        <div style={styles.modalBackdrop} onClick={() => setViewPrescription(null)}>
          <div style={styles.presPaperCard} className="animate-fade-in" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal header overlay */}
            <div style={styles.presPaperCloseBar}>
              <span style={styles.presTitleHeader}>Medical Prescription Slip</span>
              <button style={styles.closeBtnIcon} onClick={() => setViewPrescription(null)}>
                <X size={20} />
              </button>
            </div>

            {/* A4 Styled Prescription Layout paper block */}
            <div style={styles.a4Paper}>
              {/* Clinic Header Brand */}
              <div style={styles.a4ClinicHeader}>
                <div style={styles.brandTitle}>CLINICBOOK SERVICES</div>
                <div style={styles.brandSub}>Modern Integrated Healthcare Platforms</div>
              </div>

              {/* Sub header details bar */}
              <div style={styles.a4DoctorPatientGrid}>
                {/* Doctor credentials */}
                <div style={styles.docCredsBlock}>
                  <div style={styles.docNameTitle}>Dr. {viewPrescription.doctorId?.name}</div>
                  <div style={styles.docQualifications}>
                    {viewPrescription.doctorId?.qualifications?.join(", ") || "MBBS, MD"}
                  </div>
                  <div style={styles.docSpecialization}>
                    Specialist: {viewPrescription.doctorId?.specialization || "General Medicine"}
                  </div>
                </div>

                {/* Date slot */}
                <div style={{ textAlign: "right", fontSize: "0.8125rem", color: "hsl(var(--text-secondary))" }}>
                  <div>Date: <strong>{new Date(viewPrescription.createdAt).toDateString()}</strong></div>
                  {viewPrescription.appointmentId && (
                    <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                      ID: {viewPrescription.appointmentId.substring(18)}
                    </div>
                  )}
                </div>
              </div>

              {/* Patient Basic Grid info */}
              <div style={styles.a4PatientInfoBar}>
                <div style={styles.infoCol}>
                  Patient Name: <strong>{viewPrescription.patientId?.name}</strong>
                </div>
                <div style={styles.infoCol}>
                  Phone: <strong>{viewPrescription.patientId?.phone}</strong>
                </div>
                <div style={styles.infoCol}>
                  Gender: <strong style={{ textTransform: "capitalize" }}>{viewPrescription.patientId?.gender || "Male"}</strong>
                </div>
              </div>

              {/* Rx Symbol */}
              <div style={styles.rxSymbol}>Rx</div>

              {/* Medicines details table */}
              <div style={styles.prescriptionTableWrapper}>
                <table style={styles.presTable}>
                  <thead>
                    <tr style={styles.presThRow}>
                      <th style={{ ...styles.presTh, width: "35%" }}>Medicine / Drug</th>
                      <th style={styles.presTh}>Dosage</th>
                      <th style={styles.presTh}>Frequency</th>
                      <th style={styles.presTh}>Duration</th>
                      <th style={{ ...styles.presTh, width: "30%" }}>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewPrescription.medicines?.map((med, idx) => (
                      <tr key={idx} style={styles.presTr}>
                        <td style={{ ...styles.presTd, fontWeight: "700" }}>{med.name}</td>
                        <td style={styles.presTd}>{med.dosage}</td>
                        <td style={styles.presTd}>{med.frequency}</td>
                        <td style={styles.presTd}>{med.duration}</td>
                        <td style={styles.presTd}>{med.instructions || "Take as instructed"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Lab tests section */}
              {viewPrescription.labTests?.length > 0 && (
                <div style={styles.labTestsA4Block}>
                  <h4 style={styles.a4SubHeading}>Lab Investigations / Tests</h4>
                  <ul style={styles.labTestsA4List}>
                    {viewPrescription.labTests.map((test, idx) => (
                      <li key={idx} style={styles.labTestA4Item}>{test}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Follow up Date info */}
              {viewPrescription.followUpDate && (
                <div style={styles.a4FollowUp}>
                  <span>📅 Recommended Follow-up Consultation Date:</span>
                  <strong>{formatDate(viewPrescription.followUpDate)}</strong>
                </div>
              )}

              {/* Bottom notes and signatures */}
              {viewPrescription.notes && (
                <div style={styles.a4Notes}>
                  <span style={{ fontWeight: "700" }}>Doctor Notes:</span>
                  <p style={{ marginTop: "0.25rem", fontStyle: "italic" }}>{viewPrescription.notes}</p>
                </div>
              )}

              {/* Disclaimer footer */}
              <div style={styles.a4Disclaimer}>
                This document is a digitally compiled prescription issued under the secure protocols of ClinicBook.in.
              </div>
            </div>

            {/* View Paper footer */}
            <div style={styles.presPaperFooter}>
              <a 
                href={viewPrescription.pdfUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Download size={16} />
                <span>Download Printable PDF Document</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* 5. WRITE PRESCRIPTION FORM MODAL */}
      {writePrescApp && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: "680px" }} className="card animate-fade-in">
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Issue Medical Prescription</h2>
                <span style={styles.modalSubTitle}>
                  For {writePrescApp.patientId?.name} • Dr. {writePrescApp.doctorId?.name}
                </span>
              </div>
              <button style={styles.modalCloseBtn} onClick={closeWriteModal}>
                <X size={20} />
              </button>
            </div>

            {/* Success screen once submitted */}
            {successPrescription ? (
              <div style={styles.successScreen} className="animate-fade-in">
                <Check size={44} style={styles.successIcon} />
                <h3 style={styles.successTitle}>Prescription Compiled Successfully!</h3>
                <p style={styles.successDesc}>The clinical record is locked and the PDF statement uploaded to Cloudinary.</p>
                
                <div style={styles.successActions}>
                  <a 
                    href={successPrescription.pdfUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn btn-primary"
                    style={{ padding: "0.75rem 2rem" }}
                  >
                    <Download size={16} />
                    <span>Download Prescription PDF</span>
                  </a>
                  <button className="btn btn-secondary" onClick={closeWriteModal}>
                    Close Dialog
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPrescription} style={styles.modalForm}>
                {/* 1. Diagnosis */}
                <div className="form-group">
                  <label className="form-label">Diagnosis / Impression</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="Acute Bronchitis, Migraine Headaches, Hypertension control" 
                    value={diagnosis} 
                    onChange={(e) => setDiagnosis(e.target.value)} 
                  />
                </div>

                {/* 2. Medicines section */}
                <div style={styles.formSection}>
                  <div style={styles.sectionHeaderRow}>
                    <h3 style={styles.formSectionTitle}>Medications Prescribed</h3>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleAddMedicine}
                      style={{ padding: "0.25rem 0.625rem", fontSize: "0.75rem" }}
                    >
                      <PlusCircle size={14} />
                      <span>Add Drug Row</span>
                    </button>
                  </div>

                  <div style={styles.medsFormList}>
                    {medicines.map((med, idx) => (
                      <div key={idx} style={styles.medRowFlex}>
                        <div style={{ flex: 2 }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Medicine Name (e.g. Paracetamol 500mg)" 
                            value={med.name} 
                            onChange={(e) => handleMedicineChange(idx, "name", e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Dosage (e.g. 1 tab)" 
                            value={med.dosage} 
                            onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <select 
                            className="form-input" 
                            value={med.frequency} 
                            onChange={(e) => handleMedicineChange(idx, "frequency", e.target.value)}
                            style={{ marginBottom: 0 }}
                          >
                            <option value="Once daily">Once daily (1-0-0)</option>
                            <option value="Twice daily">Twice daily (1-0-1)</option>
                            <option value="Three times daily">Three times daily (1-1-1)</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="As needed">As needed (SOS)</option>
                            <option value="Before sleep">Before sleep</option>
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Duration (e.g. 5 days)" 
                            value={med.duration} 
                            onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                            required
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                        <div style={{ flex: 2 }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Instructions (e.g. Take after meals)" 
                            value={med.instructions} 
                            onChange={(e) => handleMedicineChange(idx, "instructions", e.target.value)}
                            style={{ marginBottom: 0 }}
                          />
                        </div>
                        
                        {/* Remove button */}
                        {medicines.length > 1 && (
                          <button 
                            type="button" 
                            style={styles.trashBtn} 
                            onClick={() => handleRemoveMedicine(idx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Lab Tests list */}
                <div style={styles.formSection}>
                  <div style={styles.sectionHeaderRow}>
                    <h3 style={styles.formSectionTitle}>Lab Investigations / Tests Requested</h3>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={handleAddLabTest}
                      style={{ padding: "0.25rem 0.625rem", fontSize: "0.75rem" }}
                    >
                      <PlusCircle size={14} />
                      <span>Add Test Row</span>
                    </button>
                  </div>

                  <div style={styles.labTestsFormList}>
                    {labTests.map((test, idx) => (
                      <div key={idx} style={styles.labRowFlex}>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Lab test name (e.g. Complete Blood Count, Liver Function Test)" 
                          value={test} 
                          onChange={(e) => handleLabTestChange(idx, e.target.value)}
                          style={{ marginBottom: 0, flex: 1 }}
                        />
                        {labTests.length > 1 && (
                          <button 
                            type="button" 
                            style={styles.trashBtn} 
                            onClick={() => handleRemoveLabTest(idx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Follow-up and Notes row */}
                <div style={styles.formRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Follow-up Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={followUpDate} 
                      onChange={(e) => setFollowUpDate(e.target.value)} 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Doctor Notes / Reminders</label>
                    <textarea 
                      className="form-input" 
                      placeholder="Drinking lots of warm water, bed rest for 2 days." 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                      style={styles.notesTextarea}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="btn btn-primary" 
                  style={styles.submitBtn}
                >
                  {isSubmitting ? (
                    <>
                      <div style={styles.miniSpinner}></div>
                      <span>Compiling Prescription and Uploading PDF...</span>
                    </>
                  ) : (
                    <span>Save and Generate PDF Statement</span>
                  )}
                </button>
              </form>
            )}
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
  quickWriteBtnWrapper: {
    display: "flex",
    alignItems: "center"
  },
  quickWriteSelect: {
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    marginBottom: 0,
    backgroundColor: "hsl(var(--teal-50))",
    borderColor: "hsl(var(--teal-200))",
    color: "hsl(var(--teal-800))",
    fontWeight: "600",
    borderRadius: "var(--radius-md)",
    cursor: "pointer"
  },
  searchCard: {
    padding: "1.25rem 1.5rem",
    backgroundColor: "hsl(var(--surface))"
  },
  searchWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "500px"
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "hsl(var(--text-secondary))"
  },
  searchInput: {
    paddingLeft: "2.5rem",
    width: "100%",
    marginBottom: 0
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
    color: "hsl(var(--text-secondary))"
  },
  presListFlex: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem"
  },
  presCard: {
    backgroundColor: "hsl(var(--surface))",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    transition: "transform 0.15s ease",
    ":hover": {
      transform: "translateY(-2px)"
    }
  },
  presCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.875rem",
    position: "relative"
  },
  presAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    color: "hsl(var(--teal-600))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  patientName: {
    fontSize: "0.95rem",
    fontWeight: "750",
    color: "hsl(var(--text-primary))"
  },
  doctorName: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))"
  },
  dateTag: {
    position: "absolute",
    right: 0,
    top: 0,
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "600"
  },
  presCardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  diagText: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-primary))"
  },
  medsCount: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))",
    fontWeight: "600"
  },
  presCardFooter: {
    display: "flex",
    gap: "0.5rem",
    borderTop: "1px solid hsl(var(--surface-border))",
    paddingTop: "0.75rem",
    marginTop: "auto"
  },
  modalBackdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(5px)",
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
    color: "hsl(var(--teal-600))"
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
    gap: "1.25rem"
  },
  formRow: {
    display: "flex",
    gap: "1rem"
  },
  formSection: {
    border: "1px solid hsl(var(--surface-border))",
    borderRadius: "var(--radius-md)",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    backgroundColor: "hsl(var(--background))"
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  formSectionTitle: {
    fontSize: "0.8125rem",
    fontWeight: "750",
    color: "hsl(var(--text-primary))",
    textTransform: "uppercase"
  },
  medsFormList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  },
  medRowFlex: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center"
  },
  labTestsFormList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  labRowFlex: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center"
  },
  trashBtn: {
    background: "none",
    border: "none",
    color: "hsl(var(--rose-500))",
    cursor: "pointer",
    padding: "0.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  notesTextarea: {
    height: "60px",
    resize: "none",
    marginBottom: 0
  },
  submitBtn: {
    width: "100%",
    padding: "0.875rem",
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginTop: "0.5rem"
  },
  successScreen: {
    padding: "3rem 1.5rem",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.25rem"
  },
  successIcon: {
    color: "hsl(var(--teal-500))",
    backgroundColor: "hsl(var(--teal-50))",
    padding: "0.75rem",
    borderRadius: "50%",
    boxShadow: "0 10px 20px rgba(13, 148, 136, 0.15)"
  },
  successTitle: {
    fontSize: "1.25rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))"
  },
  successDesc: {
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    maxWidth: "380px"
  },
  successActions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    width: "100%",
    maxWidth: "280px",
    marginTop: "1rem"
  },
  presPaperCard: {
    backgroundColor: "hsl(var(--surface))",
    width: "100%",
    maxWidth: "760px",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    borderRadius: "var(--radius-xl)",
    boxShadow: "var(--shadow-xl)",
    overflow: "hidden"
  },
  presPaperCloseBar: {
    padding: "1rem 1.5rem",
    borderBottom: "1px solid hsl(var(--surface-border))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "hsl(var(--background))"
  },
  presTitleHeader: {
    fontSize: "0.875rem",
    fontWeight: "750",
    color: "hsl(var(--teal-700))",
    textTransform: "uppercase"
  },
  closeBtnIcon: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "hsl(var(--text-secondary))"
  },
  a4Paper: {
    flex: 1,
    overflowY: "auto",
    padding: "3rem",
    backgroundColor: "white",
    color: "#334155",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "1.75rem"
  },
  a4ClinicHeader: {
    borderBottom: "2px solid #0d9488",
    paddingBottom: "1rem",
    textAlign: "center"
  },
  brandTitle: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#0d9488",
    letterSpacing: "-0.02em"
  },
  brandSub: {
    fontSize: "0.75rem",
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: "0.25rem"
  },
  a4DoctorPatientGrid: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "1rem"
  },
  docCredsBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  docNameTitle: {
    fontSize: "1.05rem",
    fontWeight: "800",
    color: "#0f172a"
  },
  docQualifications: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "#64748b"
  },
  docSpecialization: {
    fontSize: "0.8125rem",
    color: "#0d9488",
    fontWeight: "700"
  },
  a4PatientInfoBar: {
    display: "flex",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: "0.75rem 1.25rem",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "0.875rem"
  },
  infoCol: {
    color: "#475569"
  },
  rxSymbol: {
    fontSize: "2.25rem",
    fontWeight: "800",
    color: "#0d9488",
    fontFamily: "Georgia, serif"
  },
  prescriptionTableWrapper: {
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    overflow: "hidden"
  },
  presTable: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  presThRow: {
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0"
  },
  presTh: {
    padding: "0.75rem 1rem",
    fontSize: "0.75rem",
    fontWeight: "750",
    color: "#475569",
    textTransform: "uppercase"
  },
  presTr: {
    borderBottom: "1px solid #e2e8f0",
    ":last-child": {
      borderBottom: "none"
    }
  },
  presTd: {
    padding: "0.75rem 1rem",
    fontSize: "0.8125rem",
    color: "#334155"
  },
  labTestsA4Block: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  a4SubHeading: {
    fontSize: "0.875rem",
    fontWeight: "750",
    color: "#0f172a",
    textTransform: "uppercase",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "0.25rem"
  },
  labTestsA4List: {
    paddingLeft: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem"
  },
  labTestA4Item: {
    fontSize: "0.8125rem",
    color: "#334155",
    listStyleType: "square"
  },
  a4FollowUp: {
    fontSize: "0.875rem",
    color: "#0f172a",
    backgroundColor: "#f0fdfa",
    border: "1px dashed #5eead4",
    padding: "0.625rem 1rem",
    borderRadius: "6px",
    display: "flex",
    gap: "0.5rem"
  },
  a4Notes: {
    fontSize: "0.8125rem",
    color: "#475569",
    borderLeft: "3px solid #cbd5e1",
    paddingLeft: "0.75rem"
  },
  a4Disclaimer: {
    fontSize: "0.6875rem",
    color: "#94a3b8",
    textAlign: "center",
    marginTop: "auto",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "1rem"
  },
  presPaperFooter: {
    padding: "1.25rem",
    borderTop: "1px solid hsl(var(--surface-border))",
    backgroundColor: "hsl(var(--background))"
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
    `;
    document.head.appendChild(styleEl);
  };
  injectStyle();
}

export default PrescriptionsPage;
export { styles }; // Export styles to let other pages reuse them easily
