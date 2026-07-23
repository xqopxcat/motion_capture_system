from dataclasses import dataclass
from uuid import uuid4

from sqlalchemy.engine import make_url


@dataclass(frozen=True)
class TestDatabaseTarget:
    url: str
    schema_name: str


def validate_test_database_target(*, app_env: str, database_url: str) -> TestDatabaseTarget:
    if app_env != "test":
        raise RuntimeError("Destructive database test setup requires APP_ENV=test.")

    url = make_url(database_url)
    if url.get_backend_name() != "postgresql":
        raise RuntimeError("Database integration tests require PostgreSQL.")
    if not url.database or not url.database.endswith("_test"):
        raise RuntimeError("TEST_DATABASE_URL database name must end with '_test'.")

    return TestDatabaseTarget(
        url=database_url,
        schema_name=f"test_{uuid4().hex}",
    )
