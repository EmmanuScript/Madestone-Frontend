import React, { useState } from "react";
import "./EditableField.css";

export default function EditableField({
  label,
  value,
  onSave,
  type = "text",
  readOnly = false,
  customEditor = null,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (!isEditing || readOnly) {
    return (
      <div
        className={`editable-field ${readOnly ? "read-only" : ""}`}
        onClick={readOnly ? undefined : () => setIsEditing(true)}
      >
        <b>{label}:</b> {value || "-"}
        {!readOnly && <button className="edit-button">Edit</button>}
      </div>
    );
  }

  return (
    <div className="editable-field editing">
      <b>{label}:</b>
      {customEditor ? (
        customEditor(editValue, setEditValue)
      ) : (
        <input
          type={type}
          value={editValue || ""}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
        />
      )}
      <div className="edit-actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
}
