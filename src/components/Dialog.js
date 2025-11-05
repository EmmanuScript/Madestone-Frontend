import React from "react";
import "./Dialog.css";

export default function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "confirm", // confirm, delete, or success
}) {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`dialog-icon ${type}`}>
          {type === "delete" && "🗑️"}
          {type === "confirm" && "?"}
          {type === "success" && "✓"}
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="dialog-actions">
          <button onClick={onClose} className="dialog-button cancel">
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`dialog-button ${type}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
