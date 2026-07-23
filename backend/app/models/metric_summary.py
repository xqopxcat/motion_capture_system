from __future__ import annotations

from sqlalchemy import CheckConstraint, Float, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.common import TimestampMixin


class MetricSummary(TimestampMixin, Base):
    __tablename__ = "metric_summaries"
    __table_args__ = (UniqueConstraint("record_id"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    record_id: Mapped[str] = mapped_column(ForeignKey("records.id", ondelete="CASCADE"), nullable=False)

    record = relationship("Record", back_populates="metric_summary")
    items = relationship("MetricSummaryItem", back_populates="summary", cascade="all, delete-orphan", passive_deletes=True)


class MetricSummaryItem(TimestampMixin, Base):
    __tablename__ = "metric_summary_items"
    __table_args__ = (
        CheckConstraint("length(metric_id) > 0", name="metric_summary_item_metric_id_nonempty"),
        CheckConstraint("maximum >= minimum", name="metric_summary_item_range_valid"),
        CheckConstraint("range_of_motion >= 0", name="metric_summary_item_rom_nonnegative"),
        CheckConstraint("standard_deviation IS NULL OR standard_deviation >= 0", name="metric_summary_item_stddev_nonnegative"),
        Index("ix_metric_summary_items_metric_id", "metric_id"),
        Index("ix_metric_summary_items_activity_side", "activity_type", "side"),
        Index(
            "uq_metric_summary_items_compatibility",
            "summary_id",
            "metric_id",
            "unit",
            "metric_definition_version",
            "activity_type",
            "side",
            unique=True,
            postgresql_nulls_not_distinct=True,
        ),
        Index(
            "ix_metric_summary_items_compatibility",
            "metric_id",
            "unit",
            "metric_definition_version",
            "activity_type",
            "side",
        ),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    summary_id: Mapped[str] = mapped_column(ForeignKey("metric_summaries.id", ondelete="CASCADE"), nullable=False)
    metric_id: Mapped[str] = mapped_column(String(128), nullable=False)
    unit: Mapped[str | None] = mapped_column(String(64))
    metric_definition_version: Mapped[str | None] = mapped_column(String(64))
    activity_type: Mapped[str | None] = mapped_column(String(128))
    side: Mapped[str | None] = mapped_column(String(32))
    minimum: Mapped[float] = mapped_column(Float, nullable=False)
    maximum: Mapped[float] = mapped_column(Float, nullable=False)
    average: Mapped[float] = mapped_column(Float, nullable=False)
    range_of_motion: Mapped[float] = mapped_column(Float, nullable=False)
    standard_deviation: Mapped[float | None] = mapped_column(Float)

    summary = relationship("MetricSummary", back_populates="items")
