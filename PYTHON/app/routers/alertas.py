"""
routers/alertas.py – CRUD de alertas del usuario.
"""
"""
routers/alertas.py – CRUD de alertas del usuario.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Alerta, Usuario
from app.schemas.schemas import AlertaCreate, AlertaUpdate, AlertaOut

router = APIRouter(prefix="/alertas", tags=["Alertas"])


def _get_alerta_or_404(alerta_id: int, usuario_id: int, db: Session) -> Alerta:
    a = db.query(Alerta).filter(Alerta.alerta_id == alerta_id, Alerta.usuario_id == usuario_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alerta no encontrada")
    return a


@router.get("/", response_model=List[AlertaOut])
def list_alertas(
    solo_no_leidas: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Alerta).filter(Alerta.usuario_id == current_user.usuario_id)
    if solo_no_leidas:
        query = query.filter(Alerta.leida == False)  # noqa: E712
    return query.order_by(Alerta.fecha_creacion.desc()).offset(skip).limit(limit).all()


@router.get("/{alerta_id}", response_model=AlertaOut)
def get_alerta(alerta_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return _get_alerta_or_404(alerta_id, current_user.usuario_id, db)


@router.post("/", response_model=AlertaOut, status_code=status.HTTP_201_CREATED)
def create_alerta(data: AlertaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    alerta = Alerta(**data.model_dump(), usuario_id=current_user.usuario_id)
    db.add(alerta)
    db.commit()
    db.refresh(alerta)
    return alerta


@router.put("/{alerta_id}", response_model=AlertaOut)
def update_alerta(alerta_id: int, data: AlertaUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    alerta = _get_alerta_or_404(alerta_id, current_user.usuario_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(alerta, field, value)
    db.commit()
    db.refresh(alerta)
    return alerta


@router.patch("/{alerta_id}/leer", response_model=AlertaOut)
def marcar_leida(alerta_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Marca una alerta como leída."""
    alerta = _get_alerta_or_404(alerta_id, current_user.usuario_id, db)
    alerta.leida = True
    db.commit()
    db.refresh(alerta)
    return alerta


@router.patch("/leer-todas", status_code=status.HTTP_204_NO_CONTENT)
def marcar_todas_leidas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Marca todas las alertas del usuario como leídas."""
    db.query(Alerta).filter(Alerta.usuario_id == current_user.usuario_id, Alerta.leida == False).update({"leida": True})  # noqa: E712
    db.commit()


@router.delete("/{alerta_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alerta(alerta_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    alerta = _get_alerta_or_404(alerta_id, current_user.usuario_id, db)
    db.delete(alerta)
    db.commit()