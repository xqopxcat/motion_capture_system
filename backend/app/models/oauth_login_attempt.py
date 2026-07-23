from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.common import TimestampMixin


class OAuthLoginAttempt(TimestampMixin, Base):
    __tablename__ = "oauth_login_attempts"
    __table_args__ = (
        CheckConstraint("length(state_hash) = 64", name="oauth_attempt_state_hash_sha256"),
        CheckConstraint("expires_at > created_at", name="oauth_attempt_expiry_after_creation"),
        Index("ix_oauth_login_attempts_expiry_consumed", "expires_at", "consumed_at"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    state_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    code_verifier: Mapped[str] = mapped_column(String(128), nullable=False)
    nonce: Mapped[str] = mapped_column(String(128), nullable=False)
    return_path: Mapped[str] = mapped_column(String(2048), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
