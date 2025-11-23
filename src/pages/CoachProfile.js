import React, { useEffect, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { useToastContext } from "../components/ToastProvider";
import EditableField from "../components/EditableField";
import LoadingSpinner from "../components/LoadingSpinner";
import withPageTransition from "../components/withPageTransition";
import "../styles/animations.css";
import "../styles/profile.css";
import "../styles/embedded-pages.css";

function CoachProfile({ id, token, onBack, embed = false, readOnly = false }) {
  const [coach, setCoach] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { success, error: showError } = useToastContext();
  const isCEO =
    typeof window !== "undefined" && localStorage.getItem("role") === "CEO";

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

  async function handleImageUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate file size (200KB max)
    const maxFileSize = 200 * 1024; // 200KB
    if (file.size > maxFileSize) {
      showError(
        `Image must be smaller than 200KB. Current size: ${(
          file.size / 1024
        ).toFixed(2)}KB`
      );
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`http://localhost:5000/upload/user/${id}/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setCoach((c) => ({
        ...c,
        imageUrl: data.url,
        imageViewUrl: data.viewUrl,
        cloudinaryPublicId: data.publicId,
      }));
      success("Image updated");
    } catch (err) {
      showError("Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDeleteImage() {
    if (!coach) return;
    try {
      const res = await fetch(`http://localhost:5000/upload/user/${id}/image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setCoach((c) => ({
        ...c,
        imageUrl: null,
        imageViewUrl: null,
        cloudinaryPublicId: null,
      }));
      success("Image deleted");
    } catch (err) {
      showError("Failed to delete image");
    }
  }

  async function handleDeleteAccount() {
    const currentUserId = localStorage.getItem("userId");
    const isDeletingSelf = currentUserId === String(id);

    if (
      !window.confirm(
        `Are you sure you want to delete this coach account? This cannot be undone.`
      )
    )
      return;
    try {
      const res = await fetch(`http://localhost:5000/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      success("Account deleted");

      // If deleting self, clear auth and reload; if CEO deleting others, just go back
      if (isDeletingSelf) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        window.location.reload();
      } else {
        onBack();
      }
    } catch (err) {
      showError("Failed to delete account");
    }
  }

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
            <div className="profile-media">
              <div className="profile-avatar">
                {coach.imageViewUrl || coach.imageUrl ? (
                  <img
                    src={coach.imageViewUrl || coach.imageUrl}
                    alt={coach.name || "Coach"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  coach.name?.charAt(0) || "?"
                )}
              </div>
              <input
                type="file"
                id="coach-image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                disabled={uploading}
              />
              <label
                htmlFor="coach-image-upload"
                className="action-button"
                style={{
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.6 : 1,
                  padding: "6px 12px",
                  fontSize: "13px",
                  marginTop: "8px",
                }}
              >
                {uploading
                  ? "Uploading..."
                  : coach.imageUrl || coach.imageViewUrl
                  ? "Change Photo"
                  : "Upload Photo"}
              </label>
              {(coach.imageUrl || coach.imageViewUrl) && (
                <button
                  onClick={handleDeleteImage}
                  className="action-button"
                  style={{
                    background: "#ff4646",
                    padding: "6px 12px",
                    fontSize: "13px",
                    marginTop: "4px",
                  }}
                >
                  Delete Photo
                </button>
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
                      readOnly={readOnly}
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
                      {isCEO && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `http://localhost:5000/users/${id}/active`,
                                {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    active: !coach.active,
                                  }),
                                }
                              );
                              if (!res.ok) throw new Error("Failed");
                              const updated = await res.json();
                              setCoach(updated);
                              success(
                                `Marked ${
                                  updated.active ? "Active" : "Inactive"
                                }`
                              );
                            } catch (err) {
                              showError("Failed to toggle status");
                            }
                          }}
                          style={{
                            marginLeft: 10,
                            padding: "4px 10px",
                            fontSize: 12,
                            cursor: "pointer",
                            background: coach.active
                              ? "rgba(255,70,70,0.2)"
                              : "rgba(76,175,80,0.25)",
                            border: coach.active
                              ? "1px solid #ff4646"
                              : "1px solid #4caf50",
                          }}
                          className="action-button"
                        >
                          {coach.active ? "Mark Inactive" : "Mark Active"}
                        </button>
                      )}
                    </div>
                    <EditableField
                      label="Birthdate"
                      value={coach.birthMonthDay}
                      onSave={(value) => handleUpdate("birthMonthDay", value)}
                      readOnly={readOnly}
                    />
                    {(readOnly || isCEO) && (
                      <div style={{ marginTop: 16 }}>
                        <button
                          onClick={handleDeleteAccount}
                          className="action-button"
                          style={{
                            background: "rgba(255,0,0,0.25)",
                            border: "1px solid rgba(255,0,0,0.4)",
                          }}
                        >
                          {isCEO && !readOnly
                            ? "Delete Coach Account"
                            : "Delete My Account"}
                        </button>
                      </div>
                    )}
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
