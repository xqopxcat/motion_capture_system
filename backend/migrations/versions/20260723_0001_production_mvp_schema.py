"""Create the Production MVP PostgreSQL schema.

Revision ID: 20260723_0001
Revises: None
"""
from typing import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260723_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("identity_provider", sa.String(32), nullable=False),
        sa.Column("provider_subject", sa.String(255), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("display_name", sa.String(200), nullable=False),
        sa.Column("avatar_url", sa.String(2048)),
        *timestamps(),
        sa.CheckConstraint("length(id) > 0", name="user_id_nonempty"),
        sa.CheckConstraint("length(identity_provider) > 0", name="identity_provider_nonempty"),
        sa.CheckConstraint("length(provider_subject) > 0", name="provider_subject_nonempty"),
        sa.UniqueConstraint("identity_provider", "provider_subject", name="uq_users_identity_provider_provider_subject"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("token_hash", sa.String(128), nullable=False),
        sa.Column("user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("last_used_at", sa.DateTime(timezone=True)),
        *timestamps(),
        sa.CheckConstraint("length(id) > 0", name="session_id_nonempty"),
        sa.CheckConstraint("length(token_hash) > 0", name="session_token_hash_nonempty"),
        sa.CheckConstraint("expires_at > created_at", name="session_expiry_after_creation"),
        sa.UniqueConstraint("token_hash", name="uq_auth_sessions_token_hash"),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_index("ix_auth_sessions_expires_at", "auth_sessions", ["expires_at"])
    op.create_index("ix_auth_sessions_user_active", "auth_sessions", ["user_id", "expires_at", "revoked_at"])

    op.create_table(
        "records",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("owner_user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb"), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True)),
        sa.Column("duration", sa.Float()),
        sa.Column("fps", sa.Float()),
        sa.Column("frame_count", sa.Integer()),
        sa.Column("uploading_at", sa.DateTime(timezone=True)),
        sa.Column("processing_started_at", sa.DateTime(timezone=True)),
        sa.Column("ready_at", sa.DateTime(timezone=True)),
        sa.Column("failed_at", sa.DateTime(timezone=True)),
        sa.Column("failure_stage", sa.String(64)),
        sa.Column("failure_code", sa.String(128)),
        sa.Column("failure_message", sa.Text()),
        sa.Column("retryable", sa.Boolean()),
        sa.Column("retry_count", sa.Integer(), server_default="0", nullable=False),
        *timestamps(),
        sa.CheckConstraint("length(id) > 0", name="record_id_nonempty"),
        sa.CheckConstraint("length(title) > 0", name="record_title_nonempty"),
        sa.CheckConstraint("status IN ('Uploading', 'Processing', 'Ready', 'Failed')", name="record_status_supported"),
        sa.CheckConstraint("duration IS NULL OR duration > 0", name="record_duration_positive"),
        sa.CheckConstraint("fps IS NULL OR fps > 0", name="record_fps_positive"),
        sa.CheckConstraint("frame_count IS NULL OR frame_count >= 0", name="record_frame_count_nonnegative"),
        sa.CheckConstraint("retry_count >= 0", name="record_retry_count_nonnegative"),
        sa.CheckConstraint("(status = 'Failed') OR (failure_stage IS NULL AND failure_code IS NULL AND failure_message IS NULL AND failed_at IS NULL AND retryable IS NULL)", name="record_failure_fields_only_when_failed"),
    )
    op.create_index("ix_records_owner_created", "records", ["owner_user_id", "created_at"])
    op.create_index("ix_records_owner_status_created", "records", ["owner_user_id", "status", "created_at"])
    op.create_index("ix_records_owner_captured", "records", ["owner_user_id", "captured_at"])

    op.create_table(
        "artifacts",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("record_id", sa.String(64), sa.ForeignKey("records.id", ondelete="CASCADE"), nullable=False),
        sa.Column("artifact_type", sa.String(16), nullable=False),
        sa.Column("storage_path", sa.String(1024), nullable=False),
        sa.Column("schema_version", sa.String(64)),
        sa.Column("content_type", sa.String(255), nullable=False),
        sa.Column("expected_file_size", sa.BigInteger(), nullable=False),
        sa.Column("validated_file_size", sa.BigInteger()),
        sa.Column("checksum_algorithm", sa.String(32)),
        sa.Column("expected_checksum", sa.String(256)),
        sa.Column("validated_checksum", sa.String(256)),
        sa.Column("integrity_state", sa.String(16), nullable=False),
        sa.Column("upload_state", sa.String(16), nullable=False),
        sa.Column("object_generation", sa.String(128)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        *timestamps(),
        sa.CheckConstraint("length(id) > 0", name="artifact_id_nonempty"),
        sa.CheckConstraint("artifact_type IN ('video', 'pose', 'metrics', 'thumbnail')", name="artifact_type_supported"),
        sa.CheckConstraint("upload_state IN ('Pending', 'Complete', 'Failed')", name="artifact_upload_state_supported"),
        sa.CheckConstraint("integrity_state IN ('Pending', 'Verified', 'Failed')", name="artifact_integrity_state_supported"),
        sa.CheckConstraint("expected_file_size > 0", name="artifact_expected_size_positive"),
        sa.CheckConstraint("validated_file_size IS NULL OR validated_file_size > 0", name="artifact_validated_size_positive"),
        sa.CheckConstraint("(checksum_algorithm IS NULL AND expected_checksum IS NULL) OR (checksum_algorithm IS NOT NULL AND expected_checksum IS NOT NULL)", name="artifact_expected_checksum_consistent"),
        sa.CheckConstraint("validated_checksum IS NULL OR checksum_algorithm IS NOT NULL", name="artifact_validated_checksum_has_algorithm"),
        sa.UniqueConstraint("record_id", "artifact_type", name="uq_artifacts_record_id_artifact_type"),
        sa.UniqueConstraint("storage_path", name="uq_artifacts_storage_path"),
    )
    op.create_index("ix_artifacts_record_state", "artifacts", ["record_id", "upload_state"])

    op.create_table(
        "metric_summaries",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("record_id", sa.String(64), sa.ForeignKey("records.id", ondelete="CASCADE"), nullable=False),
        *timestamps(),
        sa.UniqueConstraint("record_id", name="uq_metric_summaries_record_id"),
    )

    op.create_table(
        "metric_summary_items",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("summary_id", sa.String(64), sa.ForeignKey("metric_summaries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("metric_id", sa.String(128), nullable=False),
        sa.Column("unit", sa.String(64)),
        sa.Column("metric_definition_version", sa.String(64)),
        sa.Column("activity_type", sa.String(128)),
        sa.Column("side", sa.String(32)),
        sa.Column("minimum", sa.Float(), nullable=False),
        sa.Column("maximum", sa.Float(), nullable=False),
        sa.Column("average", sa.Float(), nullable=False),
        sa.Column("range_of_motion", sa.Float(), nullable=False),
        sa.Column("standard_deviation", sa.Float()),
        *timestamps(),
        sa.CheckConstraint("length(metric_id) > 0", name="metric_summary_item_metric_id_nonempty"),
        sa.CheckConstraint("maximum >= minimum", name="metric_summary_item_range_valid"),
        sa.CheckConstraint("range_of_motion >= 0", name="metric_summary_item_rom_nonnegative"),
        sa.CheckConstraint("standard_deviation IS NULL OR standard_deviation >= 0", name="metric_summary_item_stddev_nonnegative"),
    )
    op.create_index("ix_metric_summary_items_metric_id", "metric_summary_items", ["metric_id"])
    op.create_index("ix_metric_summary_items_activity_side", "metric_summary_items", ["activity_type", "side"])
    op.create_index("ix_metric_summary_items_compatibility", "metric_summary_items", ["metric_id", "unit", "metric_definition_version", "activity_type", "side"])
    op.create_index(
        "uq_metric_summary_items_compatibility",
        "metric_summary_items",
        ["summary_id", "metric_id", "unit", "metric_definition_version", "activity_type", "side"],
        unique=True,
        postgresql_nulls_not_distinct=True,
    )

    op.create_table(
        "annotations",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("record_id", sa.String(64), sa.ForeignKey("records.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_user_id", sa.String(64), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("frame_index", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.Float(), nullable=False),
        sa.Column("joint_id", sa.Integer()),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("note", sa.Text(), server_default="", nullable=False),
        *timestamps(),
        sa.CheckConstraint("length(id) > 0", name="annotation_id_nonempty"),
        sa.CheckConstraint("frame_index >= 0", name="annotation_frame_nonnegative"),
        sa.CheckConstraint("timestamp >= 0", name="annotation_timestamp_nonnegative"),
        sa.CheckConstraint("length(title) > 0", name="annotation_title_nonempty"),
    )
    op.create_index("ix_annotations_record_frame_created", "annotations", ["record_id", "frame_index", "created_at"])
    op.create_index("ix_annotations_author_record", "annotations", ["author_user_id", "record_id"])


def downgrade() -> None:
    op.drop_table("annotations")
    op.drop_table("metric_summary_items")
    op.drop_table("metric_summaries")
    op.drop_table("artifacts")
    op.drop_table("records")
    op.drop_table("auth_sessions")
    op.drop_table("users")
