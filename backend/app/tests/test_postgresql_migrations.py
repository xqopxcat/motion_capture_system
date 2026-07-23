import os

import pytest
from alembic import command
from sqlalchemy import create_engine, inspect, text

from app.db.testing import validate_test_database_target
from app.db.version import get_alembic_config, get_expected_head_revision


REQUIRED_TABLES = {
    "alembic_version",
    "annotations",
    "artifacts",
    "auth_sessions",
    "metric_summaries",
    "metric_summary_items",
    "records",
    "users",
}


def test_upgrade_downgrade_reupgrade_on_postgresql() -> None:
    if os.getenv("RUN_POSTGRES_MIGRATION_TESTS") != "1":
        pytest.skip(
            "PostgreSQL migration test requires RUN_POSTGRES_MIGRATION_TESTS=1 and an isolated TEST_DATABASE_URL.",
        )

    database_url = os.getenv("TEST_DATABASE_URL", "")
    validate_test_database_target(app_env=os.getenv("APP_ENV", ""), database_url=database_url)
    config = get_alembic_config()
    config.set_main_option("sqlalchemy.url", database_url)
    os.environ["DATABASE_URL"] = database_url

    command.downgrade(config, "base")
    command.upgrade(config, "head")

    engine = create_engine(database_url)
    try:
        inspector = inspect(engine)
        assert REQUIRED_TABLES.issubset(set(inspector.get_table_names()))
        with engine.connect() as connection:
            assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one() == get_expected_head_revision()

        assert any(index["name"] == "ix_records_owner_status_created" for index in inspector.get_indexes("records"))
        assert any(item["name"] == "uq_artifacts_record_id_artifact_type" for item in inspector.get_unique_constraints("artifacts"))

        command.downgrade(config, "base")
        assert set(inspect(engine).get_table_names()).issubset({"alembic_version"})
        command.upgrade(config, "head")
        assert REQUIRED_TABLES.issubset(set(inspect(engine).get_table_names()))
    finally:
        engine.dispose()
