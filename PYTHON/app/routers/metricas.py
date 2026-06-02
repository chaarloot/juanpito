"""
routers/metricas.py 3 CRUD de métricas de salud.
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


@router.get("/resumen/general")
def obtener_resumen_metricas(
    dias_atras: int = 30,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtener resumen de métricas de salud: promedios, máximos, mínimos"""
    from datetime import datetime, timedelta

    fecha_limite = datetime.utcnow() - timedelta(days=dias_atras)

    metricas = db.query(MetricaSalud).filter(
        MetricaSalud.usuario_id == current_user.usuario_id,
        MetricaSalud.fecha_metrica >= fecha_limite,
    ).all()

    if not metricas:
        return {
            "periodo_dias": dias_atras,
            "total_registros": 0,
            "peso": {"promedio": None, "minimo": None, "maximo": None, "tendencia": None},
            "presion_sistolica": {"promedio": None, "minimo": None, "maximo": None},
            "presion_diastolica": {"promedio": None, "minimo": None, "maximo": None},
            "ritmo_cardiaco": {"promedio": None, "minimo": None, "maximo": None},
            "glucosa": {"promedio": None, "minimo": None, "maximo": None},
            "sueño_minutos": {"promedio": None, "total": None},
            "nivel_estres": {"promedio": None, "minimo": None, "maximo": None},
        }
    def safe_avg(values):
        filtered = [v for v in values if v is not None]
        return sum(filtered) / len(filtered) if filtered else None

    def safe_min(values):
        filtered = [v for v in values if v is not None]
        return min(filtered) if filtered else None

    def safe_max(values):
        filtered = [v for v in values if v is not None]
        return max(filtered) if filtered else None

    pesos = [m.peso_kg for m in metricas]
    tendencia_peso = None
    if len(pesos) >= 2:
        primeros_30_porciento = pesos[: max(1, len(pesos) // 3)]
        ultimos_30_porciento = pesos[-max(1, len(pesos) // 3) :]
        primera_media = sum(primeros_30_porciento) / len(primeros_30_porciento)
        ultima_media = sum(ultimos_30_porciento) / len(ultimos_30_porciento)
        tendencia_peso = "bajando" if ultima_media < primera_media else ("subiendo" if ultima_media > primera_media else "estable")

    sueño_total = sum([m.horas_sueno * 60 + (m.minutos_sueno or 0) for m in metricas if m.horas_sueno])
    ritmo_cardiaco_values = [m.ritmo_cardiaco for m in metricas]
    glucosa_values = [m.glucosa_sangre for m in metricas]

    return {
        "periodo_dias": dias_atras,
        "total_registros": len(metricas),
        "peso": {
            "promedio": round(safe_avg(pesos), 2) if safe_avg(pesos) else None,
            "minimo": round(safe_min(pesos), 2) if safe_min(pesos) else None,
            "maximo": round(safe_max(pesos), 2) if safe_max(pesos) else None,
            "tendencia": tendencia_peso,
        },
        "presion_sistolica": {
            "promedio": round(safe_avg([m.presion_sistolica for m in metricas]), 2) if safe_avg([m.presion_sistolica for m in metricas]) else None,
            "minimo": safe_min([m.presion_sistolica for m in metricas]),
            "maximo": safe_max([m.presion_sistolica for m in metricas]),
        },
        "presion_diastolica": {
            "promedio": round(safe_avg([m.presion_diastolica for m in metricas]), 2) if safe_avg([m.presion_diastolica for m in metricas]) else None,
            "minimo": safe_min([m.presion_diastolica for m in metricas]),
            "maximo": safe_max([m.presion_diastolica for m in metricas]),
        },
        "ritmo_cardiaco": {
            "promedio": round(safe_avg(ritmo_cardiaco_values), 2) if safe_avg(ritmo_cardiaco_values) else None,
            "minimo": safe_min(ritmo_cardiaco_values),
            "maximo": safe_max(ritmo_cardiaco_values),
        },
        "glucosa": {
            "promedio": round(safe_avg(glucosa_values), 2) if safe_avg(glucosa_values) else None,
            "minimo": safe_min(glucosa_values),
            "maximo": safe_max(glucosa_values),
        },
        "sueño_minutos": {
            "promedio": round(sueño_total / len(metricas), 2) if metricas else None,
            "total": sueño_total,
        },
        "nivel_estres": {
            "promedio": round(safe_avg([m.nivel_estres for m in metricas]), 2) if safe_avg([m.nivel_estres for m in metricas]) else None,
            "minimo": safe_min([m.nivel_estres for m in metricas]),
            "maximo": safe_max([m.nivel_estres for m in metricas]),
        },
    }
