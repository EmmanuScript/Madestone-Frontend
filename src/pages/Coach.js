import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { useToastContext } from "../components/ToastProvider";
import "../styles/coach-background.css";

export default function Coach({
  token,
  onLogout,
  onStudentClick,
  onCoachClick,
  userId,
  onShowCenterStudents,
  hideNavButtons = false,
}) {
  const [students, setStudents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [centerId, setCenterId] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({}); // { studentId: true/false }
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    fetchCoachAndStudents();
  }, [userId]);

  async function fetchCoachAndStudents() {
    setLoading(true);
    // get coach info to determine center
    try {
      let uid = userId;
      if (!uid && token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          uid = payload.sub;
        } catch (e) {
          // ignore
        }
      }
      if (uid) {
        const ures = await fetch(`${API_BASE_URL}/users/${uid}`, {
          headers: { Authorization: "Bearer " + token },
        });
        if (ures.ok) {
          const u = await ures.json();
          const cid = u.center && u.center.id;
          if (cid) {
            // fetch students for this center directly
            await fetchStudentsForCenter(cid);
            setCenterId(cid);
            // Also fetch coaches from the same center
            await fetchCoaches(cid);
            return;
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch coach info", e);
    } finally {
      setLoading(false);
    }
    // fallback: try to fetch students normally (will likely be empty)
    fetchStudents();
  }

  async function fetchCoaches(cid) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/coaches`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        const allCoaches = await res.json();
        // Filter coaches by center
        const centerCoaches = allCoaches.filter(
          (coach) => coach.center?.id === cid
        );
        setCoaches(centerCoaches);
      }
    } catch (e) {
      console.error("Failed to fetch coaches", e);
    }
  }

  async function fetchStudentsForCenter(cid) {
    const res = await fetch(`${API_BASE_URL}/centers/${cid}/students`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setStudents([]);
    const all = await res.json();
    // Filter out inactive students
    const activeStudents = all.filter((student) => student.active !== false);
    // Sort students by category first, then by name
    const sortedStudents = activeStudents.sort((a, b) => {
      const categoryCompare = (a.category || "").localeCompare(
        b.category || ""
      );
      if (categoryCompare !== 0) return categoryCompare;
      return (a.name || "").localeCompare(b.name || "");
    });
    setStudents(sortedStudents);
  }

  async function fetchStudents() {
    if (!centerId) return setStudents([]);
    const res = await fetch(`${API_BASE_URL}/centers/${centerId}/students`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setStudents([]);
    const all = await res.json();
    // Filter out inactive students
    const activeStudents = all.filter((student) => student.active !== false);
    // Sort students by category first, then by name
    const sortedStudents = activeStudents.sort((a, b) => {
      const categoryCompare = (a.category || "").localeCompare(
        b.category || ""
      );
      if (categoryCompare !== 0) return categoryCompare;
      return (a.name || "").localeCompare(b.name || "");
    });
    setStudents(sortedStudents);
  }

  function toggleAttendance(studentId) {
    setAttendanceStatus((prev) => {
      const currentStatus = prev[studentId];
      if (currentStatus === undefined || currentStatus === false) {
        // Mark as present
        return { ...prev, [studentId]: true };
      } else {
        // Mark as absent
        return { ...prev, [studentId]: false };
      }
    });
  }

  async function submitAttendance() {
    const today = new Date().toISOString().slice(0, 10);
    setSubmitting(true);

    try {
      // Submit attendance for all students with a status set
      const promises = Object.entries(attendanceStatus).map(
        ([studentId, present]) => {
          return fetch(`${API_BASE_URL}/attendance/mark`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
              studentId: Number(studentId),
              date: today,
              present: present,
            }),
          });
        }
      );

      await Promise.all(promises);

      // Clear attendance status after successful submit
      setAttendanceStatus({});
      success("Attendance submitted successfully!");
      fetchStudents();
    } catch (err) {
      showError("Failed to submit attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasAttendanceData = Object.keys(attendanceStatus).length > 0;

  return (
    <>
      <div className="page coach-page-wrapper">
        <div className="card">
          {!hideNavButtons && (
            <button style={{ float: "right" }} onClick={onLogout}>
              Logout
            </button>
          )}
          <h2>Coach Dashboard</h2>

          {!hideNavButtons && (
            <div
              style={{
                marginBottom: 20,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {onCoachClick && userId && (
                <button onClick={() => onCoachClick(userId)}>
                  View My Profile
                </button>
              )}
              {onShowCenterStudents && (
                <button onClick={onShowCenterStudents}>
                  View All Center Students
                </button>
              )}
            </div>
          )}

          {coaches.length > 0 && !hideNavButtons && (
            <div style={{ marginBottom: 20 }}>
              <h3>Other Coaches at My Center</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {coaches
                  .filter((coach) => coach.id !== Number(userId))
                  .map((coach) => (
                    <button
                      key={coach.id}
                      onClick={() => onCoachClick && onCoachClick(coach.id)}
                      style={{
                        background: "rgba(199, 244, 100, 0.1)",
                        border: "1px solid rgba(199, 244, 100, 0.3)",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        color: "#c7f464",
                      }}
                    >
                      {coach.name || coach.username}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <h3>Students</h3>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading students...</p>
            </div>
          )}

          {!loading && students.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>No Students Found</h3>
              <p>There are no active students assigned to your center yet.</p>
            </div>
          )}

          {!loading && students.length > 0 && (
            <table className="students">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Category</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const status = attendanceStatus[s.id];
                  const statusText =
                    status === true
                      ? "Present"
                      : status === false
                      ? "Absent"
                      : "-";
                  const statusBg =
                    status === true
                      ? "#d4f4dd"
                      : status === false
                      ? "#ffd4d4"
                      : "transparent";

                  return (
                    <tr key={s.id}>
                      <td>
                        <button
                          onClick={() => onStudentClick && onStudentClick(s.id)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            margin: 0,
                            color: "#2a7",
                            textDecoration: "underline",
                            cursor: "pointer",
                          }}
                        >
                          {s.name}
                        </button>
                      </td>
                      <td>{s.age}</td>
                      <td>{s.category}</td>
                      <td>{s.amountPaid}</td>
                      <td>{s.amountDue}</td>
                      <td
                        style={{
                          background: statusBg,
                          fontWeight: "bold",
                          color:
                            status === true
                              ? "green"
                              : status === false
                              ? "red"
                              : "#999",
                        }}
                      >
                        {statusText}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleAttendance(s.id)}
                          style={{
                            background: status === true ? "#ff9800" : "#4caf50",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          {status === true ? "Mark Absent" : "Mark Present"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && hasAttendanceData && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                onClick={submitAttendance}
                disabled={submitting}
                style={{
                  background: "#2196F3",
                  color: "white",
                  border: "none",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "6px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit Attendance"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
