import { useEffect, useState } from "react";
import Chat from "./components/Chat";
import Login from "./components/Login";
import Register from "./components/Register";

// On Vercel, fall back to the current origin (the deployed frontend domain).
// For real backend + Socket.IO, you should still set `VITE_API_URL` / `VITE_SOCKET_URL` in Vercel env vars.
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;
const TOKEN_STORAGE_KEY = "secure_chat_token";
const USER_STORAGE_KEY = "secure_chat_user";

const getStoredUser = () => {
  const rawUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [user, setUser] = useState(getStoredUser);
  const [authView, setAuthView] = useState("login");

  useEffect(() => {
    if (token && user) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, [token, user]);

  const handleAuthSuccess = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setAuthView("login");
  };

  if (token && user) {
    return <Chat apiUrl={API_URL} token={token} user={user} onLogout={handleLogout} />;
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_20%_10%,rgba(8,145,178,0.15),transparent),radial-gradient(60%_55%_at_90%_10%,rgba(234,88,12,0.17),transparent),radial-gradient(80%_70%_at_50%_100%,rgba(15,23,42,0.08),transparent)]" />
      <div className="w-full max-w-5xl">
        <div className="mb-6 text-center sm:mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-500">Information and Network Security</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-slate-900 sm:text-5xl">
            Secure Chat Application
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Real-time messaging with JWT authentication, WebSocket delivery, and client-side AES-256 encryption.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass-card p-6 sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Why This Matters</h2>
            <ul className="mt-5 space-y-4 text-sm text-slate-700 sm:text-base">
              <li className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
                JWT-based session handling protects chat endpoints from unauthorized access.
              </li>
              <li className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
                Socket layer supports low-latency message events between two authenticated users.
              </li>
              <li className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
                Messages are encrypted in-browser before transport and decrypted only on the receiving client.
              </li>
            </ul>
          </section>

          <section>
            {authView === "login" ? (
              <Login
                apiUrl={API_URL}
                onAuthSuccess={handleAuthSuccess}
                onSwitchToRegister={() => setAuthView("register")}
              />
            ) : (
              <Register apiUrl={API_URL} onSwitchToLogin={() => setAuthView("login")} />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
