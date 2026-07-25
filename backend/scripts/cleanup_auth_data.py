"""Guarded, explicit cleanup for retained OAuth attempts and auth sessions."""

import argparse

from app.core.config import Settings
from app.db.engine import build_engine
from app.db.session import build_session_factory, session_scope
from app.services.auth_cleanup_service import cleanup_auth_data


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--confirm-app-env",
        required=True,
        choices=("local", "test", "production_like", "production"),
        help="Must exactly match APP_ENV or the command exits without querying.",
    )
    parser.add_argument("--execute", action="store_true", help="Delete eligible rows; default is dry-run.")
    parser.add_argument("--batch-size", type=int, default=500)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    settings = Settings()
    if args.confirm_app_env != settings.app_env:
        print("refusing cleanup: --confirm-app-env does not match APP_ENV")
        return 2
    if not settings.database_url:
        print("refusing cleanup: DATABASE_URL is not configured")
        return 2

    engine = build_engine(settings)
    try:
        factory = build_session_factory(engine)
        with session_scope(factory) as session:
            result = cleanup_auth_data(
                session,
                oauth_retention_hours=settings.oauth_attempt_cleanup_retention_hours,
                session_retention_days=settings.auth_session_cleanup_retention_days,
                batch_size=args.batch_size,
                execute=args.execute,
            )
    finally:
        engine.dispose()

    mode = "executed" if result.executed else "dry-run"
    print(
        f"{mode}: oauth_login_attempts={result.oauth_attempts} "
        f"auth_sessions={result.auth_sessions} batch_limit={args.batch_size}",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
