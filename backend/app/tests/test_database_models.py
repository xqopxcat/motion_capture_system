from sqlalchemy import CheckConstraint, ForeignKeyConstraint, Index, UniqueConstraint

from app.db.base import Base
import app.models  # noqa: F401
from app.tests.factories import (
    make_annotation,
    make_artifact,
    make_metric_summary,
    make_record,
    make_session,
    make_user,
)


EXPECTED_TABLES = {
    "annotations",
    "artifacts",
    "auth_sessions",
    "metric_summaries",
    "metric_summary_items",
    "oauth_login_attempts",
    "records",
    "users",
}


def test_all_production_tables_are_registered() -> None:
    assert set(Base.metadata.tables) == EXPECTED_TABLES


def test_record_children_cascade_and_user_record_restrict() -> None:
    assert foreign_key_delete_rule("records", "owner_user_id") == "RESTRICT"
    assert foreign_key_delete_rule("artifacts", "record_id") == "CASCADE"
    assert foreign_key_delete_rule("metric_summaries", "record_id") == "CASCADE"
    assert foreign_key_delete_rule("metric_summary_items", "summary_id") == "CASCADE"
    assert foreign_key_delete_rule("annotations", "record_id") == "CASCADE"
    assert foreign_key_delete_rule("annotations", "author_user_id") == "RESTRICT"


def test_required_uniqueness_and_compatibility_indexes_exist() -> None:
    artifacts = Base.metadata.tables["artifacts"]
    assert has_unique_columns(artifacts, {"record_id", "artifact_type"})
    users = Base.metadata.tables["users"]
    assert has_unique_columns(users, {"identity_provider", "provider_subject"})
    items = Base.metadata.tables["metric_summary_items"]
    compatibility = next(index for index in items.indexes if index.name == "uq_metric_summary_items_compatibility")
    assert compatibility.unique
    assert compatibility.dialect_options["postgresql"]["nulls_not_distinct"] is True


def test_schema_has_check_constraints_and_owner_indexes() -> None:
    records = Base.metadata.tables["records"]
    assert any(isinstance(item, CheckConstraint) for item in records.constraints)
    assert "ix_records_owner_status_created" in {index.name for index in records.indexes}
    assert "ix_annotations_author_record" in {
        index.name for index in Base.metadata.tables["annotations"].indexes
    }


def test_factories_build_complete_relationship_graph() -> None:
    user = make_user()
    session = make_session(user)
    record = make_record(user)
    artifact = make_artifact(record)
    summary = make_metric_summary(record)
    annotation = make_annotation(record, user)

    assert session.user is user
    assert record.owner is user
    assert artifact.record is record
    assert summary.record is record
    assert summary.items[0].metric_definition_version == "1.0"
    assert annotation.record is record
    assert annotation.author is user


def foreign_key_delete_rule(table_name: str, column_name: str) -> str | None:
    table = Base.metadata.tables[table_name]
    constraint = next(
        item
        for item in table.constraints
        if isinstance(item, ForeignKeyConstraint) and column_name in item.column_keys
    )
    return next(iter(constraint.elements)).ondelete


def has_unique_columns(table, expected: set[str]) -> bool:
    constraints = [item for item in table.constraints if isinstance(item, UniqueConstraint)]
    return any({column.name for column in item.columns} == expected for item in constraints)
