import React, { useEffect, useState, Suspense } from "react";
import Sidebar from "../components/Sidebar";
import { API_BASE_URL } from "../config/api";
import { useToastContext } from "../components/ToastProvider";
import "../styles/admin-background.css";

// Lazy load admin pages
const AllStudents = React.lazy(() => import("./AllStudents"));
const CoachesAdmin = React.lazy(() => import("./CoachesAdmin"));
const CentersAdmin = React.lazy(() => import("./CentersAdmin"));
const AttendanceHistory = React.lazy(() => import("./AttendanceHistory"));
const MarkCoachAttendance = React.lazy(() =>
  import("../components/MarkCoachAttendance")
);
const CoachAttendanceHistory = React.lazy(() =>
  import("./CoachAttendanceHistory")
);

export default function Admin({
  token,
  onLogout,
  onCoachClick,
  onStudentClick,
  onAdminClick,
  userId,
}) {
  const [view, setView] = useState(() => {
    return localStorage.getItem("adminView") || "overview";
  });
  const [students, setStudents] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [centerId, setCenterId] = useState(null);
  const { success, error: showError } = useToastContext();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem("adminView", view);
  }, [view]);

  useEffect(() => {
    if (view === "mark-attendance") {
      fetchStudentsForCenter();
    }
  }, [view]);

  async function fetchStudentsForCenter() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/centers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const centers = await res.json();
        if (centers.length > 0) {
          setCenterId(centers[0].id);
          const studentsRes = await fetch(
            `${API_BASE_URL}/centers/${centers[0].id}/students`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (studentsRes.ok) {
            const all = await studentsRes.json();
            const activeStudents = all.filter(
              (student) => student.active !== false
            );
            setStudents(activeStudents);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch students", e);
    } finally {
      setLoading(false);
    }
  }

  function toggleAttendance(studentId) {
    setAttendanceStatus((prev) => {
      const currentStatus = prev[studentId];
      if (currentStatus === undefined || currentStatus === false) {
        return { ...prev, [studentId]: true };
      } else {
        return { ...prev, [studentId]: false };
      }
    });
  }

  async function submitAttendance() {
    const today = new Date().toISOString().slice(0, 10);
    setSubmitting(true);

    try {
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

      setAttendanceStatus({});
      success("Attendance submitted successfully!");
      fetchStudentsForCenter();
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
        `${API_BASE_URL}/students/${paymentStudent.id}/payment`,
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
      fetchStudentsForCenter();
    } catch (e) {
      showError("Failed to record payment");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  const hasAttendanceData = Object.keys(attendanceStatus).length > 0;

  function renderView() {
    switch (view) {
      case "students":
        return (
          <Suspense fallback={<div>Loading students...</div>}>
            <AllStudents token={token} />
          </Suspense>
        );
      case "coaches":
        return (
          <Suspense fallback={<div>Loading coaches...</div>}>
            <CoachesAdmin token={token} readOnly={true} />
          </Suspense>
        );
      case "centers":
        return (
          <Suspense fallback={<div>Loading centers...</div>}>
            <CentersAdmin
              token={token}
              onStudentClick={onStudentClick}
              onCoachClick={onCoachClick}
              onAdminClick={onAdminClick}
              readOnly={true}
            />
          </Suspense>
        );
      case "attendance-history":
        return (
          <Suspense fallback={<div>Loading attendance...</div>}>
            <AttendanceHistory token={token} onStudentClick={onStudentClick} />
          </Suspense>
        );
      case "mark-attendance":
        return (
          <div>
            <h3>Mark Attendance</h3>
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
                <p>There are no active students assigned yet.</p>
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
                            onClick={() =>
                              onStudentClick && onStudentClick(s.id)
                            }
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
                              background:
                                status === true ? "#ff9800" : "#4caf50",
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

            {paymentModalOpen && (
              <div
                className="dialog-overlay"
                onClick={() => setPaymentModalOpen(false)}
              >
                <div className="dialog" onClick={(e) => e.stopPropagation()}>
                  <div className="dialog-icon confirm">₦</div>
                  <h3>Record Payment</h3>
                  <p>
                    {paymentStudent ? `Student: ${paymentStudent.name}` : ""}
                  </p>
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
          </div>
        );
      case "coach-attendance":
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <MarkCoachAttendance
              token={token}
              userId={userId}
              onCoachClick={onCoachClick}
            />
          </Suspense>
        );
      case "coach-attendance-history":
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <CoachAttendanceHistory token={token} onCoachClick={onCoachClick} />
          </Suspense>
        );
      case "overview":
      default:
        return (
          <div>
            <h2>Admin Dashboard</h2>
            <p>Welcome to the Admin Panel. You have access to:</p>
            <ul style={{ lineHeight: "1.8", marginTop: "1rem" }}>
              <li>✓ View and manage all students</li>
              <li>✓ View all coaches</li>
              <li>✓ View all centers</li>
              <li>✓ View attendance history</li>
              <li>✓ Mark attendance for students</li>
              <li>✓ Mark attendance for coaches</li>
              <li>✓ View coach attendance history</li>
            </ul>
            <p style={{ marginTop: "1.5rem", color: "#eaffd6" }}>
              Select an option from the sidebar to get started.
            </p>
          </div>
        );
    }
  }

  return (
    <div
      className="page admin-page admin-page-wrapper"
      style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
    >
      <aside style={{ minWidth: 200 }}>
        <Sidebar
          view={view}
          setView={setView}
          onLogout={onLogout}
          userRole="ADMIN"
        />
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
              <h2>Admin Dashboard</h2>
            </div>
          </div>

          {renderView()}
        </div>
      </div>
    </div>
  );
}
