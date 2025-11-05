import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const submit = async () => {
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      // decode token to get role and user id quickly (not secure, but fine for prototype)
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      onLogin(data.access_token, payload.role, payload.sub);
    } catch (e) {
      setError(e.message);
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
          <h2 className="login-title">Welcome back — please sign in</h2>
          <label htmlFor="username">Username</label>
          <input
            placeholder="username"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            placeholder="password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={submit}>Login</button>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    </div>
  );
}
