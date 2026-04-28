from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import engine, SessionLocal
from app.core.security import hash_password
from app.models import models
from app.models.models import Usuario
from app.routers import usuarios
from app.routers import alertas, auth, habitos, medicacion, metricas, planes, sesiones


DEMO_EMAIL = "demo@vitaliacj.com"
DEMO_PASSWORD = "Vitalia2026!"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: crear tablas si no existen
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        demo_user = db.query(Usuario).filter(Usuario.email == DEMO_EMAIL).first()

        if not demo_user:
            db.add(
                Usuario(
                    email=DEMO_EMAIL,
                    password_hash=hash_password(DEMO_PASSWORD),
                    nombre="Demo",
                    apellidos="Vitalia",
                    zona_horaria="UTC",
                    rol="usuario",
                    activo=True,
                )
            )
            db.commit()
    finally:
        db.close()

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
    allow_origins=[
        "null",
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
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
app.include_router(sesiones.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Vitalia CJ API funcionando correctamente"}
