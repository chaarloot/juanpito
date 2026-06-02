from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.models import Usuario
from app.schemas.schemas import UsuarioCreate, UsuarioOut, Token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def _normalize_email(email: str) -> str:
    return email.strip().lower()
@router.post("/register", response_model=UsuarioOut, status_code=201)
def register(data: UsuarioCreate, db: Session = Depends(get_db)):
    try:
        email = _normalize_email(data.email)
        try:
            total = db.query(Usuario).count()
            dup = db.query(Usuario).filter(Usuario.email == email).count()
            print(f"[auth.register] total_users={total}, dup_count_for_{email}={dup}")
        except Exception:
            print("[auth.register] could not query counts (db may be uninitialized)")

        if db.query(Usuario).filter(Usuario.email == email).first():
            raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")

        usuario = Usuario(
            email=email,
            password_hash=hash_password(data.password),
            nombre=data.nombre,
            apellidos=data.apellidos,
            fecha_nacimiento=data.fecha_nacimiento,
            genero=data.genero,
            altura_cm=data.altura_cm,
            peso_kg=data.peso_kg,
            zona_horaria=data.zona_horaria or "UTC",
        )

        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        return usuario
    except HTTPException:
        raise
    except Exception as exc:
        print("[auth.register] error, request data:", data.model_dump())
        print("[auth.register] exception:", repr(exc))
        raise
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = _normalize_email(form_data.username)
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if not usuario or not verify_password(form_data.password, usuario.password_hash):
        raise HTTPException(401, "Credenciales incorrectas")

    if not usuario.activo:
        raise HTTPException(403, "Cuenta desactivada")

    access_token = create_access_token(str(usuario.usuario_id))
    refresh_token = create_refresh_token(str(usuario.usuario_id))

    return Token(access_token=access_token, refresh_token=refresh_token)
@router.post("/refresh", response_model=Token)
def refresh(refresh_token: str):
    payload = decode_token(refresh_token)

    if payload.get("type") != "refresh":
        raise HTTPException(401, "Refresh token inválido")

    user_id = payload.get("sub")

    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)

    return Token(access_token=new_access, refresh_token=new_refresh)