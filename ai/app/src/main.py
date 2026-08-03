from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import chat, documents, health
from .shared.vectorstore import ensure_collection

app = FastAPI(title="S.M.I.L.E AI Booking Agent")


@app.on_event("startup")
async def _on_startup() -> None:
    ensure_collection()

settings = get_settings()
origins = ["*"] if settings.cors_origins == "*" else settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(documents.router)
