import React, { useEffect, useState } from "react";

export default function AttendanceHistory({ token, onStudentClick }) {
  const [centers, setCenters] = useState([]);
  const [students, setStudents] = useState([]);
  const [centerId, setCenterId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCenters();
    fetchStudents();
  }, []);

  async function fetchCenters() {
    const res = await fetch("http://localhost:5000/centers", {
      headers: { Authorization: "Bearer " + token },
    });
    setCenters(await res.json());
  }

  async function fetchStudents() {
    const res = await fetch("http://localhost:5000/students", {
      headers: { Authorization: "Bearer " + token },
    });
    setStudents(await res.json());
  }

  function daysBetween(s, e) {
    if (!s || !e) return 0;
    const a = new Date(s);
    const b = new Date(e);
    const diff = Math.ceil((b - a) / (1000 * 60 * 60 * 24)) + 1; // inclusive
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
        `http://localhost:5000/attendance/center/${centerId}?start=${start}&end=${end}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      if (!res.ok) throw new Error("Failed to fetch attendance");
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
    // allow export for any range
    try {
      const res = await fetch(
        `http://localhost:5000/attendance/export/center/${centerId}?start=${start}&end=${end}`,
        { headers: { Authorization: "Bearer " + token } }
      );
      if (!res.ok) throw new Error("Export failed");
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-center-${centerId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Export failed");
    }
  };

  // Group records by student
  const groupedData = {};
  const allDates = new Set();

  records.forEach((record) => {
    const studentId = record.student?.id;
    const studentName = record.student?.name || "Unknown";
    const centerName = record.student?.center?.name || "-";
    const category = record.student?.category || "-";
    const date = record.date;

    if (!groupedData[studentId]) {
      groupedData[studentId] = {
        id: studentId,
        name: studentName,
        center: centerName,
        category: category,
        dates: {},
      };
    }

    groupedData[studentId].dates[date] = record.present ? "✓" : "✗";
    allDates.add(date);
  });

  const sortedDates = Array.from(allDates).sort();
  const studentsData = Object.values(groupedData);

  const studentsForCenter = centerId
    ? students.filter((s) => s.center?.id === Number(centerId))
    : students;

  return (
    <div>
      <h3>Student Attendance History</h3>

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

        <button onClick={fetchAttendance} disabled={loading}>
          Fetch
        </button>

        <button onClick={exportCenter} style={{ marginLeft: 8 }}>
          Export (CSV)
        </button>
      </div>

      {error && <div style={{ color: "#b00" }}>{error}</div>}

      {loading && <div>Loading...</div>}

      {!loading && studentsData.length > 0 && (
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
                  Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "2px solid #333",
                    padding: "8px",
                  }}
                >
                  Center
                </th>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "2px solid #333",
                    padding: "8px",
                  }}
                >
                  Category
                </th>
                {sortedDates.map((date) => (
                  <th
                    key={date}
                    style={{
                      textAlign: "center",
                      borderBottom: "2px solid #333",
                      padding: "8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentsData.map((student, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                  <td
                    style={{
                      padding: "8px",
                      fontWeight: "500",
                      position: "sticky",
                      left: 0,
                      background: "#f5f5f5",
                      zIndex: 5,
                    }}
                  >
                    <button
                      onClick={() =>
                        onStudentClick && onStudentClick(student.id)
                      }
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        color: "#2a7",
                        textDecoration: "underline",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      {student.name}
                    </button>
                  </td>
                  <td style={{ padding: "8px" }}>{student.center}</td>
                  <td style={{ padding: "8px" }}>{student.category}</td>
                  {sortedDates.map((date) => (
                    <td
                      key={date}
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        color:
                          student.dates[date] === "✓"
                            ? "green"
                            : student.dates[date] === "✗"
                            ? "red"
                            : "#ccc",
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}
                    >
                      {student.dates[date] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && studentsData.length === 0 && records.length === 0 && (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          No attendance records found. Select a center and date range, then
          click Fetch.
        </div>
      )}
    </div>
  );
}
