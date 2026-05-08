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


@router.get("/{habito_id}/estadisticas", response_model=dict)
def obtener_estadisticas_habito(
    habito_id: int,
    dias_atras: int = 30,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener estadísticas de cumplimiento de un hábito específico"""
    from datetime import datetime, timedelta

    habito = _get_habito_or_404(habito_id, current_user.usuario_id, db)
    fecha_limite = datetime.utcnow() - timedelta(days=dias_atras)

    registros = db.query(RegistroHabito).filter(
        RegistroHabito.habito_id == habito_id,
        RegistroHabito.fecha_registro >= fecha_limite,
    ).all()

    # Calcular racha actual (días consecutivos completados)
    registros_ordenados = sorted(registros, key=lambda r: r.fecha_registro)
    racha_actual = 0
    if registros_ordenados:
        hoy = datetime.utcnow().date()
        for i in range(len(registros_ordenados) - 1, -1, -1):
            dias_diff = (hoy - registros_ordenados[i].fecha_registro.date()).days
            if dias_diff == racha_actual:
                racha_actual += 1
            else:
                break

    # Calcular racha máxima
    racha_maxima = 0
    racha_temp = 1
    for i in range(1, len(registros_ordenados)):
        dias_diff = (registros_ordenados[i].fecha_registro.date() - registros_ordenados[i - 1].fecha_registro.date()).days
        if dias_diff == 1:
            racha_temp += 1
            racha_maxima = max(racha_maxima, racha_temp)
        else:
            racha_temp = 1

    # Calcular porcentaje de cumplimiento
    dias_esperados = dias_atras if habito.frecuencia == "diario" else (dias_atras // 7 if habito.frecuencia == "semanal" else dias_atras // 30)
    porcentaje_cumplimiento = (len(registros) / dias_esperados * 100) if dias_esperados > 0 else 0

    # Calcular cantidad promedio completada
    cantidades = [r.cantidad_completada for r in registros if r.cantidad_completada]
    promedio_cantidad = sum(cantidades) / len(cantidades) if cantidades else 0

    return {
        "habito_id": habito_id,
        "nombre_habito": habito.nombre,
        "periodo_dias": dias_atras,
        "total_registros": len(registros),
        "porcentaje_cumplimiento": round(porcentaje_cumplimiento, 2),
        "racha_actual": racha_actual,
        "racha_maxima": racha_maxima,
        "promedio_cantidad_diaria": round(promedio_cantidad, 2),
        "dias_completados": len(registros),
    }


@router.get("/resumen/todos", response_model=list)
def obtener_resumen_todos_habitos(
    dias_atras: int = 30,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener resumen de cumplimiento de todos los hábitos del usuario"""
    from datetime import datetime, timedelta

    habitos = db.query(Habito).filter(
        Habito.usuario_id == current_user.usuario_id,
        Habito.activo == True,  # noqa: E712
    ).all()

    resumen = []
    fecha_limite = datetime.utcnow() - timedelta(days=dias_atras)

    for habito in habitos:
        registros = db.query(RegistroHabito).filter(
            RegistroHabito.habito_id == habito.habito_id,
            RegistroHabito.fecha_registro >= fecha_limite,
        ).all()

        dias_esperados = dias_atras if habito.frecuencia == "diario" else (dias_atras // 7 if habito.frecuencia == "semanal" else dias_atras // 30)
        porcentaje_cumplimiento = (len(registros) / dias_esperados * 100) if dias_esperados > 0 else 0

        resumen.append({
            "habito_id": habito.habito_id,
            "nombre": habito.nombre,
            "frecuencia": habito.frecuencia,
            "registros_periodo": len(registros),
            "porcentaje_cumplimiento": round(porcentaje_cumplimiento, 2),
            "estado": "activo" if porcentaje_cumplimiento > 75 else ("riesgo" if porcentaje_cumplimiento > 25 else "abandonado"),
        })

    return resumen
