import os

import pytest

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("REPOSITORY_ADAPTER", "in_memory")

from app.api.deps import get_repository_bundle
from app.main import app
from app.repositories.runtime_repositories import (
    RepositoryBundle,
    create_in_memory_repository_bundle,
)


@pytest.fixture(autouse=True)
def explicit_unit_repository_bundle() -> RepositoryBundle:
    """Keep legacy API tests fast while making in-memory use explicit and isolated."""
    bundle = create_in_memory_repository_bundle()
    app.dependency_overrides[get_repository_bundle] = lambda: bundle
    try:
        yield bundle
    finally:
        app.dependency_overrides.pop(get_repository_bundle, None)
