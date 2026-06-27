from app.repositories.health_repository import HealthRepository
from app.schemas.health import HealthResponse


class HealthService:
    def __init__(self, repository: HealthRepository | None = None) -> None:
        self.repository = repository or HealthRepository()

    def check(self) -> HealthResponse:
        return HealthResponse(status=self.repository.status())
