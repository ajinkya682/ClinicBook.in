import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Plus, 
  Grid, 
  List, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Activity, 
  ArrowRight, 
  X,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import api from "../../lib/api.js";

/**
 * Premium Patients Management Page with Search Debounce, View Toggles, Add Modal, and Quick Side Panel
 */
const PatientsPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Search, Pagination, View Mode state
  const [searchVal, setSearchVal] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
  const [page, setPage] = useState(1);

  // Modals & Panels state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [quickPatient, setQuickPatient] = useState(null);

  // New Patient Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("male");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [allergies, setAllergies] = useState("");

  // Debouncing hook - 300ms delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Query paginated patients from API
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["patients:list", debouncedSearch, page],
    queryFn: async () => {
      const response = await api.get("/patients", {
        params: { search: debouncedSearch, page, limit: 10 }
      });
      return response.data || { patients: [], total: 0 };
    }
  });

  const patientsList = data?.patients || [];
  const totalCount = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Handle Form Submit
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        phone,
        email,
        dateOfBirth: dateOfBirth || undefined,
        gender,
        bloodGroup,
        address,
        allergies: allergies ? allergies.split(",").map(a => a.trim()) : []
      };

      await api.post("/patients", payload);
      queryClient.invalidateQueries({ queryKey: ["patients:list"] });

      // Reset states
      setIsAddModalOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      setDateOfBirth("");
      setGender("male");
      setBloodGroup("");
      setAddress("");
      setAllergies("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to register patient.");
    }
  };

  // Safe Date Formatter helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "Never Visited";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div style={styles.container}>
      {/* 1. Header controls section */}
      <section style={styles.topActionBar}>
        <h1 style={styles.pageTitle}>Patients Directory</h1>
        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} />
          <span>Add New Patient</span>
        </button>
      </section>

      {/* 2. Search, Toggles, Stats Row */}
      <section className="card" style={styles.controlsCard}>
        <div style={styles.controlsRow}>
          {/* Search Patient with icon */}
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search patients by name or phone..." 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Grid/Table Toggle */}
          <div style={styles.viewToggleGroup}>
            <button 
              style={{
                ...styles.toggleBtn,
                ...(viewMode === "table" ? styles.toggleBtnActive : {})
              }}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <List size={18} />
            </button>
            <button 
              style={{
                ...styles.toggleBtn,
                ...(viewMode === "grid" ? styles.toggleBtnActive : {})
              }}
              onClick={() => setViewMode("grid")}
              title="Grid Cards"
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Patients Data Presentation */}
      {isLoading ? (
        <div style={styles.loaderArea}>
          <div style={styles.spinner}></div>
          <span>Loading patient profiles...</span>
        </div>
      ) : isError ? (
        <div style={styles.errorArea} className="card">
          <span>Failed to retrieve database patient logs. Please try again.</span>
        </div>
      ) : patientsList.length === 0 ? (
        <div style={styles.emptyArea} className="card">
          <span>No patients registered matching current search conditions.</span>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW RENDER */
        <section className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Phone Number</th>
                  <th style={styles.th}>Email Address</th>
                  <th style={styles.th}>Last Visit</th>
                  <th style={styles.th}>Total Visits</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {patientsList.map((p) => (
                  <tr key={p._id} style={styles.tr} onClick={() => setQuickPatient(p)}>
                    <td style={{ ...styles.td, fontWeight: "600", color: "hsl(var(--text-primary))" }}>{p.name}</td>
                    <td style={styles.td}>{p.phone}</td>
                    <td style={styles.td}>{p.email || "N/A"}</td>
                    <td style={styles.td}>{formatDate(p.lastVisit)}</td>
                    <td style={styles.td}>
                      <span style={styles.visitsBadge}>{p.totalVisits || 0} visits</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/patients/${p._id}`);
                        }}
                        style={styles.actionBtn}
                      >
                        <span>Full Profile</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* GRID VIEW RENDER */
        <section style={styles.gridContainer}>
          {patientsList.map((p) => (
            <div key={p._id} style={styles.gridCard} className="card" onClick={() => setQuickPatient(p)}>
              <div style={styles.cardHeader}>
                <div style={styles.avatarInitials}>
                  {p.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <h3 style={styles.cardName}>{p.name}</h3>
                  <span style={styles.cardGender}>{p.gender || "unspecified"}</span>
                </div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.cardInfoItem}>
                  <Phone size={14} />
                  <span>{p.phone}</span>
                </div>
                {p.email && (
                  <div style={styles.cardInfoItem}>
                    <Mail size={14} />
                    <span style={styles.cardTextTruncate}>{p.email}</span>
                  </div>
                )}
                <div style={styles.cardInfoItem}>
                  <Calendar size={14} />
                  <span>Last Visit: {formatDate(p.lastVisit)}</span>
                </div>
              </div>
              <div style={styles.cardFooter}>
                <span style={styles.cardVisitsCount}>{p.totalVisits || 0} visits</span>
                <button 
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/patients/${p._id}`);
                  }}
                  style={styles.cardBtn}
                >
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* 4. Pagination Footer bar */}
      {!isLoading && totalPages > 1 && (
        <div style={styles.paginationRow}>
          <button 
            disabled={page === 1} 
            className="btn btn-secondary" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span style={styles.pageIndicator}>Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            className="btn btn-secondary" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      {/* 5. Quick Info Side Drawer panel */}
      {quickPatient && (
        <div style={styles.panelBackdrop} onClick={() => setQuickPatient(null)}>
          <div style={styles.sidePanel} onClick={(e) => e.stopPropagation()} className="animate-slide-in">
            <div style={styles.panelHeader}>
              <h2 style={styles.panelTitle}>Quick View Details</h2>
              <button style={styles.panelCloseBtn} onClick={() => setQuickPatient(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.panelBody}>
              <div style={styles.panelHero}>
                <div style={styles.heroAvatar}>
                  {quickPatient.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <h3 style={styles.heroName}>{quickPatient.name}</h3>
                <span style={styles.heroSubText}>Patient ID: {quickPatient._id}</span>
              </div>

              {/* Personal details info list */}
              <div style={styles.panelSection}>
                <h4 style={styles.panelSubTitle}>Personal Details</h4>
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <Phone size={14} />
                    <span>{quickPatient.phone}</span>
                  </div>
                  {quickPatient.email && (
                    <div style={styles.detailItem}>
                      <Mail size={14} />
                      <span>{quickPatient.email}</span>
                    </div>
                  )}
                  {quickPatient.address && (
                    <div style={styles.detailItem}>
                      <MapPin size={14} />
                      <span>{quickPatient.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Health overview status */}
              <div style={styles.panelSection}>
                <h4 style={styles.panelSubTitle}>Health Status</h4>
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <span style={{ fontWeight: "700" }}>Blood Group:</span>
                    <span>{quickPatient.bloodGroup || "Not specified"}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={{ fontWeight: "700", color: "hsl(var(--rose-500))" }}>Allergies:</span>
                    <span>
                      {Array.isArray(quickPatient.allergies) && quickPatient.allergies.length > 0 
                        ? quickPatient.allergies.join(", ") 
                        : "No known drug/food allergies"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* View Full Profile action */}
            <div style={styles.panelFooter}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setQuickPatient(null);
                  navigate(`/dashboard/patients/${quickPatient._id}`);
                }}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <span>Open Full Interactive Profile</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Register Patient Modal */}
      {isAddModalOpen && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard} className="card animate-fade-in">
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Register New Patient Card</h2>
              <button style={styles.modalCloseBtn} onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="patient-name">Patient Full Name</label>
                  <input 
                    id="patient-name"
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="Aditya Birla" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="patient-phone">Mobile Phone Number</label>
                  <input 
                    id="patient-phone"
                    type="tel" 
                    required 
                    className="form-input" 
                    placeholder="9876543210" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="patient-email">Email Address</label>
                  <input 
                    id="patient-email"
                    type="email" 
                    className="form-input" 
                    placeholder="aditya@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="patient-dob">Date of Birth</label>
                  <input 
                    id="patient-dob"
                    type="date" 
                    className="form-input" 
                    value={dateOfBirth} 
                    onChange={(e) => setDateOfBirth(e.target.value)} 
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="patient-gender">Gender Identity</label>
                  <select 
                    id="patient-gender"
                    className="form-input" 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label" htmlFor="patient-blood">Blood Group</label>
                  <input 
                    id="patient-blood"
                    type="text" 
                    className="form-input" 
                    placeholder="O+ / B-" 
                    value={bloodGroup} 
                    onChange={(e) => setBloodGroup(e.target.value)} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="patient-address">Home Address</label>
                <input 
                  id="patient-address"
                  type="text" 
                  className="form-input" 
                  placeholder="Street name, City, Landmark" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="patient-allergies">Allergies (Comma separated)</label>
                <input 
                  id="patient-allergies"
                  type="text" 
                  className="form-input" 
                  placeholder="Penicillin, Sulfa drugs, Peanuts" 
                  value={allergies} 
                  onChange={(e) => setAllergies(e.target.value)} 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
                Register Patient Record
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
  controlsCard: {
    padding: "1.25rem 1.5rem",
    backgroundColor: "hsl(var(--surface))"
  },
  controlsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap"
  },
  searchWrapper: {
    position: "relative",
    flex: "1 1 360px",
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
    width: "100%"
  },
  viewToggleGroup: {
    display: "flex",
    borderRadius: "var(--radius-md)",
    overflow: "hidden",
    border: "1px solid hsl(var(--surface-border))",
    backgroundColor: "hsl(var(--background))"
  },
  toggleBtn: {
    padding: "0.5rem 0.875rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "hsl(var(--text-secondary))",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease"
  },
  toggleBtnActive: {
    backgroundColor: "hsl(var(--teal-500))",
    color: "white"
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
  errorArea: {
    padding: "3rem",
    color: "hsl(var(--rose-500))",
    textAlign: "center"
  },
  emptyArea: {
    padding: "4rem 2rem",
    textAlign: "center",
    color: "hsl(var(--text-secondary))"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  thRow: {
    backgroundColor: "hsl(var(--background))",
    borderBottom: "1px solid hsl(var(--surface-border))"
  },
  th: {
    padding: "1rem 1.5rem",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "hsl(var(--text-secondary))",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  tr: {
    borderBottom: "1px solid hsl(var(--surface-border))",
    cursor: "pointer",
    transition: "background-color 0.15s ease"
  },
  td: {
    padding: "1rem 1.5rem",
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))",
    verticalAlign: "middle"
  },
  visitsBadge: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--teal-700))",
    backgroundColor: "hsl(var(--teal-50))",
    padding: "0.25rem 0.625rem",
    borderRadius: "9999px"
  },
  actionBtn: {
    padding: "0.375rem 0.75rem",
    fontSize: "0.75rem",
    gap: "0.25rem"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "1.5rem"
  },
  gridCard: {
    backgroundColor: "hsl(var(--surface))",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    cursor: "pointer"
  },
  cardHeader: {
    display: "flex",
    gap: "1rem",
    alignItems: "center"
  },
  avatarInitials: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "hsl(var(--teal-500))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    fontWeight: "700"
  },
  cardName: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "hsl(var(--text-primary))"
  },
  cardGender: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))",
    textTransform: "capitalize"
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  cardInfoItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8125rem",
    color: "hsl(var(--text-secondary))"
  },
  cardTextTruncate: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "180px"
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid hsl(var(--surface-border))",
    paddingTop: "0.875rem",
    marginTop: "0.25rem"
  },
  cardVisitsCount: {
    fontSize: "0.75rem",
    fontWeight: "600",
    color: "hsl(var(--text-secondary))"
  },
  cardBtn: {
    padding: "0.3rem 0.625rem",
    fontSize: "0.75rem"
  },
  paginationRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1.5rem",
    marginTop: "1rem"
  },
  pageIndicator: {
    fontSize: "0.875rem",
    fontWeight: "600",
    color: "hsl(var(--text-secondary))"
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
    maxWidth: "420px",
    height: "100%",
    backgroundColor: "hsl(var(--surface))",
    boxShadow: "var(--shadow-xl)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  panelHeader: {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid hsl(var(--surface-border))",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  panelTitle: {
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
  panelHero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "0.5rem"
  },
  heroAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "hsl(var(--teal-500))",
    color: "white",
    fontSize: "1.5rem",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 20px rgba(13, 148, 136, 0.15)"
  },
  heroName: {
    fontSize: "1.25rem",
    fontWeight: "800",
    color: "hsl(var(--text-primary))",
    letterSpacing: "-0.02em"
  },
  heroSubText: {
    fontSize: "0.75rem",
    color: "hsl(var(--text-secondary))"
  },
  panelSection: {
    display: "flex",
    flexDirection: "column"
  },
  panelSubTitle: {
    fontSize: "0.8125rem",
    fontWeight: "700",
    color: "hsl(var(--teal-700))",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid hsl(var(--surface-border))",
    paddingBottom: "0.375rem",
    marginBottom: "0.75rem"
  },
  detailsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem"
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    fontSize: "0.875rem",
    color: "hsl(var(--text-secondary))"
  },
  panelFooter: {
    padding: "1.25rem",
    borderTop: "1px solid hsl(var(--surface-border))",
    backgroundColor: "hsl(var(--background))"
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
    maxWidth: "540px",
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
    gap: "1rem"
  },
  submitBtn: {
    width: "100%",
    padding: "0.875rem",
    fontSize: "0.95rem",
    marginTop: "0.5rem"
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
      .tr:hover {
        background-color: hsl(var(--background)) !important;
      }
    `;
    document.head.appendChild(styleEl);
  };
  injectStyle();
}

export default PatientsPage;
