import React, { useState, useEffect, Suspense } from "react";
import { ToastProvider } from "./components/ToastProvider";
import Login from "./pages/Login";
import CEO from "./pages/CEO";
import Coach from "./pages/Coach";
import CoachProfile from "./pages/CoachProfile";
import StudentProfile from "./pages/StudentProfile";

const CoachCenterStudents = React.lazy(() => import("./pages/CenterStudents"));

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));
  const [userId, setUserId] = useState(() => localStorage.getItem("userId"));
  const [showCenterStudents, setShowCenterStudents] = useState(false);
  const [coachProfileId, setCoachProfileId] = useState(null);
  const [studentProfileId, setStudentProfileId] = useState(null);

  // Restore role and userId from token if needed
  useEffect(() => {
    if (token && (!role || !userId)) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (!role && payload.role) setRole(payload.role);
        if (!userId && payload.sub) setUserId(String(payload.sub));
      } catch (e) {
        console.warn("Failed to decode token on startup", e);
        setToken(null);
        setRole(null);
        setUserId(null);
      }
    }
  }, [token]);

  // Keep localStorage synced
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
    }
  }, [token, role, userId]);

  function logout() {
    setToken(null);
    setRole(null);
    setCoachProfileId(null);
    setStudentProfileId(null);
    setUserId(null);
  }

  function renderContent() {
    if (!token)
      return (
        <Login
          onLogin={(t, r, id) => {
            setToken(t);
            setRole(r);
            setUserId(id);
          }}
        />
      );

    if (coachProfileId)
      return (
        <CoachProfile
          id={coachProfileId}
          token={token}
          onBack={() => setCoachProfileId(null)}
        />
      );

    if (studentProfileId)
      return (
        <StudentProfile
          id={studentProfileId}
          token={token}
          onBack={() => setStudentProfileId(null)}
        />
      );

    if (showCenterStudents)
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <CoachCenterStudents
            token={token}
            userId={userId}
            onBack={() => setShowCenterStudents(false)}
          />
        </Suspense>
      );

    if (role === "CEO")
      return (
        <CEO
          token={token}
          onLogout={logout}
          onCoachClick={setCoachProfileId}
          onStudentClick={setStudentProfileId}
        />
      );

    return (
      <Coach
        token={token}
        onLogout={logout}
        onStudentClick={setStudentProfileId}
        userId={userId}
        onShowCenterStudents={() => setShowCenterStudents(true)}
      />
    );
  }

  // 🟢 THIS is the missing piece — actually return something to render!
  return <ToastProvider>{renderContent()}</ToastProvider>;
}
