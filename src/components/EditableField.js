import React, { useState } from "react";
import "./EditableField.css";

export default function EditableField({
  label,
  value,
  onSave,
  type = "text",
  readOnly = false,
  customEditor = null,
  inlineMode = false,
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
      <span
        className={`editable-field ${readOnly ? "read-only" : ""}`}
        onClick={readOnly ? undefined : () => setIsEditing(true)}
        style={inlineMode ? { display: "inline", cursor: "pointer" } : {}}
      >
        {label && <b>{label}:</b>} {value || "-"}
        {!readOnly && !label && !inlineMode && (
          <button className="edit-button">Edit</button>
        )}
      </span>
    );
  }

  return (
    <span
      className={`editable-field editing ${inlineMode ? "inline-mode" : ""}`}
      style={inlineMode ? { display: "inline", whiteSpace: "nowrap" } : {}}
    >
      {label && <b>{label}:</b>}
      {customEditor ? (
        customEditor(editValue, setEditValue)
      ) : (
        <input
          type={type}
          value={editValue || ""}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
          style={
            inlineMode ? { display: "inline-block", marginLeft: "4px" } : {}
          }
        />
      )}
      <div
        className="edit-actions"
        style={
          inlineMode
            ? { display: "inline-flex", marginLeft: "4px", gap: "4px" }
            : {}
        }
      >
        <button
          onClick={handleSave}
          style={inlineMode ? { padding: "2px 8px", fontSize: "12px" } : {}}
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          style={inlineMode ? { padding: "2px 8px", fontSize: "12px" } : {}}
        >
          Cancel
        </button>
      </div>
    </span>
  );
}
