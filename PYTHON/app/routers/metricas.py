"""
routers/metricas.py – CRUD de métricas de salud.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import MetricaSalud, Usuario
from app.schemas.schemas import MetricaSaludCreate, MetricaSaludUpdate, MetricaSaludOut

router = APIRouter(prefix="/metricas", tags=["Métricas de Salud"])


def _get_metrica_or_404(metrica_id: int, usuario_id: int, db: Session) -> MetricaSalud:
    metrica = (
        db.query(MetricaSalud)
        .filter(MetricaSalud.metrica_id == metrica_id, MetricaSalud.usuario_id == usuario_id)
        .first()
    )
    if not metrica:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Métrica no encontrada")
    return metrica


@router.get("/", response_model=List[MetricaSaludOut])
def list_metricas(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return (
        db.query(MetricaSalud)
        .filter(MetricaSalud.usuario_id == current_user.usuario_id)
        .order_by(MetricaSalud.fecha_metrica.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{metrica_id}", response_model=MetricaSaludOut)
def get_metrica(
    metrica_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    return _get_metrica_or_404(metrica_id, current_user.usuario_id, db)


@router.post("/", response_model=MetricaSaludOut, status_code=status.HTTP_201_CREATED)
def create_metrica(
    data: MetricaSaludCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    metrica = MetricaSalud(**data.model_dump(), usuario_id=current_user.usuario_id)
    db.add(metrica)
    db.commit()
    db.refresh(metrica)
    return metrica


@router.put("/{metrica_id}", response_model=MetricaSaludOut)
def update_metrica(
    metrica_id: int,
    data: MetricaSaludUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    metrica = _get_metrica_or_404(metrica_id, current_user.usuario_id, db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(metrica, field, value)
    db.commit()
    db.refresh(metrica)
    return metrica


@router.delete("/{metrica_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_metrica(
    metrica_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    metrica = _get_metrica_or_404(metrica_id, current_user.usuario_id, db)
    db.delete(metrica)
    db.commit()
