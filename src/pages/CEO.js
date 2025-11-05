import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function CEO({ token, onLogout, onCoachClick, onStudentClick }) {
  const [view, setView] = useState("overview"); // overview | students | coaches | centers
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

  async function addCenter() {
    await fetch("http://localhost:5000/centers", {
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
    await fetch("http://localhost:5000/users", {
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
      className="page admin-page"
      style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
    >
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
              <button onClick={() => setShowCoachForm((v) => !v)}>
                {showCoachForm ? "Cancel" : "Add Coach"}
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

          {view === "centers" && (
            <div>
              <React.Suspense fallback={<div>Loading...</div>}>
                <CentersAdmin
                  token={token}
                  onStudentClick={onStudentClick}
                  onCoachClick={onCoachClick}
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
        </div>
      </div>
    </div>
  );
}

// lazy load admin pages
const AllStudents = React.lazy(() => import("./AllStudents"));
const CoachesAdmin = React.lazy(() => import("./CoachesAdmin"));
const CentersAdmin = React.lazy(() => import("./CentersAdmin"));
const AttendanceHistory = React.lazy(() => import("./AttendanceHistory"));
