import React, { useEffect, useState } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { useToastContext } from "../components/ToastProvider";
import EditableField from "../components/EditableField";
import LoadingSpinner from "../components/LoadingSpinner";
import Dialog from "../components/Dialog";
import withPageTransition from "../components/withPageTransition";
import "../styles/animations.css";
import "../styles/profile.css";
import "../styles/student-profile.css";

function StudentProfile({ id, token, onBack, embed = false }) {
  const [student, setStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialog, setDialog] = useState({ isOpen: false, type: "", data: null });
  const { success, error: showError } = useToastContext();

  useEffect(() => {
    async function fetchStudent() {
      try {
        const response = await fetch(`http://localhost:5000/students/${id}`, {
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
    fetchStudent();
  }, [id, showError]);

  const handleUpdate = async (field, value) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/students/${id}`, {
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
          await fetch("http://localhost:5000/attendance/mark", {
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
          const res = await fetch(`http://localhost:5000/students/${id}`);
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

    // Validate file size (50MB max as per ImgHippo)
    if (file.size > 50 * 1024 * 1024) {
      showError("Image size must be less than 50MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `http://localhost:5000/upload/student/${id}/image`,
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
            `http://localhost:5000/upload/student/${id}/image`,
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
                  </div>
                ) : (
                  <div className="avatar-placeholder">
                    {student.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Upload button placed UNDER the picture */}
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
                    />
                  </h3>

                  <div className="info-item">
                    <b>Center:</b> {student.center?.name || "-"}
                  </div>

                  <EditableField
                    label="Age"
                    value={student.age}
                    type="number"
                    onSave={(value) => handleUpdate("age", Number(value))}
                  />

                  <EditableField
                    label="Category"
                    value={student.category}
                    onSave={(value) => handleUpdate("category", value)}
                  />

                  <EditableField
                    label="School"
                    value={student.school || ""}
                    onSave={(value) => handleUpdate("school", value)}
                  />

                  <EditableField
                    label="Parent Phone Number"
                    value={student.parentPhoneNumber || ""}
                    onSave={(value) => handleUpdate("parentPhoneNumber", value)}
                  />

                  <EditableField
                    label="Parent Email"
                    value={student.parentEmail || ""}
                    type="email"
                    onSave={(value) => handleUpdate("parentEmail", value)}
                  />

                  <div className="info-item attendance-section">
                    <div className="attendance-header">
                      <b>Attendance:</b> {student.attendance}
                      <button
                        onClick={handleMarkPresent}
                        className="action-button success"
                      >
                        Mark Present
                      </button>
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
                    />
                    <EditableField
                      label="Amount Paid"
                      value={student.amountPaid}
                      type="number"
                      onSave={(value) =>
                        handleUpdate("amountPaid", Number(value))
                      }
                    />
                    <EditableField
                      label="Due Reset Date"
                      value={student.dueResetDate}
                      type="date"
                      onSave={(value) => handleUpdate("dueResetDate", value)}
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
