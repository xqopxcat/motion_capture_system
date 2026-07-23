import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSafeRedirectTo } from "../../features/auth";
import { useDevLoginMutation } from "../../services/authApi";
import styles from "./LoginPage.module.css";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
const devAuthEnabled = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_ENABLED === "true";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [devLogin, { error, isLoading }] = useDevLoginMutation();
  const redirectTo = useMemo(() => getSafeRedirectTo(searchParams), [searchParams]);
  const nextPath = redirectTo ?? "/dashboard";
  const googleLoginUrl = `${apiBaseUrl}/auth/google/start?returnTo=${encodeURIComponent(nextPath)}`;

  async function handleDevLogin() {
    try {
      await devLogin({ provider: "dev" }).unwrap();
      navigate(nextPath, { replace: true });
    } catch {
      // RTK Query error state is rendered below.
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginPanel} aria-labelledby="login-title">
        <div className={styles.header}>
          <p className={styles.kicker}>Secure authentication</p>
          <h1 id="login-title">Sign in to Motion Capture Platform</h1>
          <p>Continue with Google to access your protected workspace.</p>
        </div>

        <div className={styles.actionStack} aria-label="Login actions">
          <a className={styles.primaryAction} href={googleLoginUrl}>
            Continue with Google
          </a>
          {devAuthEnabled && (
            <button
              className={styles.secondaryAction}
              disabled={isLoading}
              type="button"
              onClick={() => void handleDevLogin()}
            >
              {isLoading ? "Starting local development login" : "Local development login"}
            </button>
          )}
        </div>

        <section className={styles.intentPanel} aria-label="Login intent">
          <div>
            <span>Next destination</span>
            <strong>{nextPath}</strong>
          </div>
          <p>The backend validates this destination before completing authentication.</p>
        </section>

        {(error || searchParams.get("error")) && (
          <section className={styles.errorPanel} role="alert">
            <h2>Login failed</h2>
            <p>Authentication did not complete. Please try again.</p>
          </section>
        )}
      </section>
    </main>
  );
}
