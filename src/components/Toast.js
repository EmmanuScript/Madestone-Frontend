import React, { useEffect } from "react";
import "./Toast.css";

export default function Toast({
  message,
  type = "info", // 'success', 'error', 'info'
  duration = 3000,
  onClose,
}) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`toast ${type}`}>
      <div className="toast-icon">
        {type === "success" && "✓"}
        {type === "error" && "✕"}
        {type === "info" && "ℹ"}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
