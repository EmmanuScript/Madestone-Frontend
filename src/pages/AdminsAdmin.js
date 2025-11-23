import React, { useEffect, useState } from "react";
import AdminProfile from "./AdminProfile";
import Dialog from "../components/Dialog";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import "../components/SearchableList.css";
import "../components/StudentCard.css";
import "../components/CoachCard.css";

export default function AdminsAdmin({ token }) {
  const [admins, setAdmins] = useState([]);
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
    fetchAdmins();
    fetchCenters();
  }, []);

  async function fetchAdmins() {
    const res = await fetch("http://localhost:5000/users/admins", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setAdmins([]);
    setAdmins(await res.json());
  }

  async function fetchCenters() {
    const res = await fetch("http://localhost:5000/centers", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) return setCenters([]);
    setCenters(await res.json());
  }

  async function createAdmin(e) {
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
          role: "ADMIN",
          center: form.centerId ? { id: Number(form.centerId) } : undefined,
          active: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to create admin");

      setForm({ name: "", username: "", password: "", centerId: "" });
      setShowForm(false);
      await fetchAdmins();
      success("Admin created successfully!");
    } catch (err) {
      error("Failed to create admin. Please try again.");
    }
  }

  if (selected)
    return (
      <div>
        <AdminProfile
          id={selected}
          token={token}
          onBack={() => setSelected(null)}
          embed={true}
        />
      </div>
    );

  const handleToggleActive = async (admin) => {
    setDialog({
      isOpen: true,
      type: "confirm",
      data: admin,
      title: `${admin.active ? "Deactivate" : "Activate"} Admin`,
      message: `Are you sure you want to ${
        admin.active ? "deactivate" : "activate"
      } ${admin.name}?`,
      onConfirm: async () => {
        await fetch(`http://localhost:5000/users/${admin.id}/active`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ active: !admin.active }),
        });
        fetchAdmins();
      },
    });
  };

  return (
    <div>
      <h2>Admins</h2>
      <button onClick={() => setShowForm((s) => !s)} className="action-button">
        {showForm ? "Cancel" : "Add Admin"}
      </button>
      {showForm && (
        <form onSubmit={createAdmin} className="add-form">
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

      <div className="admins-list-vertical">
        {admins.map((admin) => (
          <div key={admin.id} className="admin-box card-vertical">
            <div className="coach-left">
              <div className="coach-avatar">{admin.name.charAt(0)}</div>
              <div>
                <strong>{admin.name}</strong>
                <div className="muted">{admin.center?.name || "No center"}</div>
              </div>
            </div>
            <div className="coach-right">
              <button onClick={() => setSelected(admin.id)}>View</button>
            </div>
          </div>
        ))}
      </div>

      {dialog.isOpen && (
        <Dialog
          title={dialog.title}
          message={dialog.message}
          onConfirm={() => {
            dialog.onConfirm();
            setDialog({ isOpen: false, type: "", data: null });
          }}
          onCancel={() => setDialog({ isOpen: false, type: "", data: null })}
        />
      )}

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
