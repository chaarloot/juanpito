"""
models/models.py – Todos los modelos SQLAlchemy que mapean la BD VitaliaCJ.
"""
from datetime import date, datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, Date, DateTime, Enum, ForeignKey,
    Integer, SmallInteger, String, Text, Time,
    DECIMAL, UniqueConstraint, CheckConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.core.database import Base


genero_enum = Enum("hombre", "mujer", "otro", "prefiero_no_decirlo", name="genero_enum")
frecuencia_habito_enum = Enum("diario", "semanal", "mensual", "personalizado", name="frecuencia_habito_enum")
frecuencia_med_enum = Enum(
    "una_vez_dia", "dos_veces_dia", "tres_veces_dia",
    "semanal", "segun_necesidad", "personalizado",
    name="frecuencia_med_enum",
)
tipo_plan_enum = Enum("fitness", "nutricion", "bienestar", "rehabilitacion", "personalizado", name="tipo_plan_enum")
estado_plan_enum = Enum("borrador", "activo", "pausado", "completado", "cancelado", name="estado_plan_enum")
tipo_alerta_enum = Enum(
    "medicacion", "habito", "entrenamiento",
    "chequeo_salud", "sistema",
    name="tipo_alerta_enum",
)
prioridad_enum = Enum("baja", "media", "alta", "urgente", name="prioridad_enum")
# tipo_token_enum removed (only used by TokenAutenticacion which was deleted)

# Usuario
class Usuario(Base):
    __tablename__ = "usuarios"

    usuario_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(100), nullable=False)
    fecha_nacimiento: Mapped[Optional[date]] = mapped_column(Date)
    genero: Mapped[Optional[str]] = mapped_column(genero_enum)
    altura_cm: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 2))
    peso_kg: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 2))
    zona_horaria: Mapped[str] = mapped_column(String(50), default="UTC")
    rol: Mapped[str] = mapped_column(String(20), default="usuario")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relaciones
    metricas: Mapped[List["MetricaSalud"]] = relationship("MetricaSalud", back_populates="usuario", cascade="all, delete-orphan")
    habitos: Mapped[List["Habito"]] = relationship("Habito", back_populates="usuario", cascade="all, delete-orphan")
    sesiones: Mapped[List["SesionEntrenamiento"]] = relationship("SesionEntrenamiento", back_populates="usuario", cascade="all, delete-orphan")
    medicaciones: Mapped[List["MedicacionProgramada"]] = relationship("MedicacionProgramada", back_populates="usuario", cascade="all, delete-orphan")
    planes: Mapped[List["Plan"]] = relationship("Plan", back_populates="usuario", foreign_keys="Plan.usuario_id", cascade="all, delete-orphan")
    alertas: Mapped[List["Alerta"]] = relationship("Alerta", back_populates="usuario", cascade="all, delete-orphan")
    # tokens relationship removed (TokenAutenticacion model deleted)


# Métrica de salud 
class MetricaSalud(Base):
    __tablename__ = "metricas_salud"

    metrica_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False)
    fecha_metrica: Mapped[date] = mapped_column(Date, nullable=False)
    peso_kg: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 2))
    presion_sistolica: Mapped[Optional[int]] = mapped_column(SmallInteger)
    presion_diastolica: Mapped[Optional[int]] = mapped_column(SmallInteger)
    ritmo_cardiaco: Mapped[Optional[int]] = mapped_column(SmallInteger)
    glucosa_sangre: Mapped[Optional[float]] = mapped_column(DECIMAL(5, 2))
    horas_sueno: Mapped[Optional[int]] = mapped_column(SmallInteger)
    minutos_sueno: Mapped[Optional[int]] = mapped_column(SmallInteger)
    nivel_estres: Mapped[Optional[int]] = mapped_column(SmallInteger)
    notas: Mapped[Optional[str]] = mapped_column(Text)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("nivel_estres BETWEEN 1 AND 10", name="chk_nivel_estres"),
    )

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="metricas")


# Hábito 
class Habito(Base):
    __tablename__ = "habitos"

    habito_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text)
    frecuencia: Mapped[str] = mapped_column(frecuencia_habito_enum, default="diario")
    objetivo_cantidad: Mapped[int] = mapped_column(Integer, default=1)
    unidad: Mapped[str] = mapped_column(String(50), default="veces")
    hora_recordatorio: Mapped[Optional[datetime]] = mapped_column(Time)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="habitos")
    registros: Mapped[List["RegistroHabito"]] = relationship("RegistroHabito", back_populates="habito", cascade="all, delete-orphan")


# Registro de hábito 
class RegistroHabito(Base):
    __tablename__ = "registros_habitos"

    registro_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    habito_id: Mapped[int] = mapped_column(Integer, ForeignKey("habitos.habito_id", ondelete="CASCADE"), nullable=False)
    fecha_registro: Mapped[date] = mapped_column(Date, nullable=False)
    cantidad_completada: Mapped[int] = mapped_column(Integer, default=0)
    notas: Mapped[Optional[str]] = mapped_column(Text)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("habito_id", "fecha_registro", name="uq_habito_fecha"),
    )

    habito: Mapped["Habito"] = relationship("Habito", back_populates="registros")


# Sesión de entrenamiento
class SesionEntrenamiento(Base):
    __tablename__ = "sesiones_entrenamiento"

    sesion_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False)
    tipo_entrenamiento: Mapped[str] = mapped_column(String(100), nullable=False)
    inicio: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duracion_minutos: Mapped[Optional[int]] = mapped_column(Integer)
    calorias_quemadas: Mapped[Optional[int]] = mapped_column(Integer)
    ritmo_promedio: Mapped[Optional[int]] = mapped_column(SmallInteger)
    nivel_intensidad: Mapped[Optional[int]] = mapped_column(SmallInteger)
    notas: Mapped[Optional[str]] = mapped_column(Text)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("nivel_intensidad BETWEEN 1 AND 10", name="chk_nivel_intensidad"),
    )

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="sesiones")


# Medicación programada
class MedicacionProgramada(Base):
    __tablename__ = "medicacion_programada"

    medicacion_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False)
    nombre_medicacion: Mapped[str] = mapped_column(String(200), nullable=False)
    dosis: Mapped[Optional[str]] = mapped_column(String(100))
    frecuencia: Mapped[str] = mapped_column(frecuencia_med_enum, default="una_vez_dia")
    hora_programada: Mapped[Optional[datetime]] = mapped_column(Time)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[Optional[date]] = mapped_column(Date)
    instrucciones: Mapped[Optional[str]] = mapped_column(Text)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="medicaciones")


# Plan 
class Plan(Base):
    __tablename__ = "planes"

    plan_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False)
    nombre_plan: Mapped[str] = mapped_column(String(200), nullable=False)
    tipo_plan: Mapped[str] = mapped_column(tipo_plan_enum, nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text)
    objetivos: Mapped[Optional[str]] = mapped_column(Text)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[Optional[date]] = mapped_column(Date)
    estado: Mapped[str] = mapped_column(estado_plan_enum, default="borrador")
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    fecha_actualizacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="planes", foreign_keys=[usuario_id])
    
    
# Alerta
class Alerta(Base):
    __tablename__ = "alertas"

    alerta_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(Integer, ForeignKey("usuarios.usuario_id", ondelete="CASCADE"), nullable=False)
    tipo_alerta: Mapped[str] = mapped_column(tipo_alerta_enum, nullable=False)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    mensaje: Mapped[Optional[str]] = mapped_column(Text)
    prioridad: Mapped[str] = mapped_column(prioridad_enum, default="media")
    leida: Mapped[bool] = mapped_column(Boolean, default=False)
    programada_para: Mapped[Optional[datetime]] = mapped_column(DateTime)
    fecha_creacion: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="alertas")


# Token de autenticación 
# TokenAutenticacion model removed — not referenced elsewhere
