from __future__ import annotations

from sqlalchemy import CheckConstraint, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("length(id) > 0", name="user_id_nonempty"),
        CheckConstraint("length(identity_provider) > 0", name="identity_provider_nonempty"),
        CheckConstraint("length(provider_subject) > 0", name="provider_subject_nonempty"),
        UniqueConstraint("identity_provider", "provider_subject"),
        Index("ix_users_email", "email"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    identity_provider: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(2048))

    sessions = relationship("AuthSession", back_populates="user", cascade="all, delete-orphan")
    records = relationship("Record", back_populates="owner", passive_deletes=True)
    authored_annotations = relationship("Annotation", back_populates="author", passive_deletes=True)
