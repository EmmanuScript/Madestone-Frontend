import React from "react";
import "../styles/sidebar.css";

export default function Sidebar({ view, setView, onLogout }) {
  return (
    <div
      className="ceo-sidebar"
      style={{ display: "flex", flexDirection: "column", gap: 8 }}
    >
      <button style={{ marginBottom: 4 }} onClick={() => setView("overview")}>
        Overview
      </button>

      <button style={{ marginBottom: 4 }} onClick={() => setView("students")}>
        All Students
      </button>

      <button style={{ marginBottom: 4 }} onClick={() => setView("coaches")}>
        Coaches
      </button>

      <button style={{ marginBottom: 4 }} onClick={() => setView("centers")}>
        Centers
      </button>

      <button
        style={{ marginBottom: 4 }}
        onClick={() => setView("attendance-history")}
      >
        Attendance History
      </button>

      <button style={{ marginTop: 12 }} onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}
