import React, { useState } from "react";
import { apiFetch, API_BASE_URL, getApiInfo } from "../config/api";
import PasswordInput from "../components/PasswordInput";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Log where the API base comes from before calling
      try {
        const info = getApiInfo();
        console.info("[Login] Using API base", { base: API_BASE_URL, info });
      } catch (_) {}

      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: { username, password },
      });
      // decode token to get role and user id quickly (not secure, but fine for prototype)
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      onLogin(data.access_token, payload.role, payload.sub);
    } catch (e) {
      // Surface friendly messages; log details for debugging
      console.error("Login failed:", e);
      setError(e.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="site-header">
        <h1>Madestone Sports Academy</h1>
        <p>Coach and CEO portal</p>
      </div>
      <div className="login-center">
        <div className="card login-card">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to access your dashboard</p>
          <form className="login-form" onSubmit={submit}>
            <label htmlFor="username">Username</label>
            <input
              className="login-input"
              placeholder="Enter your username"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              disabled={loading}
            />
            <label htmlFor="password">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              id="password"
              name="password"
            />
            <button className="login-button" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>🔐 Sign In</>
              )}
            </button>
          </form>
          {error && <div className="login-error">❌ {error}</div>}
        </div>
      </div>
    </div>
  );
}
