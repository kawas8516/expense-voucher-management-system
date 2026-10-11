import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { getErrorMsg } from "../api/axios";

// demo users from the seed script (same password for all)
const DEMO_USERS = [
  { role: "Employee", email: "employee@test.com" },
  { role: "Director", email: "director@test.com" },
  { role: "Accounts", email: "accounts@test.com" },
];
const DEMO_PASSWORD = "password123";

// free hosting puts the API to sleep, first request can take ~1 min
const WAKE_LIMIT_MS = 90000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOW_PASSWORD_MS = 10000; // password hides again by itself after 10s

function EyeIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <line x1="3" y1="3" x2="21" y2="21" />}
    </svg>
  );
}

// true when the server is down / waking up (not a real login error)
function isServerAsleep(err) {
  if (!err.response) return true; // network error / timeout
  return [502, 503, 504].includes(err.response.status);
}

function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  // checking -> waking (if slow) -> ready / down
  const [serverStatus, setServerStatus] = useState("checking");
  const [showPassword, setShowPassword] = useState(false);

  // auto hide the password again so it is not left visible on screen
  useEffect(() => {
    if (!showPassword) return;
    const t = setTimeout(() => setShowPassword(false), SHOW_PASSWORD_MS);
    return () => clearTimeout(t);
  }, [showPassword]);

  // wake the server as soon as the page opens, while the user types
  useEffect(() => {
    let stopped = false;
    const start = Date.now();
    const slowTimer = setTimeout(() => {
      if (!stopped) setServerStatus((s) => (s === "checking" ? "waking" : s));
    }, 2500);

    async function ping() {
      while (!stopped && Date.now() - start < WAKE_LIMIT_MS) {
        try {
          await api.get("/health", { timeout: 20000 });
          if (!stopped) setServerStatus("ready");
          return;
        } catch {
          await sleep(3000);
        }
      }
      if (!stopped) setServerStatus("down");
    }
    ping();

    return () => {
      stopped = true;
      clearTimeout(slowTimer);
    };
  }, []);

  // already logged in
  if (user) {
    return <Navigate to={"/" + user.role} />;
  }

  function validate() {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    const start = Date.now();
    // keep retrying while the server is still waking up
    while (true) {
      try {
        const u = await login(email.trim(), password);
        navigate("/" + u.role);
        return;
      } catch (err) {
        if (isServerAsleep(err) && Date.now() - start < WAKE_LIMIT_MS) {
          setServerStatus("waking");
          await sleep(3000);
          continue;
        }
        setServerError(
          isServerAsleep(err) ? "Server is not responding. Please try again in a minute." : getErrorMsg(err)
        );
        break;
      }
    }
    setLoading(false);
  }

  function fillDemo(demoEmail) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setServerError("");
  }

  return (
    <div className="login-box">
      <h1 className="login-title">Expense Voucher Management System</h1>
      <h2>Login</h2>

      {serverStatus === "waking" && (
        <div className="info" role="status">
          Starting the server (free hosting sleeps when idle). This can take up to a minute, you can fill the form meanwhile.
        </div>
      )}
      {serverStatus === "down" && (
        <div className="alert" role="alert">Server is not responding right now. Please refresh in a minute.</div>
      )}
      {serverError && <div className="alert" role="alert">{serverError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "login-email-error" : undefined}
        />
        {errors.email && <div id="login-email-error" className="error">{errors.email}</div>}

        <label htmlFor="login-password">Password</label>
        <div className="password-wrap">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "login-password-error" : undefined}
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            title={showPassword ? "Hide password" : "Show password (hides after 10 seconds)"}
          >
            <EyeIcon open={!showPassword} />
          </button>
        </div>
        {errors.password && <div id="login-password-error" className="error">{errors.password}</div>}

        <button type="submit" disabled={loading}>
          {loading ? (serverStatus === "waking" ? "Waiting for server..." : "Logging in...") : "Login"}
        </button>
      </form>

      <div className="demo-box">
        <b>Demo accounts</b> (password: <code>{DEMO_PASSWORD}</code>)
        <p className="small">Click to fill the form:</p>
        <div className="demo-buttons">
          {DEMO_USERS.map((d) => (
            <button key={d.email} type="button" className="btn-grey" onClick={() => fillDemo(d.email)}>
              {d.role}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Login;
