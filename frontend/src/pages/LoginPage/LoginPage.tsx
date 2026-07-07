import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSafeRedirectTo } from "../../features/auth";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const [selectedAction, setSelectedAction] = useState<"google" | "mock" | null>(null);
  const redirectTo = useMemo(() => getSafeRedirectTo(searchParams), [searchParams]);

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
            type="button"
            onClick={() => setSelectedAction("google")}
          >
            Continue with Google
          </button>
          <button
            className={styles.secondaryAction}
            type="button"
            onClick={() => setSelectedAction("mock")}
          >
            Continue with Dev Login
          </button>
        </div>

        <section className={styles.intentPanel} aria-label="Login intent">
          <div>
            <span>Next destination</span>
            <strong>{redirectTo ?? "/dashboard"}</strong>
          </div>
          <p>
            The selected destination is preserved for the upcoming session boundary. Login API
            wiring will be added in the next task.
          </p>
        </section>

        {selectedAction && (
          <section className={styles.statusPanel} aria-live="polite">
            <h2>
              {selectedAction === "google" ? "Google sign-in pending" : "Dev login pending"}
            </h2>
            <p>
              This page is ready for the authentication contract, but no backend session request is
              sent yet.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
