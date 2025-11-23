import React, { useEffect, useState } from "react";

export default function CoachAttendanceHistory({ token, onCoachClick }) {
  const [centers, setCenters] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [centerId, setCenterId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCenters();
    fetchCoaches();
  }, []);

  async function fetchCenters() {
    const res = await fetch("http://localhost:5000/centers", {
      headers: { Authorization: "Bearer " + token },
    });
    setCenters(await res.json());
  }

  async function fetchCoaches() {
    const res = await fetch("http://localhost:5000/users/coaches", {
      headers: { Authorization: "Bearer " + token },
    });
    setCoaches(await res.json());
  }

  function daysBetween(s, e) {
    if (!s || !e) return 0;
    const a = new Date(s);
    const b = new Date(e);
    const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  }

  const fetchAttendance = async () => {
    setError(null);
    if (!centerId) return setError("Select a center first");
    if (!start || !end) return setError("Start and end dates are required");
    const diff = daysBetween(start, end);
    if (diff > 31)
      return setError(
        "Max allowed range is 1 month. Use export for larger ranges."
      );

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/coach-attendance/center/${centerId}?start=${start}&end=${end}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      if (!res.ok) throw new Error("Failed to fetch coach attendance");
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const exportCenter = async () => {
    if (!centerId) return setError("Select a center to export");
    if (!start || !end)
      return setError("Start and end dates are required for export");
    try {
      const res = await fetch(
        `http://localhost:5000/coach-attendance/export/center/${centerId}?start=${start}&end=${end}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      if (!res.ok) throw new Error("Export failed");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coach-attendance-center-${centerId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Export failed");
    }
  };

  // Group records by coach
  const groupedData = {};
  const allDates = new Set();

  records.forEach((record) => {
    const coachId = record.coach?.id;
    const coachName = record.coach?.name || "Unknown";
    const centerName = record.coach?.center?.name || "-";
    const date = record.date;

    if (!groupedData[coachId]) {
      groupedData[coachId] = {
        id: coachId,
        name: coachName,
        center: centerName,
        dates: {},
      };
    }

    groupedData[coachId].dates[date] = record.present ? "✓" : "✗";
    allDates.add(date);
  });

  const sortedDates = Array.from(allDates).sort();
  const coachesData = Object.values(groupedData);

  const coachesForCenter = centerId
    ? coaches.filter((c) => c.center?.id === Number(centerId))
    : coaches;

  return (
    <div>
      <h3>Coach Attendance History</h3>

      <div
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <select value={centerId} onChange={(e) => setCenterId(e.target.value)}>
          <option value="">-- Select center --</option>
          {centers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label>
          From
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={fetchAttendance}
          disabled={loading}
          style={{ padding: "8px 24px", minWidth: "120px" }}
        >
          Fetch
        </button>

        <button
          onClick={exportCenter}
          style={{ padding: "8px 24px", minWidth: "120px" }}
        >
          Export (CSV)
        </button>
      </div>

      {error && <div style={{ color: "#b00" }}>{error}</div>}

      {loading && <div>Loading...</div>}

      {!loading && coachesData.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "600px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "2px solid #333",
                    padding: "8px",
                    position: "sticky",
                    left: 0,
                    background: "#f5f5f5",
                    color: "#111",
                    zIndex: 10,
                  }}
                >
                  Coach Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "2px solid #333",
                    padding: "8px",
                    background: "#f5f5f5",
                    color: "#111",
                  }}
                >
                  Center
                </th>
                {sortedDates.map((date) => (
                  <th
                    key={date}
                    style={{
                      borderBottom: "2px solid #333",
                      padding: "8px",
                      textAlign: "center",
                      background: "#f5f5f5",
                      color: "#111",
                      minWidth: "80px",
                    }}
                  >
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coachesData.map((coach) => (
                <tr key={coach.id}>
                  <td
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #ddd",
                      position: "sticky",
                      left: 0,
                      background: "#fff",
                      zIndex: 5,
                    }}
                  >
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
                  <td
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #ddd",
                      background: "#fff",
                    }}
                  >
                    {coach.center}
                  </td>
                  {sortedDates.map((date) => {
                    const mark = coach.dates[date] || "-";
                    const bg =
                      mark === "✓"
                        ? "#d4f4dd"
                        : mark === "✗"
                        ? "#ffd4d4"
                        : "transparent";
                    return (
                      <td
                        key={date}
                        style={{
                          padding: "8px",
                          textAlign: "center",
                          borderBottom: "1px solid #ddd",
                          background: bg,
                        }}
                      >
                        {mark}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading &&
        !error &&
        coachesData.length === 0 &&
        records.length === 0 && (
          <div style={{ color: "#666", marginTop: 12 }}>
            No attendance records found for the selected criteria.
          </div>
        )}

      {!loading && centerId && coachesForCenter.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h4>Coaches in Selected Center</h4>
          <ul>
            {coachesForCenter.map((coach) => (
              <li key={coach.id}>
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
                {" - "}
                {coach.center?.name || "No center"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
