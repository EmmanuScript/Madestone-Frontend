import React, { useEffect, useState } from "react";
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

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
        const ures = await fetch(`http://localhost:5000/users/${uid}`, {
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
      const res = await fetch(`http://localhost:5000/users/coaches`, {
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
    const res = await fetch(`http://localhost:5000/centers/${cid}/students`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setStudents([]);
    const all = await res.json();
    // Filter out inactive students
    const activeStudents = all.filter((student) => student.active !== false);
    setStudents(activeStudents);
  }

  async function fetchStudents() {
    if (!centerId) return setStudents([]);
    const res = await fetch(
      `http://localhost:5000/centers/${centerId}/students`,
      {
        headers: { Authorization: "Bearer " + token },
      }
    );
    if (!res.ok) return setStudents([]);
    const all = await res.json();
    // Filter out inactive students
    const activeStudents = all.filter((student) => student.active !== false);
    setStudents(activeStudents);
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
          return fetch("http://localhost:5000/attendance/mark", {
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

  function openPaymentModal(s) {
    setPaymentStudent(s);
    setPaymentAmount("");
    setPaymentModalOpen(true);
  }

  async function submitPayment() {
    if (!paymentStudent) return;
    const num = Number(paymentAmount);
    if (isNaN(num) || num <= 0) {
      showError("Enter a valid amount greater than 0");
      return;
    }
    setPaymentSubmitting(true);
    try {
      const res = await fetch(
        `http://localhost:5000/students/${paymentStudent.id}/payment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ amount: num }),
        }
      );
      if (!res.ok) throw new Error("Payment failed");
      success("Payment recorded successfully");
      setPaymentModalOpen(false);
      setPaymentStudent(null);
      setPaymentAmount("");
      fetchStudents();
    } catch (e) {
      showError("Failed to record payment");
    } finally {
      setPaymentSubmitting(false);
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
                            marginRight: "4px",
                          }}
                        >
                          {status === true ? "Mark Absent" : "Mark Present"}
                        </button>
                        <button onClick={() => openPaymentModal(s)}>
                          Add Payment
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

      {paymentModalOpen && (
        <div
          className="dialog-overlay"
          onClick={() => setPaymentModalOpen(false)}
        >
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-icon confirm">₦</div>
            <h3>Record Payment</h3>
            <p>{paymentStudent ? `Student: ${paymentStudent.name}` : ""}</p>
            <div style={{ marginBottom: 16 }}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#fff",
                }}
              />
            </div>
            <div className="dialog-actions">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="dialog-button cancel"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                className="dialog-button confirm"
                disabled={paymentSubmitting}
              >
                {paymentSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
