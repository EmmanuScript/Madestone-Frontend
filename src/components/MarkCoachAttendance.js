import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import { useToastContext } from "./ToastProvider";

export default function MarkCoachAttendance({ token, userId, onCoachClick }) {
  const [coaches, setCoaches] = useState([]);
  const [centerId, setCenterId] = useState(null);
  const [centers, setCenters] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isCEO, setIsCEO] = useState(false);
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    fetchUserAndCoaches();
  }, [userId]);

  useEffect(() => {
    if (centerId) {
      fetchCoachesForCenter(centerId);
    }
  }, [centerId]);

  async function fetchUserAndCoaches() {
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

          // For non-CEO users (Admin), use their assigned center
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

  async function fetchCoachesForCenter(cid) {
    const res = await fetch(`${API_BASE_URL}/users/coaches`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setCoaches([]);
    const all = await res.json();
    // Filter coaches by center and active status
    const centerCoaches = all.filter(
      (coach) =>
        coach.active !== false && coach.center && coach.center.id === cid
    );
    setCoaches(centerCoaches);
  }

  function toggleAttendance(coachId) {
    setAttendanceStatus((prev) => {
      const currentStatus = prev[coachId];
      if (currentStatus === undefined || currentStatus === false) {
        return { ...prev, [coachId]: true };
      } else {
        return { ...prev, [coachId]: false };
      }
    });
  }

  async function submitAttendance() {
    const today = new Date().toISOString().slice(0, 10);
    setSubmitting(true);

    try {
      const promises = Object.entries(attendanceStatus).map(
        ([coachId, present]) => {
          return fetch(`${API_BASE_URL}/coach-attendance/mark`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
              coachId: Number(coachId),
              date: today,
              present: present,
            }),
          });
        }
      );

      await Promise.all(promises);
      setAttendanceStatus({});
      success("Coach attendance submitted successfully!");
      if (centerId) {
        fetchCoachesForCenter(centerId);
      }
    } catch (err) {
      showError("Failed to submit coach attendance. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasAttendanceData = Object.keys(attendanceStatus).length > 0;

  return (
    <div>
      <h3>Mark Coach Attendance</h3>
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
            <th>Coach Name</th>
            <th>Center</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {coaches.map((coach) => {
            const status = attendanceStatus[coach.id];
            const statusBg =
              status === true
                ? "#d4f4dd"
                : status === false
                ? "#ffd4d4"
                : "transparent";

            return (
              <tr key={coach.id} style={{ background: statusBg }}>
                <td>
                  <button
                    onClick={() => onCoachClick && onCoachClick(coach.id)}
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
                    {coach.name}
                  </button>
                </td>
                <td>{coach.center?.name || "-"}</td>
                <td>
                  {status === true
                    ? "Present"
                    : status === false
                    ? "Absent"
                    : "Not Marked"}
                </td>
                <td>
                  <button onClick={() => toggleAttendance(coach.id)}>
                    Mark {status === true ? "Absent" : "Present"}
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
            {submitting ? "Submitting..." : "Submit Coach Attendance"}
          </button>
        </div>
      )}
    </div>
  );
}
