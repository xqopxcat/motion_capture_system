from functools import lru_cache

from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.engine import build_engine
from app.db.session import build_session_factory


@lru_cache(maxsize=1)
def get_runtime_engine() -> Engine:
    if settings.repository_adapter != "postgresql":
        raise RuntimeError("Normal runtime requires the PostgreSQL repository adapter.")
    return build_engine(settings)


@lru_cache(maxsize=1)
def get_runtime_session_factory() -> sessionmaker[Session]:
    return build_session_factory(get_runtime_engine())


def reset_runtime_database_caches() -> None:
    if get_runtime_engine.cache_info().currsize:
        get_runtime_engine().dispose()
    get_runtime_session_factory.cache_clear()
    get_runtime_engine.cache_clear()
