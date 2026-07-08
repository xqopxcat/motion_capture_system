from fastapi import APIRouter

from app.api.v1 import auth, health, me, records, uploads

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(health.router)
api_router.include_router(me.router)
api_router.include_router(records.router)
api_router.include_router(uploads.router)
