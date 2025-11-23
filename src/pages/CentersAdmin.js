import React, { useEffect, useState } from "react";

export default function CentersAdmin({
  token,
  onStudentClick,
  onCoachClick,
  onAdminClick,
  readOnly = false,
}) {
  const [centers, setCenters] = useState([]);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    fetchCenters();
  }, []);

  async function fetchCenters() {
    const res = await fetch("http://localhost:5000/centers", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setCenters([]);
    setCenters(await res.json());
  }

  async function createCenter() {
    await fetch("http://localhost:5000/centers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ name }),
    });
    setName("");
    fetchCenters();
  }

  async function openCenter(id) {
    setSelected(id);
    const sres = await fetch(`http://localhost:5000/centers/${id}/students`, {
      headers: { Authorization: "Bearer " + token },
    });
    const studs = sres.ok ? await sres.json() : [];
    setStudents(studs);
    const cres = await fetch(`http://localhost:5000/users/coaches`, {
      headers: { Authorization: "Bearer " + token },
    });
    const allcoaches = cres.ok ? await cres.json() : [];
    setCoaches(allcoaches.filter((c) => c.center && c.center.id === id));

    const ares = await fetch(`http://localhost:5000/users/admins`, {
      headers: { Authorization: "Bearer " + token },
    });
    const alladmins = ares.ok ? await ares.json() : [];
    setAdmins(alladmins.filter((a) => a.center && a.center.id === id));
  }

  if (selected)
    return (
      <div>
        <button onClick={() => setSelected(null)}>Back</button>
        <h3>Center Details</h3>
        <div>
          <b>Students</b>
        </div>
        <ul>
          {students.map((s) => (
            <li key={s.id}>
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
            </li>
          ))}
        </ul>
        <div>
          <b>Coaches</b>
        </div>
        <ul>
          {coaches.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => onCoachClick && onCoachClick(c.id)}
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
                {c.name}
              </button>
            </li>
          ))}
        </ul>
        <div>
          <b>Admins</b>
        </div>
        <ul>
          {admins.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => onAdminClick && onAdminClick(a.id)}
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
                {a.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div>
      <h2>Centers</h2>
      {!readOnly && (
        <>
          <input
            placeholder="New center name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={createCenter}>Create Center</button>
        </>
      )}
      <div className="centers-list-vertical">
        {centers.map((c) => (
          <div key={c.id} className="center-box card-vertical">
            <div>
              <strong>{c.name}</strong>
              <div className="muted">{c.address}</div>
            </div>
            <div>
              <button onClick={() => openCenter(c.id)}>Open</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
