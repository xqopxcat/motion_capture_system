import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { baseApi } from "../../services/baseApi";
import { useLogoutMutation } from "../../services/authApi";
import type { AppDispatch } from "../../store/store";
import type { CurrentUser } from "../../types";
import styles from "./AuthStatus.module.css";

type AuthStatusProps = {
  currentUser: CurrentUser;
};

export function AuthStatus({ currentUser }: AuthStatusProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [logout, { isLoading }] = useLogoutMutation();
  const [hasError, setHasError] = useState(false);

  async function handleLogout() {
    setHasError(false);

    try {
      await logout().unwrap();
      dispatch(baseApi.util.resetApiState());
      navigate("/login", { replace: true });
    } catch {
      setHasError(true);
    }
  }

  return (
    <aside className={styles.authStatus} aria-label="Account">
      <span className={styles.userName}>{currentUser.displayName}</span>
      <button
        className={styles.logoutButton}
        disabled={isLoading}
        type="button"
        onClick={() => void handleLogout()}
      >
        {isLoading ? "Signing out" : "Logout"}
      </button>
      {hasError && (
        <span className={styles.errorMessage} role="alert">
          Logout failed
        </span>
      )}
    </aside>
  );
}
