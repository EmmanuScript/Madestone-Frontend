import React, { useEffect, useState } from "react";

export default function Coach({
  token,
  onLogout,
  onStudentClick,
  userId,
  onShowCenterStudents,
}) {
  const [students, setStudents] = useState([]);
  const [centerId, setCenterId] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState({}); // { studentId: true/false }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCoachAndStudents();
  }, [userId]);

  async function fetchCoachAndStudents() {
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
            return;
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch coach info", e);
    }
    // fallback: try to fetch students normally (will likely be empty)
    fetchStudents();
  }

  async function fetchStudentsForCenter(cid) {
    const res = await fetch(`http://localhost:5000/centers/${cid}/students`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setStudents([]);
    const all = await res.json();
    setStudents(all);
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
    setStudents(all);
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
      alert("Attendance submitted successfully!");
      fetchStudents();
    } catch (err) {
      alert("Failed to submit attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function pay(s) {
    const amt = prompt("Amount to add to paid:", "0");
    if (!amt) return;
    await fetch(`http://localhost:5000/students/${s.id}/payment`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ amount: Number(amt) }),
    });
    fetchStudents();
  }

  const hasAttendanceData = Object.keys(attendanceStatus).length > 0;

  return (
    <div className="page">
      <div className="card">
        <button style={{ float: "right" }} onClick={onLogout}>
          Logout
        </button>
        <h2>Coach Dashboard</h2>
        <h3>Students</h3>
        <button onClick={onShowCenterStudents} style={{ marginBottom: 10 }}>
          View all center students
        </button>
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
                status === true ? "Present" : status === false ? "Absent" : "-";
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
                    <button onClick={() => pay(s)}>Add Payment</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {hasAttendanceData && (
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
  );
}
