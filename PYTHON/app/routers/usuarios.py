from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Usuario
from app.schemas.schemas import UsuarioOut, UsuarioUpdate

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])
@router.get("/me", response_model=UsuarioOut)
def get_me(current_user: Usuario = Depends(get_current_user)):
    """Devuelve el perfil del usuario autenticado."""
    return current_user
@router.get("/{usuario_id}", response_model=UsuarioOut)
def get_user_by_id(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")

    if current_user.usuario_id != usuario_id:
        raise HTTPException(403, "No tienes permiso para ver este usuario")

    return usuario
@router.put("/me", response_model=UsuarioOut)
def update_me(
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    from app.core.security import hash_password

    update_data = data.dict(exclude_unset=True)

    if "password" in update_data:
        current_user.password_hash = hash_password(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user
@router.delete("/me", status_code=204)
def delete_me(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    usuario = db.get(Usuario, current_user.usuario_id)
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")

    db.delete(usuario)
    db.commit()
    return
@router.delete("/{usuario_id}", status_code=204)
def delete_user(usuario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.usuario_id != usuario_id:
        raise HTTPException(403, "No tienes permiso para eliminar este usuario")

    usuario = db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")

    db.delete(usuario)
    db.commit()
    return