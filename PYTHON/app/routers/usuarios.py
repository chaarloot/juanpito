# routers/usuarios.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.models import Usuario
from app.schemas.schemas import UsuarioOut, UsuarioUpdate, UsuarioAdminUpdate

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


# ───────────────────────────────────────────────────────────────
# PERFIL DEL USUARIO AUTENTICADO
# ───────────────────────────────────────────────────────────────
@router.get("/me", response_model=UsuarioOut)
def get_me(current_user: Usuario = Depends(get_current_user)):
    """Devuelve el perfil del usuario autenticado."""
    return current_user


# ───────────────────────────────────────────────────────────────
# LISTAR TODOS LOS USUARIOS (SOLO ADMIN)
# ───────────────────────────────────────────────────────────────
@router.get("/", response_model=list[UsuarioOut], dependencies=[Depends(require_roles("admin"))])
def get_all_users(db: Session = Depends(get_db)):
    """Devuelve todos los usuarios (solo admin)."""
    return db.query(Usuario).all()


# ───────────────────────────────────────────────────────────────
# OBTENER USUARIO POR ID (ADMIN O EL MISMO USUARIO)
# ───────────────────────────────────────────────────────────────
@router.get("/{usuario_id}", response_model=UsuarioOut)
def get_user_by_id(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")

    # Solo admin o el propio usuario
    if current_user.rol != "admin" and current_user.usuario_id != usuario_id:
        raise HTTPException(403, "No tienes permiso para ver este usuario")

    return usuario


# ───────────────────────────────────────────────────────────────
# ACTUALIZAR PERFIL (EL MISMO USUARIO)
# ───────────────────────────────────────────────────────────────
@router.put("/me", response_model=UsuarioOut)
def update_me(
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Actualiza el perfil del usuario autenticado."""
    for field, value in data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


# ───────────────────────────────────────────────────────────────
# ACTUALIZAR USUARIO (SOLO ADMIN)
# ───────────────────────────────────────────────────────────────
@router.put("/{usuario_id}", response_model=UsuarioOut, dependencies=[Depends(require_roles("admin"))])
def admin_update_user(usuario_id: int, data: UsuarioAdminUpdate, db: Session = Depends(get_db)):
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)
    return usuario


# ───────────────────────────────────────────────────────────────
# ELIMINAR USUARIO (SOLO ADMIN)
# ───────────────────────────────────────────────────────────────
@router.delete("/{usuario_id}", status_code=204, dependencies=[Depends(require_roles("admin"))])
def delete_user(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")

    db.delete(usuario)
    db.commit()
    return
