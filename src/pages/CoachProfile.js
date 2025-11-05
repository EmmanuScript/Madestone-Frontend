import React, { useEffect, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { useToastContext } from "../components/ToastProvider";
import EditableField from "../components/EditableField";
import LoadingSpinner from "../components/LoadingSpinner";
import withPageTransition from "../components/withPageTransition";
import "../styles/animations.css";
import "../styles/profile.css";

function CoachProfile({ id, token, onBack, embed = false }) {
  const [coach, setCoach] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    let mounted = true;

    async function fetchCoach() {
      try {
        const response = await fetch(`http://localhost:5000/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch coach data");
        const data = await response.json();
        if (mounted) {
          setCoach(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          showError("Failed to load coach profile");
          setError("Failed to load coach profile");
          setLoading(false);
        }
      }
    }

    fetchCoach();

    return () => {
      mounted = false;
    };
  }, [id, showError]);

  const handleUpdate = async (field, value) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) throw new Error("Failed to save changes");

      const updatedCoach = await response.json();
      setCoach(updatedCoach);
      setSaving(false);
      success("Changes saved successfully!");
    } catch (err) {
      setError("Failed to save changes. Please try again.");
      setSaving(false);
      showError("Failed to save changes");
    }
  };

  if (loading) {
    return (
      <div className={embed ? "loading-card" : "card loading-card"}>
        <LoadingSpinner size={40} />
        <div>Loading coach profile...</div>
      </div>
    );
  }

  if (!coach) return null;

  return (
    <div className={embed ? "profile-page" : "card profile-page"}>
      <div className="card-header">
        <button onClick={onBack} className="action-button">
          ← Back
        </button>
        {saving && (
          <div className="saving-status">
            <LoadingSpinner size={20} />
            <span>Saving changes...</span>
          </div>
        )}
      </div>

      <TransitionGroup>
        <CSSTransition
          key={coach.id}
          timeout={300}
          classNames="card"
          unmountOnExit
        >
          <div className="profile-card">
            <div className="profile-avatar">
              {coach.image ? (
                <img
                  src={`http://localhost:5000/uploads/${coach.image}`}
                  alt="Coach"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 10,
                  }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {coach.name?.charAt(0) || "?"}
                </div>
              )}
            </div>

            <div className="profile-details">
              <CSSTransition
                in={true}
                appear={true}
                timeout={300}
                classNames="form"
                unmountOnExit
              >
                <div>
                  <h3>
                    <EditableField
                      label="Name"
                      value={coach.name}
                      onSave={(value) => handleUpdate("name", value)}
                    />
                  </h3>
                  <div className="info-group">
                    <div className="info-item">
                      <b>Username:</b> {coach.username}
                    </div>
                    <div className="info-item">
                      <b>Center:</b> {coach.center?.name || "-"}
                    </div>
                    <div className="info-item">
                      <b>Status:</b>
                      <span
                        className={`status-badge ${
                          coach.active ? "active" : "inactive"
                        }`}
                      >
                        {coach.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <EditableField
                      label="Birthdate"
                      value={coach.birthMonthDay}
                      onSave={(value) => handleUpdate("birthMonthDay", value)}
                    />
                  </div>
                </div>
              </CSSTransition>
            </div>
          </div>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
}

// Export with page transition animation
export default withPageTransition(CoachProfile);
