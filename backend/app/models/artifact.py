from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class Artifact(TimestampMixin, Base):
    __tablename__ = "artifacts"
    __table_args__ = (
        CheckConstraint("length(id) > 0", name="artifact_id_nonempty"),
        CheckConstraint("artifact_type IN ('video', 'pose', 'metrics', 'thumbnail')", name="artifact_type_supported"),
        CheckConstraint("upload_state IN ('Pending', 'Complete', 'Failed')", name="artifact_upload_state_supported"),
        CheckConstraint("integrity_state IN ('Pending', 'Verified', 'Failed')", name="artifact_integrity_state_supported"),
        CheckConstraint("expected_file_size > 0", name="artifact_expected_size_positive"),
        CheckConstraint("validated_file_size IS NULL OR validated_file_size > 0", name="artifact_validated_size_positive"),
        CheckConstraint(
            "(checksum_algorithm IS NULL AND expected_checksum IS NULL) OR "
            "(checksum_algorithm IS NOT NULL AND expected_checksum IS NOT NULL)",
            name="artifact_expected_checksum_consistent",
        ),
        CheckConstraint(
            "validated_checksum IS NULL OR checksum_algorithm IS NOT NULL",
            name="artifact_validated_checksum_has_algorithm",
        ),
        UniqueConstraint("record_id", "artifact_type"),
        UniqueConstraint("storage_path"),
        Index("ix_artifacts_record_state", "record_id", "upload_state"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    record_id: Mapped[str] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    artifact_type: Mapped[str] = mapped_column(String(16), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    schema_version: Mapped[str | None] = mapped_column(String(64))
    content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    expected_file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    validated_file_size: Mapped[int | None] = mapped_column(BigInteger)
    checksum_algorithm: Mapped[str | None] = mapped_column(String(32))
    expected_checksum: Mapped[str | None] = mapped_column(String(256))
    validated_checksum: Mapped[str | None] = mapped_column(String(256))
    integrity_state: Mapped[str] = mapped_column(String(16), nullable=False, default="Pending")
    upload_state: Mapped[str] = mapped_column(String(16), nullable=False, default="Pending")
    object_generation: Mapped[str | None] = mapped_column(String(128))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    record = relationship("Record", back_populates="artifacts")
