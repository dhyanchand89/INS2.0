import { useState } from "react";

function Register({ apiUrl, onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setSuccess("Registration successful. Please login.");
      setUsername("");
      setEmail("");
      setPassword("");
    } catch {
      setError("Unable to reach server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-4 p-7 sm:p-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-slate-900">Create Account</h2>
        <p className="mt-1 text-sm text-slate-600">Register to start secure conversations.</p>
      </div>

      <label className="block">
        <span className="field-label">Username</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="field-input"
          placeholder="dhyanchand"
          required
        />
      </label>

      <label className="block">
        <span className="field-label">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field-input"
          placeholder="student@nmamit.in"
          required
        />
      </label>

      <label className="block">
        <span className="field-label">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field-input"
          placeholder="Minimum 6 characters"
          minLength={6}
          required
        />
      </label>

      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

      <button type="submit" disabled={loading} className="primary-button w-full disabled:opacity-60">
        {loading ? "Creating account..." : "Register"}
      </button>

      <p className="text-sm text-slate-600">
        Already registered?{" "}
        <button type="button" className="font-semibold text-slate-900 underline" onClick={onSwitchToLogin}>
          Go to login
        </button>
      </p>
    </form>
  );
}

export default Register;
