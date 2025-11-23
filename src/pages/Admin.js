import React, { useEffect, useState, Suspense } from "react";
import Sidebar from "../components/Sidebar";
import MarkAttendance from "../components/MarkAttendance";
import "../styles/admin-background.css";

// Lazy load admin pages
const AllStudents = React.lazy(() => import("./AllStudents"));
const CoachesAdmin = React.lazy(() => import("./CoachesAdmin"));
const CentersAdmin = React.lazy(() => import("./CentersAdmin"));
const AttendanceHistory = React.lazy(() => import("./AttendanceHistory"));
const MarkCoachAttendance = React.lazy(() =>
  import("../components/MarkCoachAttendance")
);
const CoachAttendanceHistory = React.lazy(() =>
  import("./CoachAttendanceHistory")
);

export default function Admin({
  token,
  onLogout,
  onCoachClick,
  onStudentClick,
  onAdminClick,
  userId,
}) {
  const [view, setView] = useState(() => {
    return localStorage.getItem("adminView") || "overview";
  });

  // Persist view state to localStorage
  useEffect(() => {
    localStorage.setItem("adminView", view);
  }, [view]);

  function renderView() {
    switch (view) {
      case "students":
        return (
          <Suspense fallback={<div>Loading students...</div>}>
            <AllStudents token={token} />
          </Suspense>
        );
      case "coaches":
        return (
          <Suspense fallback={<div>Loading coaches...</div>}>
            <CoachesAdmin token={token} readOnly={true} />
          </Suspense>
        );
      case "centers":
        return (
          <Suspense fallback={<div>Loading centers...</div>}>
            <CentersAdmin
              token={token}
              onStudentClick={onStudentClick}
              onCoachClick={onCoachClick}
              onAdminClick={onAdminClick}
              readOnly={true}
            />
          </Suspense>
        );
      case "attendance-history":
        return (
          <Suspense fallback={<div>Loading attendance...</div>}>
            <AttendanceHistory token={token} onStudentClick={onStudentClick} />
          </Suspense>
        );
      case "mark-attendance":
        return (
          <MarkAttendance
            token={token}
            userId={userId}
            onStudentClick={onStudentClick}
          />
        );
      case "coach-attendance":
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <MarkCoachAttendance
              token={token}
              userId={userId}
              onCoachClick={onCoachClick}
            />
          </Suspense>
        );
      case "coach-attendance-history":
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <CoachAttendanceHistory token={token} onCoachClick={onCoachClick} />
          </Suspense>
        );
      case "overview":
      default:
        return (
          <div>
            <h2>Admin Dashboard</h2>
            <p>Welcome to the Admin Panel. You have access to:</p>
            <ul style={{ lineHeight: "1.8", marginTop: "1rem" }}>
              <li>✓ View and manage all students</li>
              <li>✓ View all coaches</li>
              <li>✓ View all centers</li>
              <li>✓ View attendance history</li>
              <li>✓ Mark attendance for students</li>
              <li>✓ Mark attendance for coaches</li>
              <li>✓ View coach attendance history</li>
            </ul>
            <p style={{ marginTop: "1.5rem", color: "#eaffd6" }}>
              Select an option from the sidebar to get started.
            </p>
          </div>
        );
    }
  }

  return (
    <div
      className="page admin-page admin-page-wrapper"
      style={{ display: "flex", gap: 16, alignItems: "flex-start" }}
    >
      <aside style={{ minWidth: 200 }}>
        <Sidebar
          view={view}
          setView={setView}
          onLogout={onLogout}
          userRole="ADMIN"
        />
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
              <h2>Admin Dashboard</h2>
            </div>
          </div>

          {renderView()}
        </div>
      </div>
    </div>
  );
}
