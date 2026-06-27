import styles from "./PageShell.module.css";

type PageShellProps = {
  title: string;
  description: string;
};

export function PageShell({ title, description }: PageShellProps) {
  return (
    <main className={styles.shell}>
      <section className={styles.content}>
        <p className={styles.kicker}>Sprint 0 Shell</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
    </main>
  );
}
