import React, { useEffect, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { useToastContext } from "../components/ToastProvider";
import EditableField from "../components/EditableField";
import MonthDayPicker from "../components/MonthDayPicker";
import LoadingSpinner from "../components/LoadingSpinner";
import Dialog from "../components/Dialog";
import withPageTransition from "../components/withPageTransition";
import "../styles/animations.css";
import "../styles/profile.css";
import "../styles/student-profile.css";
import { API_BASE_URL } from "../config/api";

function StudentProfile({
  id,
  token,
  onBack,
  embed = false,
  readOnly = false,
}) {
  const [student, setStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, type: "", data: null });
  const [centers, setCenters] = useState([]);
  const [editingCenter, setEditingCenter] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    async function fetchStudent() {
      try {
        const response = await fetch(`${API_BASE_URL}/students/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch student data");
        const data = await response.json();
        setStudent(data);
      } catch (err) {
        showError("Failed to load student profile");
        setError("Failed to load student profile");
      } finally {
        setLoading(false);
      }
    }
    async function fetchCenters() {
      try {
        const response = await fetch(`${API_BASE_URL}/centers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCenters(
            data.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
          );
        }
      } catch (err) {
        // Silently fail if centers can't be fetched
      }
    }
    fetchStudent();
    fetchCenters();
  }, [id, showError, token]);

  const handleUpdate = async (field, value) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) throw new Error("Failed to save changes");

      const updatedStudent = await response.json();
      setStudent(updatedStudent);
      setSaving(false);
      success("Changes saved successfully!");
    } catch (err) {
      setError("Failed to save changes. Please try again.");
      setSaving(false);
      showError("Failed to save changes");
    }
  };

  const handleMarkPresent = () => {
    setDialog({
      isOpen: true,
      type: "confirm",
      title: "Mark Attendance",
      message: `Mark ${student.name} as present for today?`,
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/attendance/mark`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
              studentId: student.id,
              date: new Date().toISOString().slice(0, 10),
              present: true,
            }),
          });
          const res = await fetch(`${API_BASE_URL}/students/${id}`);
          const updatedStudent = await res.json();
          setStudent(updatedStudent);
          success("Attendance marked successfully!");
        } catch (err) {
          showError("Failed to mark attendance");
          setError("Failed to mark attendance. Please try again.");
        }
      },
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

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

      const response = await fetch(
        `${API_BASE_URL}/upload/student/${id}/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to upload image");

      const result = await response.json();

      // Update student state with new image
      setStudent({
        ...student,
        imageUrl: result.url,
        imageViewUrl: result.viewUrl,
      });

      success("Image uploaded successfully!");
    } catch (err) {
      showError("Failed to upload image");
      setError("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = () => {
    setDialog({
      isOpen: true,
      type: "confirm",
      title: "Delete Image",
      message: "Are you sure you want to delete this image?",
      onConfirm: async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/upload/student/${id}/image`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) throw new Error("Failed to delete image");

          setStudent({
            ...student,
            imageUrl: null,
            imageViewUrl: null,
          });

          success("Image deleted successfully!");
        } catch (err) {
          showError("Failed to delete image");
          setError("Failed to delete image. Please try again.");
        }
      },
    });
  };

  async function handleCenterUpdate() {
    if (!selectedCenterId) {
      showError("Please select a center");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/students/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          center: { id: Number(selectedCenterId) },
        }),
      });

      if (!response.ok) throw new Error("Failed to update center");

      const updatedStudent = await response.json();
      setStudent(updatedStudent);
      setEditingCenter(false);
      setSelectedCenterId("");
      success("Center updated successfully!");
    } catch (err) {
      showError("Failed to update center");
    }
  }

  if (loading) {
    return (
      <div className={embed ? "loading-card" : "card loading-card"}>
        <LoadingSpinner size={40} />
        <div>Loading student profile...</div>
      </div>
    );
  }

  if (!student) return null;

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
        <CSSTransition key={student.id} timeout={300} classNames="card">
          <div className="profile-card">
            <div
              className="profile-media"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div className="profile-avatar">
                {student.imageViewUrl ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={student.imageViewUrl}
                      alt="Student"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 10,
                      }}
                    />
                    {!readOnly && (
                      <button
                        onClick={handleDeleteImage}
                        style={{
                          position: "absolute",
                          top: 5,
                          right: 5,
                          background: "rgba(255, 0, 0, 0.8)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: 30,
                          height: 30,
                          cursor: "pointer",
                          fontSize: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Delete image"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="avatar-placeholder">
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Upload button placed UNDER the picture */}
              {!readOnly && (
                <div style={{ marginTop: 8 }}>
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="image-upload"
                    className="action-button"
                    style={{
                      padding: "6px 12px",
                      fontSize: 13,
                      display: "inline-block",
                      cursor: uploading ? "not-allowed" : "pointer",
                      opacity: uploading ? 0.6 : 1,
                    }}
                  >
                    {uploading ? "Uploading..." : "Change Photo"}
                  </label>
                </div>
              )}
            </div>
            <div className="profile-details">
              <CSSTransition
                in={true}
                appear={true}
                timeout={300}
                classNames="form"
              >
                <div className="info-group">
                  <h3>
                    <EditableField
                      label="Name"
                      value={student.name}
                      onSave={(value) => handleUpdate("name", value)}
                      readOnly={readOnly}
                    />
                  </h3>

                  <div className="info-item">
                    <b>Center:</b>{" "}
                    {!editingCenter ? (
                      <>
                        {student.center?.name || "-"}
                        {!readOnly && (
                          <button
                            onClick={() => {
                              setEditingCenter(true);
                              setSelectedCenterId(
                                student.center?.id?.toString() || ""
                              );
                            }}
                            style={{
                              marginLeft: 10,
                              padding: "4px 10px",
                              fontSize: 12,
                              cursor: "pointer",
                              background: "rgba(33, 150, 243, 0.35)",
                              border: "1px solid rgba(33, 150, 243, 0.6)",
                              color: "#ffffff",
                              fontWeight: 600,
                              borderRadius: 4,
                            }}
                            className="action-button"
                          >
                            Edit
                          </button>
                        )}
                      </>
                    ) : (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          marginLeft: 8,
                        }}
                      >
                        <select
                          value={selectedCenterId}
                          onChange={(e) => setSelectedCenterId(e.target.value)}
                          style={{
                            padding: "4px 8px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid rgba(255, 255, 255, 0.3)",
                            background: "rgba(255, 255, 255, 0.1)",
                            color: "#ffffff",
                          }}
                        >
                          <option value="">Select Center</option>
                          {centers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleCenterUpdate}
                          style={{
                            padding: "4px 10px",
                            fontSize: 12,
                            cursor: "pointer",
                            background: "rgba(76, 175, 80, 0.35)",
                            border: "1px solid #66bb6a",
                            color: "#ffffff",
                            fontWeight: 600,
                            borderRadius: 4,
                          }}
                          className="action-button"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCenter(false);
                            setSelectedCenterId("");
                          }}
                          style={{
                            padding: "4px 10px",
                            fontSize: 12,
                            cursor: "pointer",
                            background: "rgba(255, 70, 70, 0.35)",
                            border: "1px solid #ff7777",
                            color: "#ffffff",
                            fontWeight: 600,
                            borderRadius: 4,
                          }}
                          className="action-button"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="info-item">
                    <b>Status:</b>
                    <span
                      className={`status-badge ${
                        student.active ? "active" : "inactive"
                      }`}
                      style={{ marginLeft: 8 }}
                    >
                      {student.active ? "Active" : "Inactive"}
                    </span>
                    {!readOnly && (
                      <button
                        onClick={() => handleUpdate("active", !student.active)}
                        className="action-button"
                        style={{
                          marginLeft: 10,
                          padding: "4px 12px",
                          fontSize: "13px",
                          background: student.active
                            ? "rgba(255, 100, 100, 0.35)"
                            : "rgba(100, 255, 100, 0.35)",
                          border: student.active
                            ? "1px solid rgba(255, 130, 130, 0.7)"
                            : "1px solid rgba(130, 255, 130, 0.7)",
                          color: "#ffffff",
                          fontWeight: 600,
                          borderRadius: 4,
                        }}
                      >
                        {student.active ? "Mark Inactive" : "Mark Active"}
                      </button>
                    )}
                  </div>

                  <EditableField
                    label="Age"
                    value={student.age}
                    type="number"
                    onSave={(value) => handleUpdate("age", Number(value))}
                    readOnly={readOnly}
                  />

                  <EditableField
                    label="Birthdate"
                    value={student.birthMonthDay || "Not set"}
                    onSave={(value) => handleUpdate("birthMonthDay", value)}
                    readOnly={readOnly}
                    customEditor={(val, setVal) => (
                      <MonthDayPicker value={val} onChange={setVal} />
                    )}
                  />

                  <EditableField
                    label="Category"
                    value={student.category}
                    onSave={(value) => handleUpdate("category", value)}
                    readOnly={readOnly}
                  />

                  <EditableField
                    label="School"
                    value={student.school || ""}
                    onSave={(value) => handleUpdate("school", value)}
                    readOnly={readOnly}
                  />

                  <EditableField
                    label="Parent Phone Number"
                    value={student.parentPhoneNumber || ""}
                    onSave={(value) => handleUpdate("parentPhoneNumber", value)}
                    readOnly={readOnly}
                  />

                  <EditableField
                    label="Parent Email"
                    value={student.parentEmail || ""}
                    readOnly={readOnly}
                    type="email"
                    onSave={(value) => handleUpdate("parentEmail", value)}
                  />

                  <EditableField
                    label="Jersey Name"
                    value={student.jerseyName || ""}
                    readOnly={readOnly}
                    onSave={(value) => handleUpdate("jerseyName", value)}
                  />

                  <div className="info-item attendance-section">
                    <div className="attendance-header">
                      <b>Attendance:</b> {student.attendance}
                      {!readOnly && (
                        <button
                          onClick={handleMarkPresent}
                          className="action-button success"
                        >
                          Mark Present
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="payment-section">
                    <EditableField
                      label="Amount Due"
                      value={student.amountDue}
                      type="number"
                      onSave={(value) =>
                        handleUpdate("amountDue", Number(value))
                      }
                      readOnly={readOnly}
                    />
                    <EditableField
                      label="Amount Paid"
                      value={student.amountPaid}
                      type="number"
                      onSave={(value) =>
                        handleUpdate("amountPaid", Number(value))
                      }
                      readOnly={readOnly}
                    />
                    <EditableField
                      label="Due Reset Date"
                      value={student.dueResetDate}
                      type="date"
                      onSave={(value) => handleUpdate("dueResetDate", value)}
                      readOnly={readOnly}
                    />
                    <EditableField
                      label="Additional Notes"
                      value={student.additionalNotes}
                      type="textarea"
                      onSave={(value) => handleUpdate("additionalNotes", value)}
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </CSSTransition>
            </div>
          </div>
        </CSSTransition>
      </TransitionGroup>

      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
}

// Export with page transition animation
export default withPageTransition(StudentProfile);
