from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.models.oauth_login_attempt import OAuthLoginAttempt
from app.models.session import AuthSession


@dataclass(frozen=True)
class AuthCleanupResult:
    oauth_attempts: int
    auth_sessions: int
    executed: bool


def cleanup_auth_data(
    session: Session,
    *,
    now: datetime | None = None,
    oauth_retention_hours: int = 24,
    session_retention_days: int = 30,
    batch_size: int = 500,
    execute: bool = False,
) -> AuthCleanupResult:
    if batch_size <= 0 or batch_size > 10_000:
        raise ValueError("batch_size must be between 1 and 10000.")

    reference_time = now or datetime.now(timezone.utc)
    oauth_cutoff = reference_time - timedelta(hours=oauth_retention_hours)
    session_cutoff = reference_time - timedelta(days=session_retention_days)

    oauth_ids = list(
        session.scalars(
            select(OAuthLoginAttempt.id)
            .where(
                or_(
                    OAuthLoginAttempt.expires_at < oauth_cutoff,
                    OAuthLoginAttempt.consumed_at < oauth_cutoff,
                ),
            )
            .order_by(OAuthLoginAttempt.created_at)
            .limit(batch_size),
        ),
    )
    session_ids = list(
        session.scalars(
            select(AuthSession.id)
            .where(
                or_(
                    AuthSession.expires_at < session_cutoff,
                    AuthSession.revoked_at < session_cutoff,
                ),
            )
            .order_by(AuthSession.created_at)
            .limit(batch_size),
        ),
    )

    if execute:
        if oauth_ids:
            session.execute(delete(OAuthLoginAttempt).where(OAuthLoginAttempt.id.in_(oauth_ids)))
        if session_ids:
            session.execute(delete(AuthSession).where(AuthSession.id.in_(session_ids)))

    return AuthCleanupResult(
        oauth_attempts=len(oauth_ids),
        auth_sessions=len(session_ids),
        executed=execute,
    )
