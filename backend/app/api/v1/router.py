from fastapi import APIRouter

from app.api.v1 import annotations, auth, dashboard, health, me, records, uploads

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(health.router)
api_router.include_router(me.router)
api_router.include_router(records.router)
api_router.include_router(dashboard.router)
api_router.include_router(annotations.router)
api_router.include_router(uploads.router)
