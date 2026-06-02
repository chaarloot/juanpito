from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import engine
from app.routers import usuarios
from app.routers import alertas, auth, habitos, medicacion, metricas, planes, sesiones


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Vitalia CJ API",
    description="API REST para la plataforma Vitalia Tracker – gestión de salud y bienestar.",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False,
)
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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
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
