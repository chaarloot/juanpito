"""
routers/planes.py – CRUD de planes sanitarios/fitness y notas de entrenador.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Plan, NotaEntrenador, Usuario
from app.schemas.schemas import (
    PlanCreate, PlanUpdate, PlanOut,
    NotaEntrenadorCreate, NotaEntrenadorUpdate, NotaEntrenadorOut,
)

router = APIRouter(prefix="/planes", tags=["Planes"])


def _get_plan_or_404(plan_id: int, db: Session) -> Plan:
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan no encontrado")
    return plan


def _check_plan_access(plan: Plan, current_user: Usuario):
    """El usuario puede ver su propio plan; el entrenador/admin puede ver cualquiera."""
    if current_user.rol not in ("admin", "entrenador") and plan.usuario_id != current_user.usuario_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")


# ─── Planes ───────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[PlanOut])
def list_planes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    query = db.query(Plan)
    if current_user.rol == "usuario":
        query = query.filter(Plan.usuario_id == current_user.usuario_id)
    elif current_user.rol == "entrenador":
        query = query.filter(
            (Plan.usuario_id == current_user.usuario_id) |
            (Plan.entrenador_id == current_user.usuario_id)
        )
    return query.offset(skip).limit(limit).all()


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


# ─── Notas de entrenador ──────────────────────────────────────────────────────

@router.get("/{plan_id}/notas", response_model=List[NotaEntrenadorOut])
def list_notas(plan_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    plan = _get_plan_or_404(plan_id, db)
    _check_plan_access(plan, current_user)
    query = db.query(NotaEntrenador).filter(NotaEntrenador.plan_id == plan_id)
    # Si no es entrenador/admin, ocultar notas privadas
    if current_user.rol == "usuario":
        query = query.filter(NotaEntrenador.privado == False)  # noqa: E712
    return query.all()


@router.get("/{plan_id}/notas/{nota_id}", response_model=NotaEntrenadorOut)
def get_nota(plan_id: int, nota_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    plan = _get_plan_or_404(plan_id, db)
    _check_plan_access(plan, current_user)
    nota = db.query(NotaEntrenador).filter(NotaEntrenador.nota_id == nota_id, NotaEntrenador.plan_id == plan_id).first()
    if not nota:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota no encontrada")
    if nota.privado and current_user.rol == "usuario":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Nota privada")
    return nota


@router.post("/{plan_id}/notas", response_model=NotaEntrenadorOut, status_code=status.HTTP_201_CREATED)
def create_nota(plan_id: int, data: NotaEntrenadorCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in ("entrenador", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo entrenadores y admins pueden crear notas")
    _get_plan_or_404(plan_id, db)
    nota = NotaEntrenador(**data.model_dump(), plan_id=plan_id, entrenador_id=current_user.usuario_id)
    db.add(nota)
    db.commit()
    db.refresh(nota)
    return nota


@router.put("/{plan_id}/notas/{nota_id}", response_model=NotaEntrenadorOut)
def update_nota(plan_id: int, nota_id: int, data: NotaEntrenadorUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    nota = db.query(NotaEntrenador).filter(NotaEntrenador.nota_id == nota_id, NotaEntrenador.plan_id == plan_id).first()
    if not nota:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota no encontrada")
    if nota.entrenador_id != current_user.usuario_id and current_user.rol != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes editar notas de otro entrenador")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(nota, field, value)
    db.commit()
    db.refresh(nota)
    return nota


@router.delete("/{plan_id}/notas/{nota_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nota(plan_id: int, nota_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    nota = db.query(NotaEntrenador).filter(NotaEntrenador.nota_id == nota_id, NotaEntrenador.plan_id == plan_id).first()
    if not nota:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nota no encontrada")
    if nota.entrenador_id != current_user.usuario_id and current_user.rol != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No puedes eliminar notas de otro entrenador")
    db.delete(nota)
    db.commit()
