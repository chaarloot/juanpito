"""
routers/habitos.py – CRUD de hábitos y sus registros diarios.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Habito, RegistroHabito, Usuario
from app.schemas.schemas import (
    HabitoCreate, HabitoUpdate, HabitoOut,
    RegistroHabitoCreate, RegistroHabitoUpdate, RegistroHabitoOut,
)

router = APIRouter(prefix="/habitos", tags=["Hábitos"])


def _get_habito_or_404(habito_id: int, usuario_id: int, db: Session) -> Habito:
    h = db.query(Habito).filter(Habito.habito_id == habito_id, Habito.usuario_id == usuario_id).first()
    if not h:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hábito no encontrado")
    return h


# ─── Hábitos ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[HabitoOut])
def list_habitos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return db.query(Habito).filter(Habito.usuario_id == current_user.usuario_id).offset(skip).limit(limit).all()


@router.get("/{habito_id}", response_model=HabitoOut)
def get_habito(habito_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return _get_habito_or_404(habito_id, current_user.usuario_id, db)


@router.post("/", response_model=HabitoOut, status_code=status.HTTP_201_CREATED)
def create_habito(data: HabitoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    habito = Habito(**data.model_dump(), usuario_id=current_user.usuario_id)
    db.add(habito)
    db.commit()
    db.refresh(habito)
    return habito


@router.put("/{habito_id}", response_model=HabitoOut)
def update_habito(habito_id: int, data: HabitoUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    habito = _get_habito_or_404(habito_id, current_user.usuario_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(habito, field, value)
    db.commit()
    db.refresh(habito)
    return habito


@router.delete("/{habito_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habito(habito_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    habito = _get_habito_or_404(habito_id, current_user.usuario_id, db)
    db.delete(habito)
    db.commit()


# ─── Registros de hábito ──────────────────────────────────────────────────────

@router.get("/{habito_id}/registros", response_model=List[RegistroHabitoOut])
def list_registros(habito_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    _get_habito_or_404(habito_id, current_user.usuario_id, db)
    return db.query(RegistroHabito).filter(RegistroHabito.habito_id == habito_id).offset(skip).limit(limit).all()


@router.get("/{habito_id}/registros/{registro_id}", response_model=RegistroHabitoOut)
def get_registro(habito_id: int, registro_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    _get_habito_or_404(habito_id, current_user.usuario_id, db)
    r = db.query(RegistroHabito).filter(RegistroHabito.registro_id == registro_id, RegistroHabito.habito_id == habito_id).first()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")
    return r


@router.post("/{habito_id}/registros", response_model=RegistroHabitoOut, status_code=status.HTTP_201_CREATED)
def create_registro(habito_id: int, data: RegistroHabitoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    _get_habito_or_404(habito_id, current_user.usuario_id, db)
    registro = RegistroHabito(**data.model_dump(), habito_id=habito_id)
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


@router.put("/{habito_id}/registros/{registro_id}", response_model=RegistroHabitoOut)
def update_registro(habito_id: int, registro_id: int, data: RegistroHabitoUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    _get_habito_or_404(habito_id, current_user.usuario_id, db)
    r = db.query(RegistroHabito).filter(RegistroHabito.registro_id == registro_id, RegistroHabito.habito_id == habito_id).first()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(r, field, value)
    db.commit()
    db.refresh(r)
    return r


@router.delete("/{habito_id}/registros/{registro_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_registro(habito_id: int, registro_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    _get_habito_or_404(habito_id, current_user.usuario_id, db)
    r = db.query(RegistroHabito).filter(RegistroHabito.registro_id == registro_id, RegistroHabito.habito_id == habito_id).first()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")
    db.delete(r)
    db.commit()
