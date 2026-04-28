from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import engine
from app.models import models
from app.routers import usuarios
from app.routers import alertas, auth, habitos, medicacion, metricas, planes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: crear tablas si no existen
    models.Base.metadata.create_all(bind=engine)
    yield
    # Shutdown (si se necesita limpieza)


app = FastAPI(
    title="Vitalia CJ API",
    description="API REST para la plataforma Vitalia Tracker – gestión de salud y bienestar.",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Ajusta en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── ROUTERS ─────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(metricas.router)
app.include_router(habitos.router)
app.include_router(medicacion.router)
app.include_router(planes.router)
app.include_router(alertas.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Vitalia CJ API funcionando correctamente"}
