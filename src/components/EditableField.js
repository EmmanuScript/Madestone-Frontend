import React, { useState } from "react";
import "./EditableField.css";

export default function EditableField({ label, value, onSave, type = "text" }) {
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

  if (!isEditing) {
    return (
      <div className="editable-field" onClick={() => setIsEditing(true)}>
        <b>{label}:</b> {value || "-"}
        <button className="edit-button">Edit</button>
      </div>
    );
  }

  return (
    <div className="editable-field editing">
      <b>{label}:</b>
      <input
        type={type}
        value={editValue || ""}
        onChange={(e) => setEditValue(e.target.value)}
        autoFocus
      />
      <div className="edit-actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
}
