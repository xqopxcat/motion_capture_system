from fastapi import APIRouter, Depends

from app.api.deps import current_user
from app.schemas.auth import CurrentUser
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import DashboardService


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    user: CurrentUser = Depends(current_user),
) -> DashboardSummaryResponse:
    return DashboardService().get_summary(user)
