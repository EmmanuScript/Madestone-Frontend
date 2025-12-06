import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";
import CoachProfile from "./CoachProfile";
import SearchableList from "../components/SearchableList";
import PasswordInput from "../components/PasswordInput";
import Dialog from "../components/Dialog";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import "../components/SearchableList.css";
import "../components/StudentCard.css";
import "../components/CoachCard.css";

export default function CoachesAdmin({ token, readOnly = false }) {
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
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCoaches();
    fetchCenters();
  }, []);

  async function fetchCoaches() {
    const res = await fetch(`${API_BASE_URL}/users/coaches`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setCoaches([]);
    const data = await res.json();
    setCoaches(data.sort((a, b) => (a.name || "").localeCompare(b.name || "")));
  }
  async function fetchCenters() {
    const res = await fetch(`${API_BASE_URL}/centers`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setCenters([]);
    setCenters(await res.json());
  }

  function validateForm() {
    const errs = {};
    if (!form.name || form.name.trim().length < 2) {
      errs.name = "Name is required";
    }
    if (!form.username || form.username.trim().length < 3) {
      errs.username = "Username is required";
    }
    if (!form.password || form.password.length < 4) {
      errs.password = "Password must be at least 4 characters";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function createCoach(e) {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
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
        await fetch(`${API_BASE_URL}/users/${coach.id}/active`, {
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
              src={`${API_BASE_URL}/uploads/${coach.image}`}
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
      {!readOnly && (
        <button
          onClick={() => setShowForm((s) => !s)}
          className="action-button"
        >
          {showForm ? "Cancel" : "Add Coach"}
        </button>
      )}
      {showForm && !readOnly && (
        <form onSubmit={createCoach} className="add-form">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {formErrors.name && (
            <div className="error" style={{ color: "#b00" }}>
              {formErrors.name}
            </div>
          )}
          <input
            required
            placeholder="Username"
            value={form.username}
            onChange={(e) =>
              setForm((f) => ({ ...f, username: e.target.value }))
            }
          />
          {formErrors.username && (
            <div className="error" style={{ color: "#b00" }}>
              {formErrors.username}
            </div>
          )}
          <PasswordInput
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password (min 4 characters)"
            name="password"
          />
          {formErrors.password && (
            <div className="error" style={{ color: "#b00" }}>
              {formErrors.password}
            </div>
          )}
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

      <div className="coaches-list-vertical">
        {coaches.map((co) => (
          <div key={co.id} className="coach-box card-vertical">
            <div className="coach-left">
              <div className="coach-avatar">{co.name.charAt(0)}</div>
              <div>
                <strong>{co.name}</strong>
                <div className="muted">
                  Center: {co.center?.name || "No center"}
                </div>
                {co.birthMonthDay && (
                  <div className="muted">DOB: {co.birthMonthDay}</div>
                )}
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
