"""
routers/planes.py – CRUD de planes sanitarios/fitness y notas del usuario.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Plan, Usuario
from app.schemas.schemas import (
    PlanCreate, PlanUpdate, PlanOut,
)

router = APIRouter(prefix="/planes", tags=["Planes"])


def _get_plan_or_404(plan_id: int, db: Session) -> Plan:
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan no encontrado")
    return plan


def _check_plan_access(plan: Plan, current_user: Usuario):
    """Cada usuario solo puede ver sus propios planes."""
    if plan.usuario_id != current_user.usuario_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")


# ─── Planes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[PlanOut])
def list_planes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    return (
        db.query(Plan)
        .filter(Plan.usuario_id == current_user.usuario_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    plan = _get_plan_or_404(plan_id, db)
    _check_plan_access(plan, current_user)
    return plan


@router.post("/", response_model=PlanOut, status_code=status.HTTP_201_CREATED)
def create_plan(data: PlanCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    plan = Plan(**data.model_dump(), usuario_id=current_user.usuario_id)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.put("/{plan_id}", response_model=PlanOut)
def update_plan(plan_id: int, data: PlanUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    plan = _get_plan_or_404(plan_id, db)
    _check_plan_access(plan, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    plan = _get_plan_or_404(plan_id, db)
    _check_plan_access(plan, current_user)
    db.delete(plan)
    db.commit()


# Notas de entrenador removidas: toda la funcionalidad asociada ha sido eliminada
