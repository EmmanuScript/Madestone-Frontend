import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { useToastContext } from "./ToastProvider";
import "./Dialog.css";

export default function MarkAttendance({ token, userId, onStudentClick }) {
  const [students, setStudents] = useState([]);
  const [centerId, setCenterId] = useState(null);
  const [centers, setCenters] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isCEO, setIsCEO] = useState(false);
  const { success, error: showError } = useToastContext();

  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    fetchUserAndStudents();
  }, [userId]);

  useEffect(() => {
    if (centerId) {
      fetchStudentsForCenter(centerId);
    }
  }, [centerId]);

  async function fetchUserAndStudents() {
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

          // Check if user is CEO
          if (u.role === "CEO") {
            setIsCEO(true);
            await fetchAllCenters();
            return;
          }

          // For non-CEO users, use their assigned center
          const cid = u.center && u.center.id;
          if (cid) {
            setCenterId(cid);
            return;
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch user info", e);
    }
  }

  async function fetchAllCenters() {
    try {
      const res = await fetch(`${API_BASE_URL}/centers`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        const data = await res.json();
        setCenters(data);
        // Auto-select first center if available
        if (data.length > 0) {
          setCenterId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch centers", e);
    }
  }

  async function fetchStudentsForCenter(cid) {
    try {
      const res = await fetch(`${API_BASE_URL}/centers/${cid}/students`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) return setStudents([]);
      const all = await res.json();
      // Filter out inactive students
      const activeStudents = all.filter((student) => student.active !== false);
      setStudents(activeStudents);
    } catch (e) {
      console.error("Failed to fetch students for center", e);
      setStudents([]);
    }
  }

  function toggleAttendance(studentId) {
    setAttendanceStatus((prev) => {
      const currentStatus = prev[studentId];
      // Cycle through: undefined -> true (present) -> false (absent) -> undefined
      if (currentStatus === undefined) {
        return { ...prev, [studentId]: true };
      } else if (currentStatus === true) {
        return { ...prev, [studentId]: false };
      } else {
        const newState = { ...prev };
        delete newState[studentId];
        return newState;
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
      if (centerId) {
        fetchStudentsForCenter(centerId);
      }
    } catch (err) {
      showError("Failed to submit attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditingPayment(studentId) {
    setEditingPayment(studentId);
    setPaymentAmount("");
  }

  async function submitPayment(studentId) {
    if (!studentId) {
      showError("No student selected");
      return;
    }
    const num = Number(paymentAmount);
    if (isNaN(num) || num <= 0) {
      showError("Enter a valid amount greater than 0");
      return;
    }
    setPaymentSubmitting(true);
    try {
      console.log("Submitting payment:", {
        studentId: studentId,
        amount: num,
        apiUrl: `${API_BASE_URL}/students/${studentId}/payment`,
      });

      const res = await fetch(`${API_BASE_URL}/students/${studentId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ amount: num }),
      });

      console.log("Payment response status:", res.status);

      if (!res.ok) {
        let errorData = {};
        try {
          errorData = await res.json();
          console.error("Payment error response:", errorData);
        } catch (parseErr) {
          console.error("Could not parse error response:", parseErr);
          const text = await res.text();
          console.error("Error response text:", text);
        }
        throw new Error(
          errorData.message || `Payment failed with status ${res.status}`
        );
      }

      const responseData = await res.json();
      console.log("Payment success response:", responseData);

      success("Payment recorded successfully");
      setEditingPayment(null);
      setPaymentAmount("");
      if (centerId) fetchStudentsForCenter(centerId);
    } catch (e) {
      console.error("Payment error:", e);
      showError(
        e.message || "Failed to record payment. Check console for details."
      );
    } finally {
      setPaymentSubmitting(false);
    }
  }

  const hasAttendanceData = Object.keys(attendanceStatus).length > 0;

  return (
    <div>
      <h3>Mark Attendance</h3>
      {isCEO && centers.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="center-select"
            style={{ marginRight: 10, fontWeight: "bold" }}
          >
            Select Center:
          </label>
          <select
            id="center-select"
            value={centerId || ""}
            onChange={(e) => setCenterId(Number(e.target.value))}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          >
            {centers.map((center) => (
              <option key={center.id} value={center.id}>
                {center.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <table className="students">
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th>Category</th>
            <th>Paid</th>
            <th>Due</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const status = attendanceStatus[s.id];
            const statusText =
              status === true ? "Present" : status === false ? "Absent" : "-";
            const statusBg =
              status === true
                ? "#d4f4dd"
                : status === false
                ? "#ffd4d4"
                : "transparent";

            const isEditingThisPayment = editingPayment === s.id;

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
                <td>
                  {isEditingThisPayment ? (
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Amount"
                        autoFocus
                        style={{
                          width: "80px",
                          padding: "4px 6px",
                          fontSize: "14px",
                          borderRadius: "4px",
                          border: "1px solid #2a7",
                          background: "rgba(255, 255, 255, 0.1)",
                          color: "#fff",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitPayment(s.id);
                          if (e.key === "Escape") {
                            setEditingPayment(null);
                            setPaymentAmount("");
                          }
                        }}
                      />
                      <button
                        onClick={() => submitPayment(s.id)}
                        disabled={paymentSubmitting}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          background: "#2a7",
                          border: "none",
                          color: "#fff",
                          cursor: paymentSubmitting ? "not-allowed" : "pointer",
                          opacity: paymentSubmitting ? 0.6 : 1,
                          borderRadius: "4px",
                        }}
                      >
                        {paymentSubmitting ? "..." : "✓"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPayment(null);
                          setPaymentAmount("");
                        }}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          background: "#ff4646",
                          border: "none",
                          color: "#fff",
                          cursor: "pointer",
                          borderRadius: "4px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span
                      onClick={() => startEditingPayment(s.id)}
                      style={{ cursor: "pointer" }}
                      title="Click to add payment"
                    >
                      {s.amountPaid}
                    </span>
                  )}
                </td>
                <td>{s.amountDue}</td>
                <td>
                  <button
                    onClick={() => toggleAttendance(s.id)}
                    style={{
                      background:
                        status === true
                          ? "#4caf50"
                          : status === false
                          ? "#ff9800"
                          : "transparent",
                      color: status ? "white" : "inherit",
                      border: "1px solid #ccc",
                      padding: "6px 12px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: status ? "bold" : "normal",
                    }}
                  >
                    {statusText}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasAttendanceData && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={submitAttendance}
            disabled={submitting}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              background: "#2a7",
              color: "#fff",
              border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit Attendance"}
          </button>
        </div>
      )}
    </div>
  );
}
