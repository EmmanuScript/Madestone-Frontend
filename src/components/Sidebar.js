import React from "react";
import "../styles/sidebar.css";

export default function Sidebar({ view, setView, onLogout, userRole = "CEO" }) {
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

      {userRole === "CEO" && (
        <button style={{ marginBottom: 4 }} onClick={() => setView("admins")}>
          Admins
        </button>
      )}

      <button style={{ marginBottom: 4 }} onClick={() => setView("centers")}>
        Centers
      </button>

      <button
        style={{ marginBottom: 4 }}
        onClick={() => setView("attendance-history")}
      >
        Attendance History
      </button>

      {(userRole === "ADMIN" || userRole === "CEO") && (
        <button
          style={{ marginBottom: 4 }}
          onClick={() => setView("mark-attendance")}
        >
          Mark Attendance
        </button>
      )}

      {(userRole === "ADMIN" || userRole === "CEO") && (
        <button
          style={{ marginBottom: 4 }}
          onClick={() => setView("coach-attendance")}
        >
          Coach Attendance
        </button>
      )}

      {(userRole === "ADMIN" || userRole === "CEO") && (
        <button
          style={{ marginBottom: 4 }}
          onClick={() => setView("coach-attendance-history")}
        >
          Coach Attendance History
        </button>
      )}

      {userRole === "CEO" && (
        <button
          style={{ marginBottom: 4 }}
          onClick={() => setView("preferences")}
        >
          Preferences
        </button>
      )}

      <button style={{ marginTop: 12 }} onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}
