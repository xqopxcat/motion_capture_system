import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getLoginRedirect, getProtectedRouteState } from "../../features/auth/protectedRouteIntent";
import { useGetCurrentUserQuery } from "../../services/authApi";
import { AuthStatus } from "../AuthStatus/AuthStatus";
import styles from "./ProtectedRoute.module.css";

export function ProtectedRoute() {
  const location = useLocation();
  const { data: currentUser, isLoading } = useGetCurrentUserQuery();
  const state = getProtectedRouteState(Boolean(currentUser), isLoading);

  if (state === "loading") {
    return (
      <main className={styles.loadingState} aria-busy="true" aria-live="polite">
        <div className={styles.spinner} aria-hidden="true" />
        <p>Checking session</p>
      </main>
    );
  }

  if (state === "unauthenticated") {
    return (
      <Navigate
        to={getLoginRedirect(location.pathname, location.search)}
        replace
      />
    );
  }

  return (
    <>
      <AuthStatus currentUser={currentUser!} />
      <Outlet />
    </>
  );
}
