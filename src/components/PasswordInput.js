import React, { useState } from "react";

export default function PasswordInput({
  value,
  onChange,
  placeholder = "Enter password",
  name,
  id,
  style = {},
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        id={id}
        style={{
          paddingRight: "40px",
          ...style,
        }}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
          position: "absolute",
          right: "10px",
          background: "none",
          border: "none",
          color: "rgba(255, 255, 255, 0.7)",
          cursor: "pointer",
          fontSize: "18px",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.color = "rgba(199, 244, 100, 0.9)";
        }}
        onMouseLeave={(e) => {
          e.target.style.color = "rgba(255, 255, 255, 0.7)";
        }}
        title={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? "👁️" : "👁️‍🗨️"}
      </button>
    </div>
  );
}
