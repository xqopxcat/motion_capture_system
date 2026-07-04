from fastapi import APIRouter

from app.api.v1 import health, records, uploads

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(records.router)
api_router.include_router(uploads.router)
