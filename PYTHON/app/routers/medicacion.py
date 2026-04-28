"""
routers/medicacion.py – CRUD de medicación programada.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import MedicacionProgramada, Usuario
from app.schemas.schemas import MedicacionCreate, MedicacionUpdate, MedicacionOut

router = APIRouter(prefix="/medicacion", tags=["Medicación"])


def _get_med_or_404(medicacion_id: int, usuario_id: int, db: Session) -> MedicacionProgramada:
    m = db.query(MedicacionProgramada).filter(
        MedicacionProgramada.medicacion_id == medicacion_id,
        MedicacionProgramada.usuario_id == usuario_id,
    ).first()
    if not m:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medicación no encontrada")
    return m


@router.get("/", response_model=List[MedicacionOut])
def list_medicacion(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return (
        db.query(MedicacionProgramada)
        .filter(MedicacionProgramada.usuario_id == current_user.usuario_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{medicacion_id}", response_model=MedicacionOut)
def get_medicacion(medicacion_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return _get_med_or_404(medicacion_id, current_user.usuario_id, db)


@router.post("/", response_model=MedicacionOut, status_code=status.HTTP_201_CREATED)
def create_medicacion(data: MedicacionCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    med = MedicacionProgramada(**data.model_dump(), usuario_id=current_user.usuario_id)
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.put("/{medicacion_id}", response_model=MedicacionOut)
def update_medicacion(medicacion_id: int, data: MedicacionUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    med = _get_med_or_404(medicacion_id, current_user.usuario_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(med, field, value)
    db.commit()
    db.refresh(med)
    return med


@router.delete("/{medicacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicacion(medicacion_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    med = _get_med_or_404(medicacion_id, current_user.usuario_id, db)
    db.delete(med)
    db.commit()
