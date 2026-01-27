import React, { useEffect, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { useToastContext } from "../components/ToastProvider";
import EditableField from "../components/EditableField";
import MonthDayPicker from "../components/MonthDayPicker";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordInput from "../components/PasswordInput";
import withPageTransition from "../components/withPageTransition";
import "../styles/animations.css";
import "../styles/profile.css";
import "../styles/embedded-pages.css";
import { API_BASE_URL } from "../config/api";

function AdminProfile({ id, token, onBack, embed = false }) {
  const [admin, setAdmin] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const { success, error: showError } = useToastContext();
  const isCEO =
    typeof window !== "undefined" && localStorage.getItem("role") === "CEO";
  const isAdmin =
    typeof window !== "undefined" && localStorage.getItem("role") === "ADMIN";

  useEffect(() => {
    let mounted = true;

    async function fetchAdmin() {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch admin data");
        const data = await response.json();
        if (mounted) {
          setAdmin(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          showError("Failed to load admin profile");
          setError("Failed to load admin profile");
          setLoading(false);
        }
      }
    }

    fetchAdmin();

    return () => {
      mounted = false;
    };
  }, [id, showError, token]);

  const handleUpdate = async (field, value) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          showError("You are not authorized to perform this action");
          setSaving(false);
          return;
        }
        throw new Error("Failed to save changes");
      }

      const updatedAdmin = await response.json();
      setAdmin(updatedAdmin);
      setSaving(false);
      success("Changes saved successfully!");
    } catch (err) {
      setError("Failed to save changes. Please try again.");
      setSaving(false);
      showError("Failed to save changes");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (200KB max)
    const maxFileSize = 200 * 1024; // 200KB
    if (file.size > maxFileSize) {
      showError(
        `Image must be smaller than 200KB. Current size: ${(
          file.size / 1024
        ).toFixed(2)}KB`,
      );
      return;
    }

    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);

      const response = await fetch(`${API_BASE_URL}/upload/user/${id}/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const result = await response.json();
      setAdmin((prev) => ({
        ...prev,
        imageUrl: result.url,
        imageViewUrl: result.viewUrl,
        cloudinaryPublicId: result.publicId,
      }));
      success("Image uploaded successfully!");
    } catch (err) {
      showError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!admin.cloudinaryPublicId && !admin.imageUrl) {
      showError("No image to delete");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload/user/${id}/image`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete image");

      setAdmin((prev) => ({
        ...prev,
        imageUrl: null,
        imageViewUrl: null,
        cloudinaryPublicId: null,
      }));
      success("Image deleted successfully!");
    } catch (err) {
      showError("Failed to delete image");
    }
  };

  if (loading) {
    return (
      <div className={embed ? "embedded-loading" : "card loading-card"}>
        <LoadingSpinner size={40} />
        <div>Loading admin profile...</div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className={embed ? "embedded-page profile-page" : "card profile-page"}>
      <div className="profile-header-bar">
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
          key={admin.id}
          timeout={300}
          classNames="profile-transition"
        >
          <div className="profile-card">
            <div className="profile-media">
              <div className="profile-avatar">
                {admin.imageViewUrl ||
                admin.imageUrl ||
                (admin.image
                  ? `${API_BASE_URL}/uploads/${admin.image}`
                  : null) ? (
                  <img
                    src={
                      admin.imageViewUrl ||
                      admin.imageUrl ||
                      `${API_BASE_URL}/uploads/${admin.image}`
                    }
                    alt={admin.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  admin.name.charAt(0)
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: "none" }}
                id="admin-image-upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="admin-image-upload"
                className="action-button"
                style={{
                  cursor: uploadingImage ? "not-allowed" : "pointer",
                  opacity: uploadingImage ? 0.6 : 1,
                  padding: "6px 12px",
                  fontSize: "13px",
                  marginTop: "8px",
                }}
              >
                {uploadingImage ? "Uploading..." : "Change Photo"}
              </label>
              {(admin.imageUrl || admin.cloudinaryPublicId) && (
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
              <EditableField
                label="Name"
                value={admin.name}
                onSave={(val) => handleUpdate("name", val)}
              />
              {isCEO || isAdmin ? (
                <EditableField
                  label="Username"
                  value={admin.username}
                  onSave={(val) => handleUpdate("username", val)}
                />
              ) : (
                <div style={{ marginTop: "1rem" }}>
                  <strong>Username:</strong> {admin.username}
                </div>
              )}
              <div style={{ marginTop: "1rem" }}>
                <strong>Role:</strong> {admin.role}
              </div>
              <div style={{ marginTop: "1rem" }}>
                <strong>Center:</strong> {admin.center?.name || "No center"}
              </div>
              <div style={{ marginTop: "1rem" }}>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color: admin.active ? "#4caf50" : "#ff4646",
                    fontWeight: "bold",
                  }}
                >
                  {admin.active ? "Active" : "Inactive"}
                </span>
                {(isCEO || isAdmin) && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(
                          `${API_BASE_URL}/users/${id}/active`,
                          {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ active: !admin.active }),
                          },
                        );
                        if (!res.ok) {
                          if (res.status === 403) {
                            showError(
                              "You are not authorized to perform this action",
                            );
                            return;
                          }
                          throw new Error("Failed to toggle status");
                        }
                        const updated = await res.json();
                        setAdmin(updated);
                        success(
                          `Marked ${updated.active ? "Active" : "Inactive"}`,
                        );
                      } catch (err) {
                        showError("Failed to toggle status");
                      }
                    }}
                    style={{
                      marginLeft: 12,
                      padding: "4px 10px",
                      fontSize: 12,
                      cursor: "pointer",
                      background: admin.active
                        ? "rgba(255,70,70,0.35)"
                        : "rgba(76,175,80,0.35)",
                      border: admin.active
                        ? "1px solid #ff7777"
                        : "1px solid #66bb6a",
                      color: "#ffffff",
                      fontWeight: 600,
                      borderRadius: 4,
                    }}
                    className="action-button"
                  >
                    {admin.active ? "Mark Inactive" : "Mark Active"}
                  </button>
                )}
              </div>
              <EditableField
                label="Birthdate"
                value={admin.birthMonthDay || "Not set"}
                onSave={(val) => handleUpdate("birthMonthDay", val)}
                customEditor={(val, setVal) => (
                  <MonthDayPicker value={val} onChange={setVal} />
                )}
              />

              {(isCEO || isAdmin) && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    background: "rgba(156, 39, 176, 0.1)",
                    border: "1px solid rgba(156, 39, 176, 0.3)",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: showPasswordChange ? 12 : 0,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      🔐 Change Password
                    </span>
                    <button
                      onClick={() => {
                        setShowPasswordChange(!showPasswordChange);
                        setNewPassword("");
                      }}
                      className="action-button"
                      style={{
                        padding: "4px 10px",
                        fontSize: 12,
                        background: showPasswordChange
                          ? "rgba(255,70,70,0.35)"
                          : "rgba(156, 39, 176, 0.35)",
                        border: showPasswordChange
                          ? "1px solid #ff7777"
                          : "1px solid rgba(206, 100, 226, 0.6)",
                        color: "#ffffff",
                        fontWeight: 600,
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      {showPasswordChange ? "Cancel" : "Change"}
                    </button>
                  </div>
                  {showPasswordChange && (
                    <div style={{ marginTop: 12 }}>
                      <PasswordInput
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        name="newPassword"
                      />
                      <button
                        onClick={async () => {
                          if (!newPassword || newPassword.length < 4) {
                            showError("Password must be at least 4 characters");
                            return;
                          }
                          if (
                            !window.confirm(
                              `Change password for ${admin.name}?`,
                            )
                          )
                            return;

                          try {
                            setChangingPassword(true);
                            const res = await fetch(
                              `${API_BASE_URL}/users/${id}/change-password`,
                              {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ newPassword }),
                              },
                            );
                            if (res.ok) {
                              success(`Password changed for ${admin.name}`);
                              setNewPassword("");
                              setShowPasswordChange(false);
                            } else {
                              if (res.status === 403) {
                                showError(
                                  "You are not authorized to perform this action",
                                );
                              } else {
                                const errData = await res.json();
                                showError(
                                  errData.message ||
                                    "Failed to change password",
                                );
                              }
                            }
                          } catch (e) {
                            showError("Error: " + e.message);
                          } finally {
                            setChangingPassword(false);
                          }
                        }}
                        disabled={
                          !newPassword ||
                          newPassword.length < 4 ||
                          changingPassword
                        }
                        className="action-button"
                        style={{
                          width: "100%",
                          padding: "8px",
                          fontSize: 14,
                          background: "rgba(156, 39, 176, 0.25)",
                          border: "1px solid rgba(156, 39, 176, 0.4)",
                        }}
                      >
                        {changingPassword
                          ? "Changing..."
                          : "🔑 Update Password"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isCEO && (
                <div style={{ marginTop: "1rem" }}>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Are you sure you want to delete this admin account? This cannot be undone.",
                        )
                      )
                        return;
                      try {
                        const res = await fetch(`${API_BASE_URL}/users/${id}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!res.ok) throw new Error("Delete failed");
                        success("Admin account deleted");
                        onBack();
                      } catch (err) {
                        showError("Failed to delete account");
                      }
                    }}
                    className="action-button"
                    style={{
                      background: "rgba(255,0,0,0.25)",
                      border: "1px solid rgba(255,0,0,0.4)",
                      padding: "8px 16px",
                    }}
                  >
                    Delete Admin Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </CSSTransition>
      </TransitionGroup>

      {error && (
        <div style={{ color: "#ff4646", marginTop: "1rem" }}>{error}</div>
      )}
    </div>
  );
}

export default withPageTransition(AdminProfile);
