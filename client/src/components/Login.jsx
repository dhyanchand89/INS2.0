import { useState } from "react";

function Login({ apiUrl, onAuthSuccess, onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      onAuthSuccess(data);
    } catch {
      setError("Unable to reach server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-4 p-7 sm:p-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-slate-900">Welcome Back</h2>
        <p className="mt-1 text-sm text-slate-600">Log in to your secure chat workspace.</p>
      </div>

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
          placeholder="Enter your password"
          required
        />
      </label>

      {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

      <button type="submit" disabled={loading} className="primary-button w-full disabled:opacity-60">
        {loading ? "Logging in..." : "Login"}
      </button>

      <p className="text-sm text-slate-600">
        New user?{" "}
        <button type="button" className="font-semibold text-slate-900 underline" onClick={onSwitchToRegister}>
          Create an account
        </button>
      </p>
    </form>
  );
}

export default Login;
