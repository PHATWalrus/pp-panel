'use client';

import { useState } from "react";
import { loginAction } from "../actions/login";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function LoginPage() {
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.target);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="login-page" style={{ maxWidth: 460, margin: "4.5rem auto", padding: "1rem" }}>
      <Card strong style={{ padding: "1.4rem" }}>
        <h2 style={{ marginTop: 0, marginBottom: "0.35rem" }}>Operator Login</h2>
        <p className="panel-card-subtitle" style={{ marginBottom: "1.2rem" }}>
          Sign in to access live visitor controls.
        </p>
        <form onSubmit={handleSubmit}>
        {error && (
          <p style={{ color: "var(--panel-danger)", marginBottom: "1rem" }}>{error}</p>
        )}
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="email" className="panel-field-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="panel-input"
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="password" className="panel-field-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="panel-input"
          />
        </div>
        <Button type="submit" variant="primary">
          Sign in
        </Button>
      </form>
      </Card>
    </div>
  );
}
