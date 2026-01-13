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
    <div className="password-input-wrapper">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        id={id}
        className="password-input-field"
        style={style}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShowPassword(!showPassword)}
        title={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? "👁️" : "👁️‍🗨️"}
      </button>
    </div>
  );
}
