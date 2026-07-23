from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class Record(TimestampMixin, Base):
    __tablename__ = "records"
    __table_args__ = (
        CheckConstraint("length(id) > 0", name="record_id_nonempty"),
        CheckConstraint("length(title) > 0", name="record_title_nonempty"),
        CheckConstraint(
            "status IN ('Uploading', 'Processing', 'Ready', 'Failed')",
            name="record_status_supported",
        ),
        CheckConstraint("duration IS NULL OR duration > 0", name="record_duration_positive"),
        CheckConstraint("fps IS NULL OR fps > 0", name="record_fps_positive"),
        CheckConstraint("frame_count IS NULL OR frame_count >= 0", name="record_frame_count_nonnegative"),
        CheckConstraint("retry_count >= 0", name="record_retry_count_nonnegative"),
        CheckConstraint(
            "(status = 'Failed') OR (failure_stage IS NULL AND failure_code IS NULL "
            "AND failure_message IS NULL AND failed_at IS NULL AND retryable IS NULL)",
            name="record_failure_fields_only_when_failed",
        ),
        Index("ix_records_owner_created", "owner_user_id", "created_at"),
        Index("ix_records_owner_status_created", "owner_user_id", "status", "created_at"),
        Index("ix_records_owner_captured", "owner_user_id", "captured_at"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")
    tags: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list, server_default="[]")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="Uploading")
    captured_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration: Mapped[float | None] = mapped_column(Float)
    fps: Mapped[float | None] = mapped_column(Float)
    frame_count: Mapped[int | None] = mapped_column(Integer)
    uploading_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    processing_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failure_stage: Mapped[str | None] = mapped_column(String(64))
    failure_code: Mapped[str | None] = mapped_column(String(128))
    failure_message: Mapped[str | None] = mapped_column(Text)
    retryable: Mapped[bool | None] = mapped_column(Boolean)
    retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    owner = relationship("User", back_populates="records")
    artifacts = relationship("Artifact", back_populates="record", cascade="all, delete-orphan", passive_deletes=True)
    metric_summary = relationship("MetricSummary", back_populates="record", cascade="all, delete-orphan", passive_deletes=True, uselist=False)
    annotations = relationship("Annotation", back_populates="record", cascade="all, delete-orphan", passive_deletes=True)
