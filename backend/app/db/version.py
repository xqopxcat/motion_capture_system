from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, text
from sqlalchemy.exc import ProgrammingError


BACKEND_ROOT = Path(__file__).resolve().parents[2]


def get_alembic_config() -> Config:
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "migrations"))
    return config


def get_expected_head_revision() -> str:
    heads = ScriptDirectory.from_config(get_alembic_config()).get_heads()
    if len(heads) != 1:
        raise RuntimeError(f"Expected exactly one Alembic head, found {len(heads)}.")
    return heads[0]


def get_database_revision(connection: Connection) -> str | None:
    try:
        return connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one_or_none()
    except ProgrammingError:
        return None
