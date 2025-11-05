import React from "react";
import "../styles/animations.css";

export default function LoadingSpinner({ size = 24, className = "" }) {
  return (
    <div
      className={`loading-spinner ${className}`}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, size / 12),
      }}
    />
  );
}
