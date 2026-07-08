import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getSafeRedirectTo } from "../../features/auth";
import { useMockLoginMutation } from "../../services/authApi";
import type { AuthProvider } from "../../types";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mockLogin, { error, isLoading }] = useMockLoginMutation();
  const [selectedAction, setSelectedAction] = useState<AuthProvider | null>(null);
  const redirectTo = useMemo(() => getSafeRedirectTo(searchParams), [searchParams]);
  const nextPath = redirectTo ?? "/dashboard";

  async function handleLogin(provider: AuthProvider) {
    setSelectedAction(provider);

    try {
      await mockLogin({ provider }).unwrap();
      navigate(nextPath, { replace: true });
    } catch {
      // RTK Query exposes the error state for rendering below.
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginPanel} aria-labelledby="login-title">
        <div className={styles.header}>
          <p className={styles.kicker}>Authentication MVP</p>
          <h1 id="login-title">Sign in to Motion Capture Platform</h1>
          <p>
            Use a Google account or the development login entry point to continue into the
            protected workspace.
          </p>
        </div>

        <div className={styles.actionStack} aria-label="Login actions">
          <button
            className={styles.primaryAction}
            disabled={isLoading}
            type="button"
            onClick={() => void handleLogin("google")}
          >
            {isLoading && selectedAction === "google" ? "Connecting to Google" : "Continue with Google"}
          </button>
          <button
            className={styles.secondaryAction}
            disabled={isLoading}
            type="button"
            onClick={() => void handleLogin("dev")}
          >
            {isLoading && selectedAction === "dev" ? "Starting Dev Login" : "Continue with Dev Login"}
          </button>
        </div>

        <section className={styles.intentPanel} aria-label="Login intent">
          <div>
            <span>Next destination</span>
            <strong>{nextPath}</strong>
          </div>
          <p>
            The selected destination is used after the mock authentication contract succeeds.
            External redirect targets are ignored.
          </p>
        </section>

        {isLoading && selectedAction && (
          <section className={styles.statusPanel} aria-live="polite">
            <h2>
              {selectedAction === "google" ? "Google sign-in mock flow" : "Dev login mock flow"}
            </h2>
            <p>
              Creating a backend-owned mock session cookie. No real Google APIs are called.
            </p>
          </section>
        )}

        {error && (
          <section className={styles.errorPanel} role="alert">
            <h2>Login failed</h2>
            <p>The mock authentication contract did not complete. Try again.</p>
          </section>
        )}
      </section>
    </main>
  );
}
