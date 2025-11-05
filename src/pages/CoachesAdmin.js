import React, { useEffect, useState } from "react";
import CoachProfile from "./CoachProfile";
import SearchableList from "../components/SearchableList";
import Dialog from "../components/Dialog";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import "../components/SearchableList.css";
import "../components/StudentCard.css";
import "../components/CoachCard.css";

export default function CoachesAdmin({ token }) {
  const [coaches, setCoaches] = useState([]);
  const [centers, setCenters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    centerId: "",
  });
  const [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: "", data: null });
  const { toasts, success, error, removeToast } = useToast();

  useEffect(() => {
    fetchCoaches();
    fetchCenters();
  }, []);

  async function fetchCoaches() {
    const res = await fetch("http://localhost:5000/users/coaches", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setCoaches([]);
    setCoaches(await res.json());
  }
  async function fetchCenters() {
    const res = await fetch("http://localhost:5000/centers", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setCenters([]);
    setCenters(await res.json());
  }

  async function createCoach(e) {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          password: form.password,
          role: "COACH",
          center: form.centerId ? { id: Number(form.centerId) } : undefined,
          active: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to create coach");

      setForm({ name: "", username: "", password: "", centerId: "" });
      setShowForm(false);
      await fetchCoaches();
      success("Coach created successfully!");
    } catch (err) {
      error("Failed to create coach. Please try again.");
    }
  }

  if (selected)
    return (
      <div>
        <CoachProfile
          id={selected}
          token={token}
          onBack={() => setSelected(null)}
          embed={true}
        />
      </div>
    );

  const handleToggleActive = async (coach) => {
    setDialog({
      isOpen: true,
      type: "confirm",
      data: coach,
      title: `${coach.active ? "Deactivate" : "Activate"} Coach`,
      message: `Are you sure you want to ${
        coach.active ? "deactivate" : "activate"
      } ${coach.name}?`,
      onConfirm: async () => {
        await fetch(`http://localhost:5000/users/${coach.id}/active`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ active: !coach.active }),
        });
        fetchCoaches();
      },
    });
  };

  const renderCoach = (coach) => (
    <div key={coach.id} className="student-card coach-card clickable">
      <div className="profile-header">
        <div className="profile-avatar small">
          {coach.image ? (
            <img
              src={`http://localhost:5000/uploads/${coach.image}`}
              alt={coach.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            coach.name.charAt(0)
          )}
        </div>
        <h3>{coach.name}</h3>
        <div className={`status-badge ${coach.active ? "active" : "inactive"}`}>
          {coach.active ? "Active" : "Inactive"}
        </div>
      </div>
      <div className="profile-info">
        <span>Username: {coach.username}</span>
        <span>Center: {coach.center?.name || "-"}</span>
      </div>
      <div className="card-actions">
        <button onClick={() => setSelected(coach.id)} className="action-button">
          View Profile
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleActive(coach);
          }}
          className={`action-button ${coach.active ? "danger" : "success"}`}
        >
          {coach.active ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <h2>Coaches</h2>
      <button onClick={() => setShowForm((s) => !s)} className="action-button">
        {showForm ? "Cancel" : "Add Coach"}
      </button>
      {showForm && (
        <form onSubmit={createCoach} className="add-form">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            required
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
          />
          <input
            required
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
          />
          <select
            value={form.centerId}
            onChange={(e) =>
              setForm((f) => ({ ...f, centerId: e.target.value }))
            }
          >
            <option value="">Select Center</option>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit">Create</button>
        </form>
      )}

      <div className="list-grid">
        {coaches.map((co) => (
          <div key={co.id} className="coach-box card-small">
            <div className="coach-left">
              <div className="coach-avatar">{co.name.charAt(0)}</div>
              <div>
                <strong>{co.name}</strong>
                <div className="muted">{co.center?.name || "No center"}</div>
              </div>
            </div>
            <div className="coach-right">
              <button onClick={() => setSelected(co.id)}>View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
