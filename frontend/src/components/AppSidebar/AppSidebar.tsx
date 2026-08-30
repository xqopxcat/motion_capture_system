import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import type { CurrentUser } from "../../types";
import { AuthStatus } from "../AuthStatus/AuthStatus";
import styles from "./AppSidebar.module.css";

const navigation = [
  { to: "/dashboard", label: "Dashboard", description: "Overview", icon: "D" },
  { to: "/capture", label: "Capture", description: "Record motion", icon: "C" },
  { to: "/records", label: "Records", description: "Browse sessions", icon: "R" },
  { to: "/compare", label: "Compare", description: "Compare records", icon: "⇄" },
] as const;

export function AppSidebar({ currentUser }: { currentUser: CurrentUser }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      <header className={styles.mobileHeader}>
        <button
          aria-controls="application-sidebar"
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          className={styles.menuButton}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>
        <span className={styles.mobileBrand}>Motion Workspace</span>
      </header>

      {open && <button aria-label="Close navigation" className={styles.backdrop} onClick={() => setOpen(false)} type="button" />}

      <aside className={styles.sidebar} data-open={open} id="application-sidebar">
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">M</span>
          <div>
            <strong>Motion</strong>
            <span>Workspace</span>
          </div>
        </div>

        <nav className={styles.navigation} aria-label="Primary navigation">
          <p className={styles.navigationLabel}>Navigate</p>
          {navigation.map((item) => (
            <NavLink
              className={({ isActive }) => `${styles.navigationItem} ${isActive ? styles.active : ""}`}
              key={item.to}
              to={item.to}
            >
              <span className={styles.navigationIcon} aria-hidden="true">{item.icon}</span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.account}>
          <AuthStatus currentUser={currentUser} />
        </div>
      </aside>
    </>
  );
}
