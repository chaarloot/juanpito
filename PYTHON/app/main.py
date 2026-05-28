import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import engine
from app.routers import usuarios
from app.routers import alertas, auth, habitos, medicacion, metricas, planes, sesiones


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Note: tests manage DB creation themselves. Avoid creating tables here
    # to prevent cross-engine contamination during test runs.
    yield
    # Shutdown (si se necesita limpieza)


app = FastAPI(
    title="Vitalia CJ API",
    description="API REST para la plataforma Vitalia Tracker – gestión de salud y bienestar.",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "null",
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    # Vercel y cualquier puerto local habitual para Live Server / desarrollo.
    allow_origin_regex=os.getenv(
        "CORS_ALLOW_ORIGIN_REGEX",
        r"^https://.*\.vercel\.app$|^https://.*\.vercel\.dev$|^http://localhost(:\d+)?$|^http://127\.0\.0\.1(:\d+)?$",
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTERS
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(metricas.router)
app.include_router(habitos.router)
app.include_router(medicacion.router)
app.include_router(planes.router)
app.include_router(alertas.router)
app.include_router(sesiones.router)



@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Vitalia CJ API funcionando correctamente"}
