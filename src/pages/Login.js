import React, { useState } from "react";
import { apiFetch, API_BASE_URL, getApiInfo } from "../config/api";

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
          <p
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.6)",
              fontSize: "14px",
              marginBottom: "24px",
            }}
          >
            Sign in to access your dashboard
          </p>
          <form onSubmit={submit}>
            <label htmlFor="username">Username</label>
            <input
              placeholder="Enter your username"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              disabled={loading}
            />
            <label htmlFor="password">Password</label>
            <input
              placeholder="Enter your password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && submit(e)}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: "16px", width: "100%" }}
            >
              {loading ? (
                <>
                  <span
                    className="loading-spinner"
                    style={{
                      width: 16,
                      height: 16,
                      borderWidth: 2,
                      marginRight: 8,
                    }}
                  ></span>
                  Signing in...
                </>
              ) : (
                <>🔐 Sign In</>
              )}
            </button>
          </form>
          {error && (
            <div
              className="error"
              style={{ marginTop: "16px", textAlign: "center" }}
            >
              ❌ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
