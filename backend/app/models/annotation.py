from __future__ import annotations

from sqlalchemy import CheckConstraint, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class Annotation(TimestampMixin, Base):
    __tablename__ = "annotations"
    __table_args__ = (
        CheckConstraint("length(id) > 0", name="annotation_id_nonempty"),
        CheckConstraint("frame_index >= 0", name="annotation_frame_nonnegative"),
        CheckConstraint("timestamp >= 0", name="annotation_timestamp_nonnegative"),
        CheckConstraint("length(title) > 0", name="annotation_title_nonempty"),
        Index("ix_annotations_record_frame_created", "record_id", "frame_index", "created_at"),
        Index("ix_annotations_author_record", "author_user_id", "record_id"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    record_id: Mapped[str] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"), nullable=False)
    author_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    frame_index: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[float] = mapped_column(Float, nullable=False)
    joint_id: Mapped[int | None] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False, default="", server_default="")

    record = relationship("Record", back_populates="annotations")
    author = relationship("User", back_populates="authored_annotations")
