import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLock, FaUser, FaChartLine } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../lib/api.js";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });

      const { data } = response.data;

      login({
        role: data.role,
        staffUsername: data.role === "staff" ? username.trim().toLowerCase() : null,
        clientId: data.clientId,
        staffId: data.staffId,
        userId: data.userId,
        token: data.token,
      });

      const nextPath = searchParams.get("next");
      const allowedNext = [
        "/admin-dashboard",
        "/admin-dashboard/pricing",
        "/admin/service-pricing",
        "/staff",
        "/staff/clients",
        "/staff/profile",
        "/staff/notes",
        "/staff/dashboard",
        "/staff/dashboard/content",
        "/staff/dashboard/meta",
        "/staff-dashboard",
        "/client",
        "/client/dashboard",
        "/client/dashboard/content",
        "/client/dashboard/meta",
        "/client/profile",
        "/client/notes",
        "/client-dashboard",
      ];
      const staffNextOk = typeof nextPath === "string" && nextPath.startsWith("/staff/");
      const clientNextOk = typeof nextPath === "string" && nextPath.startsWith("/client/");
      const destination =
        nextPath && (allowedNext.includes(nextPath) || staffNextOk || clientNextOk)
          ? nextPath
          : data.dashboard;
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.illustration}>
          <div className={styles.illustrationContent}>
            <h2 className={styles.illustrationTitle}>Pixdot Workspace</h2>
            <p className={styles.illustrationSub}>
              Manage your digital marketing strategy, content tracking, and ad campaigns seamlessly.
            </p>
            <div className={styles.illustrationGraphic}>
              <div className={styles.graphicCircle}>
                <FaChartLine className={styles.graphicIcon} aria-hidden />
              </div>
            </div>
          </div>
          <div className={styles.illustrationOverlay}></div>
        </div>

        <section className={styles.card}>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.sub}>
            Admin uses <code>admin</code>. Staff and clients use their portal usernames. Default password is{" "}
            <code>123456</code> until changed in admin Settings.
          </p>

          <form onSubmit={handleLogin} className={styles.form} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-username">
                Username
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon} aria-hidden>
                  <FaUser />
                </span>
                <input
                  id="login-username"
                  type="text"
                  className={styles.input}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your username..."
                  autoComplete="username"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="login-password">
                Password
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon} aria-hidden>
                  <FaLock />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className={styles.input}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password..."
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.toggleBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
                </button>
              </div>
            </div>

            {error ? <p className={styles.error} role="alert">{error}</p> : null}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
