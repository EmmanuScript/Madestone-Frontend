import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { useToastContext } from "../components/ToastProvider";
import Sidebar from "../components/Sidebar";
import PasswordInput from "../components/PasswordInput";
import "../styles/ceo-background.css";
import "../styles/preferences.css";

export default function CEO({
  token,
  onLogout,
  onCoachClick,
  onStudentClick,
  onAdminClick,
}) {
  const [view, setView] = useState(() => {
    return localStorage.getItem("ceoView") || "overview";
  });
  const [centers, setCenters] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [centerName, setCenterName] = useState("");
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [coachForm, setCoachForm] = useState({
    name: "",
    username: "",
    password: "",
    centerId: "",
    birthMonthDay: "",
  });

  // Preferences state
  const [prefLoading, setPrefLoading] = useState(false);
  const [sessionFeeInput, setSessionFeeInput] = useState("");
  const [sessionNameInput, setSessionNameInput] = useState("");
  const [currentPref, setCurrentPref] = useState({
    sessionFee: 0,
    sessionName: "",
  });

  // Password change state
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { success, error: showError } = useToastContext();

  // Persist view state to localStorage
  useEffect(() => {
    localStorage.setItem("ceoView", view);
  }, [view]);

  useEffect(() => {
    fetchCenters();
    fetchCoaches();
  }, []);

  async function fetchCenters() {
    const res = await fetch(`${API_BASE_URL}/centers`, {
      headers: { Authorization: "Bearer " + token },
    });
    setCenters(await res.json());
  }
  async function fetchCoaches() {
    const res = await fetch(`${API_BASE_URL}/users/coaches`, {
      headers: { Authorization: "Bearer " + token },
    });
    setCoaches(await res.json());
  }

  async function fetchPreference() {
    try {
      setPrefLoading(true);
      console.log(
        "[fetchPreference] Fetching from:",
        `${API_BASE_URL}/preferences`
      );
      const res = await fetch(`${API_BASE_URL}/preferences`, {
        headers: { Authorization: "Bearer " + token },
      });
      console.log("[fetchPreference] Response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("[fetchPreference] Data received:", data);
        setCurrentPref({
          sessionFee: data.sessionFee || 0,
          sessionName: data.sessionName || "",
        });
        setSessionFeeInput(String(data.sessionFee || ""));
        setSessionNameInput(data.sessionName || "");
      } else {
        console.error("[fetchPreference] Response not OK:", res.status);
      }
    } catch (e) {
      console.error("[fetchPreference] Exception:", e);
    } finally {
      setPrefLoading(false);
    }
  }

  useEffect(() => {
    if (view === "preferences") {
      fetchPreference();
      fetchAllUsers();
    }
  }, [view]);

  async function fetchAllUsers() {
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        const users = await res.json();
        // Filter to only show coaches and admins
        const filteredUsers = users.filter(
          (u) => u.role === "COACH" || u.role === "ADMIN"
        );
        setAllUsers(filteredUsers);
      }
    } catch (e) {
      // ignore
    }
  }

  async function updateSessionFee() {
    const fee = Number(sessionFeeInput);
    if (isNaN(fee) || fee < 0) {
      showError("Enter a valid non-negative fee");
      return;
    }
    try {
      console.log("[updateSessionFee] Sending:", { sessionFee: fee });
      const res = await fetch(`${API_BASE_URL}/preferences/session-fee`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ sessionFee: fee }),
      });
      console.log("[updateSessionFee] Response status:", res.status);
      if (!res.ok) {
        const errText = await res.text();
        console.error("[updateSessionFee] Error response:", errText);
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      console.log("[updateSessionFee] Response data:", data);
      setCurrentPref({
        sessionFee: data.sessionFee || 0,
        sessionName: data.sessionName || "",
      });
      success("Session fee updated and applied to all students");
    } catch (e) {
      console.error("[updateSessionFee] Exception:", e);
      showError(e.message || "Failed to update session fee");
    }
  }

  async function updateSessionName() {
    const name = sessionNameInput.trim();
    try {
      console.log("[updateSessionName] Sending:", { sessionName: name });
      const res = await fetch(`${API_BASE_URL}/preferences/session-name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ sessionName: name }),
      });
      console.log("[updateSessionName] Response status:", res.status);
      if (!res.ok) {
        const errText = await res.text();
        console.error("[updateSessionName] Error response:", errText);
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      console.log("[updateSessionName] Response data:", data);
      setCurrentPref({
        sessionFee: data.sessionFee || 0,
        sessionName: data.sessionName || "",
      });
      success("Session name saved");
    } catch (e) {
      console.error("[updateSessionName] Exception:", e);
      showError(e.message || "Failed to update session name");
    }
  }

  async function resetSession() {
    if (
      !window.confirm(
        "Reset session? This will zero payments and set due to session fee."
      )
    )
      return;
    try {
      console.log("[resetSession] Resetting session...");
      const res = await fetch(`${API_BASE_URL}/preferences/reset-session`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      console.log("[resetSession] Response status:", res.status);
      if (!res.ok) {
        const errText = await res.text();
        console.error("[resetSession] Error response:", errText);
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      const data = await res.json();
      console.log("[resetSession] Response data:", data);
      success("Session reset: all payments cleared and dues set");
      // Refresh preferences after reset
      fetchPreference();
    } catch (e) {
      console.error("[resetSession] Exception:", e);
      showError(e.message || "Failed to reset session");
    }
  }

  async function changeUserPassword() {
    if (!selectedUserId) {
      showError("Please select a user");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      showError("Password must be at least 4 characters");
      return;
    }

    const selectedUser = allUsers.find((u) => u.id === Number(selectedUserId));
    const confirmMsg = `Change password for ${selectedUser?.name} (${selectedUser?.username})?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setPasswordLoading(true);
      const res = await fetch(
        `${API_BASE_URL}/users/${selectedUserId}/change-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ newPassword }),
        }
      );
      if (res.ok) {
        success(`Password changed for ${selectedUser?.name}`);
        setSelectedUserId("");
        setNewPassword("");
      } else {
        const errData = await res.json();
        showError(errData.message || "Failed to change password");
      }
    } catch (e) {
      showError("Error: " + e.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  async function addCenter() {
    await fetch(`${API_BASE_URL}/centers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ name: centerName }),
    });
    setCenterName("");
    fetchCenters();
  }

  async function createCoach(e) {
    e.preventDefault();
    await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        name: coachForm.name,
        username: coachForm.username,
        password: coachForm.password,
        role: "COACH",
        center: coachForm.centerId
          ? { id: Number(coachForm.centerId) }
          : undefined,
        birthMonthDay: coachForm.birthMonthDay,
        active: true,
      }),
    });
    setCoachForm({
      name: "",
      username: "",
      password: "",
      centerId: "",
      birthMonthDay: "",
    });
    setShowCoachForm(false);
    fetchCoaches();
  }

  return (
    <div
      className="page admin-page ceo-page-wrapper"
      style={{
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
        position: "relative",
      }}
    >
      {/* Logo at top right */}
      <img
        src="https://res.cloudinary.com/dysavifkn/image/upload/v1762470525/YyUeno01_gahjvf.svg"
        alt="Logo"
        className="ceo-logo"
      />

      <aside style={{ minWidth: 200 }}>
        <Sidebar view={view} setView={setView} onLogout={onLogout} />
      </aside>
      <div style={{ flex: 1 }}>
        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2>CEO Dashboard</h2>
            </div>
          </div>

          {view === "overview" && (
            <div>
              <h3>Centers</h3>
              <input
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                placeholder="New center name"
              />
              <button onClick={addCenter}>Create Center</button>
              <ul>
                {centers.map((c) => (
                  <li key={c.id}>{c.name}</li>
                ))}
              </ul>

              <h3>Coaches</h3>
              <button
                onClick={() => setShowCoachForm((v) => !v)}
                className={showCoachForm ? "btn-secondary" : ""}
              >
                {showCoachForm ? "❌ Cancel" : "➕ Add Coach"}
              </button>
              {showCoachForm && (
                <form onSubmit={createCoach} style={{ margin: "12px 0" }}>
                  <input
                    required
                    placeholder="Name"
                    value={coachForm.name}
                    onChange={(e) =>
                      setCoachForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                  <input
                    required
                    placeholder="Username"
                    value={coachForm.username}
                    onChange={(e) =>
                      setCoachForm((f) => ({ ...f, username: e.target.value }))
                    }
                  />
                  <input
                    required
                    placeholder="Password"
                    type="password"
                    value={coachForm.password}
                    onChange={(e) =>
                      setCoachForm((f) => ({ ...f, password: e.target.value }))
                    }
                  />
                  <select
                    required
                    value={coachForm.centerId}
                    onChange={(e) =>
                      setCoachForm((f) => ({ ...f, centerId: e.target.value }))
                    }
                  >
                    <option value="">Select Center</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Birthdate (MM-DD)"
                    value={coachForm.birthMonthDay}
                    onChange={(e) =>
                      setCoachForm((f) => ({
                        ...f,
                        birthMonthDay: e.target.value,
                      }))
                    }
                  />
                  <button type="submit">Create Coach</button>
                </form>
              )}
              <ul>
                {coaches.map((co) => (
                  <li key={co.id}>
                    <a
                      href="#"
                      onClick={() => onCoachClick(co.id)}
                      style={{ color: "#2a7", textDecoration: "underline" }}
                    >
                      {co.name}
                    </a>
                    {" - " +
                      (co.center?.name || "No center") +
                      " - " +
                      (co.active ? "Active" : "Inactive")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {view === "students" && (
            <div>
              {/* Lazy load the AllStudents admin page */}
              <React.Suspense fallback={<div>Loading...</div>}>
                <AllStudents token={token} />
              </React.Suspense>
            </div>
          )}

          {view === "coaches" && (
            <div>
              <React.Suspense fallback={<div>Loading...</div>}>
                <CoachesAdmin token={token} />
              </React.Suspense>
            </div>
          )}

          {view === "admins" && (
            <div>
              <React.Suspense fallback={<div>Loading...</div>}>
                <AdminsAdmin token={token} />
              </React.Suspense>
            </div>
          )}

          {view === "centers" && (
            <div>
              <React.Suspense fallback={<div>Loading...</div>}>
                <CentersAdmin
                  token={token}
                  onStudentClick={onStudentClick}
                  onCoachClick={onCoachClick}
                  onAdminClick={onAdminClick}
                />
              </React.Suspense>
            </div>
          )}

          {view === "attendance-history" && (
            <div>
              <React.Suspense fallback={<div>Loading...</div>}>
                <AttendanceHistory
                  token={token}
                  onStudentClick={onStudentClick}
                />
              </React.Suspense>
            </div>
          )}

          {view === "mark-attendance" && (
            <div>
              <React.Suspense fallback={<div>Loading...</div>}>
                <MarkAttendance
                  token={token}
                  userId={localStorage.getItem("userId")}
                  onStudentClick={onStudentClick}
                />
              </React.Suspense>
            </div>
          )}

          {view === "coach-attendance" && (
            <div>
              <React.Suspense fallback={<div>Loading...</div>}>
                <MarkCoachAttendance
                  token={token}
                  userId={localStorage.getItem("userId")}
                  onCoachClick={onCoachClick}
                />
              </React.Suspense>
            </div>
          )}

          {view === "coach-attendance-history" && (
            <div>
              <React.Suspense fallback={<div>Loading...</div>}>
                <CoachAttendanceHistory
                  token={token}
                  onCoachClick={onCoachClick}
                />
              </React.Suspense>
            </div>
          )}

          {view === "preferences" && (
            <div>
              <h2>System Preferences</h2>
              {prefLoading && (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p className="loading-text">Loading preferences...</p>
                </div>
              )}
              {!prefLoading && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "20px",
                    marginTop: "24px",
                  }}
                >
                  <div className="preference-card">
                    <div
                      className="preference-icon"
                      style={{
                        background: "linear-gradient(135deg, #4caf50, #66bb6a)",
                      }}
                    >
                      ₦
                    </div>
                    <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                      Session Fee
                    </h3>
                    <div className="preference-current">
                      Current:{" "}
                      <span
                        style={{
                          color: "var(--lime)",
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        ₦{currentPref.sessionFee.toLocaleString()}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.6)",
                        margin: "8px 0 16px",
                      }}
                    >
                      Setting a new fee will update the amount due for all
                      students
                    </p>
                    <input
                      type="number"
                      min="0"
                      value={sessionFeeInput}
                      onChange={(e) => setSessionFeeInput(e.target.value)}
                      placeholder="Enter new session fee"
                    />
                    <button
                      onClick={updateSessionFee}
                      style={{ width: "100%", marginTop: 12 }}
                    >
                      💰 Update Session Fee
                    </button>
                  </div>

                  <div className="preference-card">
                    <div
                      className="preference-icon"
                      style={{
                        background: "linear-gradient(135deg, #2196f3, #42a5f5)",
                      }}
                    >
                      📝
                    </div>
                    <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                      Session Name
                    </h3>
                    <div className="preference-current">
                      Current:{" "}
                      <span
                        style={{
                          color: "var(--lime)",
                          fontWeight: 700,
                          fontSize: 16,
                        }}
                      >
                        {currentPref.sessionName || "(not set)"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.6)",
                        margin: "8px 0 16px",
                      }}
                    >
                      Give your current session a memorable name
                    </p>
                    <input
                      value={sessionNameInput}
                      onChange={(e) => setSessionNameInput(e.target.value)}
                      placeholder="e.g., Spring 2025, Term 1"
                    />
                    <button
                      onClick={updateSessionName}
                      style={{ width: "100%", marginTop: 12 }}
                    >
                      ✏️ Save Session Name
                    </button>
                  </div>

                  <div className="preference-card preference-card-danger">
                    <div
                      className="preference-icon"
                      style={{
                        background: "linear-gradient(135deg, #ff4757, #ff6b6b)",
                      }}
                    >
                      ⚠️
                    </div>
                    <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                      Reset Session
                    </h3>
                    <p
                      style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.8)",
                        margin: "12px 0 16px",
                        lineHeight: 1.5,
                      }}
                    >
                      This will reset all students:
                    </p>
                    <ul
                      style={{
                        textAlign: "left",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.7)",
                        marginBottom: 20,
                        paddingLeft: 24,
                      }}
                    >
                      <li>
                        Amount Paid → <strong>₦0</strong>
                      </li>
                      <li>
                        Amount Due →{" "}
                        <strong>
                          ₦{currentPref.sessionFee.toLocaleString()}
                        </strong>
                      </li>
                    </ul>
                    <button
                      className="btn-danger"
                      onClick={resetSession}
                      style={{ width: "100%", marginTop: "auto" }}
                    >
                      🔄 Reset All Students
                    </button>
                  </div>

                  <div className="preference-card">
                    <div
                      className="preference-icon"
                      style={{
                        background: "linear-gradient(135deg, #9c27b0, #ba68c8)",
                      }}
                    >
                      🔐
                    </div>
                    <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                      Change User Password
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.6)",
                        margin: "8px 0 16px",
                      }}
                    >
                      Reset password for coaches or admins who forgot their
                      credentials
                    </p>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      style={{ marginBottom: 12 }}
                    >
                      <option value="">Select User</option>
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role}) - {u.username}
                        </option>
                      ))}
                    </select>
                    <PasswordInput
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      name="newPassword"
                    />
                    <button
                      onClick={changeUserPassword}
                      disabled={
                        !selectedUserId || !newPassword || passwordLoading
                      }
                      style={{ width: "100%", marginTop: 0 }}
                    >
                      {passwordLoading ? "Changing..." : "🔑 Change Password"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// lazy load admin pages
const AllStudents = React.lazy(() => import("./AllStudents"));
const CoachesAdmin = React.lazy(() => import("./CoachesAdmin"));
const AdminsAdmin = React.lazy(() => import("./AdminsAdmin"));
const CentersAdmin = React.lazy(() => import("./CentersAdmin"));
const AttendanceHistory = React.lazy(() => import("./AttendanceHistory"));
const MarkAttendance = React.lazy(() => import("../components/MarkAttendance"));
const MarkCoachAttendance = React.lazy(() =>
  import("../components/MarkCoachAttendance")
);
const CoachAttendanceHistory = React.lazy(() =>
  import("./CoachAttendanceHistory")
);
