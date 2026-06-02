"""
routers/sesiones.py – CRUD para sesiones de entrenamiento
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Usuario, SesionEntrenamiento
from app.schemas.schemas import SesionCrear, SesionActualizar, SesionRespuesta


router = APIRouter(prefix="/sesiones", tags=["Sesiones Entrenamiento"])


@router.post("/", response_model=SesionRespuesta)
async def crear_sesion(
    sesion_data: SesionCrear,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crear nueva sesión de entrenamiento"""
    nueva_sesion = SesionEntrenamiento(
        usuario_id=current_user.usuario_id,
        tipo_entrenamiento=sesion_data.tipo_entrenamiento,
        inicio=sesion_data.inicio or datetime.utcnow(),
        duracion_minutos=sesion_data.duracion_minutos,
        calorias_quemadas=sesion_data.calorias_quemadas,
        ritmo_promedio=sesion_data.ritmo_promedio,
        nivel_intensidad=sesion_data.nivel_intensidad,
        notas=sesion_data.notas,
    )
    db.add(nueva_sesion)
    db.commit()
    db.refresh(nueva_sesion)
    return nueva_sesion

@router.get("/", response_model=list[SesionRespuesta])
async def listar_sesiones(
    dias_atras: int = 30,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Listar sesiones de entrenamiento del usuario (últimos N días)"""
    fecha_limite = datetime.utcnow() - timedelta(days=dias_atras)
    sesiones = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.usuario_id == current_user.usuario_id,
        SesionEntrenamiento.inicio >= fecha_limite,
    ).order_by(SesionEntrenamiento.inicio.desc()).all()
    return sesiones


@router.get("/", response_model=list[SesionRespuesta])
async def listar_sesiones(
    dias_atras: int = 30,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Listar sesiones de entrenamiento del usuario (últimos N días)"""
    fecha_limite = datetime.utcnow() - timedelta(days=dias_atras)
    sesiones = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.usuario_id == current_user.usuario_id,
        SesionEntrenamiento.inicio >= fecha_limite,
    ).order_by(SesionEntrenamiento.inicio.desc()).all()
    return sesiones


@router.get("/{sesion_id}", response_model=SesionRespuesta)
async def obtener_sesion(
    sesion_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener detalles de una sesión específica"""
    sesion = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.sesion_id == sesion_id,
        SesionEntrenamiento.usuario_id == current_user.usuario_id,
    ).first()
    
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    return sesion


@router.put("/{sesion_id}", response_model=SesionRespuesta)
async def actualizar_sesion(
    sesion_id: int,
    sesion_data: SesionActualizar,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Actualizar una sesión de entrenamiento"""
    sesion = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.sesion_id == sesion_id,
        SesionEntrenamiento.usuario_id == current_user.usuario_id,
    ).first()
    
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    if sesion_data.tipo_entrenamiento:
        sesion.tipo_entrenamiento = sesion_data.tipo_entrenamiento
    if sesion_data.duracion_minutos:
        sesion.duracion_minutos = sesion_data.duracion_minutos
    if sesion_data.calorias_quemadas:
        sesion.calorias_quemadas = sesion_data.calorias_quemadas
    if sesion_data.ritmo_promedio:
        sesion.ritmo_promedio = sesion_data.ritmo_promedio
    if sesion_data.nivel_intensidad:
        sesion.nivel_intensidad = sesion_data.nivel_intensidad
    if sesion_data.notas:
        sesion.notas = sesion_data.notas
    
    db.commit()
    db.refresh(sesion)
    return sesion


@router.delete("/{sesion_id}")
async def eliminar_sesion(
    sesion_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Eliminar una sesión de entrenamiento"""
    sesion = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.sesion_id == sesion_id,
        SesionEntrenamiento.usuario_id == current_user.usuario_id,
    ).first()
    
    if not sesion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    
    db.delete(sesion)
    db.commit()
    return {"detail": "Sesión eliminada correctamente"}


@router.get("/stats/resumen")
async def obtener_resumen_stats(
    dias_atras: int = 30,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtener resumen de estadísticas de entrenamiento"""
    fecha_limite = datetime.utcnow() - timedelta(days=dias_atras)
    
    sesiones = db.query(SesionEntrenamiento).filter(
        SesionEntrenamiento.usuario_id == current_user.usuario_id,
        SesionEntrenamiento.inicio >= fecha_limite,
    ).all()
    
    total_sesiones = len(sesiones)
    total_calorias = sum([s.calorias_quemadas or 0 for s in sesiones])
    total_minutos = sum([s.duracion_minutos or 0 for s in sesiones])
    promedio_semanal = total_sesiones / (dias_atras / 7) if dias_atras > 0 else 0
    
    return {
        "total_entrenamientos": total_sesiones,
        "total_calorias": total_calorias,
        "total_minutos": total_minutos,
        "promedio_semanal": round(promedio_semanal, 2),
        "intensidad_promedio": round(sum([s.nivel_intensidad or 5 for s in sesiones]) / total_sesiones, 1) if total_sesiones > 0 else 0,
    }
