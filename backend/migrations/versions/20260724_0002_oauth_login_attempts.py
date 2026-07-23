"""add durable oauth login attempts

Revision ID: 20260724_0002
Revises: 20260723_0001
Create Date: 2026-07-24
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260724_0002"
down_revision: str | None = "20260723_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "oauth_login_attempts",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("state_hash", sa.String(length=64), nullable=False),
        sa.Column("code_verifier", sa.String(length=128), nullable=False),
        sa.Column("nonce", sa.String(length=128), nullable=False),
        sa.Column("return_path", sa.String(length=2048), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("expires_at > created_at", name="oauth_attempt_expiry_after_creation"),
        sa.CheckConstraint("length(state_hash) = 64", name="oauth_attempt_state_hash_sha256"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("state_hash"),
    )
    op.create_index("ix_oauth_login_attempts_expiry_consumed", "oauth_login_attempts", ["expires_at", "consumed_at"])


def downgrade() -> None:
    op.drop_index("ix_oauth_login_attempts_expiry_consumed", table_name="oauth_login_attempts")
    op.drop_table("oauth_login_attempts")
