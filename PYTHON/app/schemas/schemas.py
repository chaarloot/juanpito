"""
schemas/schemas.py – Todos los esquemas Pydantic (Create, Update, Out) para la API Vitalia CJ.
"""
from datetime import date, datetime, time
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, field_validator, model_validator
import re


# USUARIO
class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str
    apellidos: str
    fecha_nacimiento: Optional[date] = None
    genero: Optional[Literal["hombre", "mujer", "otro", "prefiero_no_decirlo"]] = None
    altura_cm: Optional[float] = None
    peso_kg: Optional[float] = None
    zona_horaria: Optional[str] = "UTC"

    @field_validator("nombre", "apellidos")
    def nombre_not_empty(v: str) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError("Nombre/apellidos deben tener al menos 2 caracteres")
        return v.strip()

    @field_validator("altura_cm")
    def altura_valida(v: Optional[float]) -> Optional[float]:
        if v is not None and not (50 <= v <= 300):
            raise ValueError("Altura debe estar entre 50 y 300 cm")
        return v

    @field_validator("peso_kg")
    def peso_valido(v: Optional[float]) -> Optional[float]:
        if v is not None and not (30 <= v <= 300):
            raise ValueError("Peso debe estar entre 30 y 300 kg")
        return v


class UsuarioCreate(UsuarioBase):
    password: str

    @field_validator("password")
    def password_strength(v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe contener al menos una mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe contener al menos una minúscula")
        if not re.search(r"[0-9]", v):
            raise ValueError("La contraseña debe contener al menos un número")
        return v


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    genero: Optional[Literal["hombre", "mujer", "otro", "prefiero_no_decirlo"]] = None
    altura_cm: Optional[float] = None
    peso_kg: Optional[float] = None
    zona_horaria: Optional[str] = None
    password: Optional[str] = None 


class UsuarioOut(UsuarioBase):
    usuario_id: int
    rol: str
    activo: bool
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    model_config = {"from_attributes": True}


# AUTH
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


# TokenData and LoginRequest removed — not referenced elsewhere in the codebase


# MÉTRICA DE SALUD
class MetricaSaludBase(BaseModel):
    fecha_metrica: date
    peso_kg: Optional[float] = None
    presion_sistolica: Optional[int] = None
    presion_diastolica: Optional[int] = None
    ritmo_cardiaco: Optional[int] = None
    glucosa_sangre: Optional[float] = None
    horas_sueno: Optional[int] = None
    minutos_sueno: Optional[int] = None
    nivel_estres: Optional[int] = None
    notas: Optional[str] = None

    @field_validator("peso_kg")
    def peso_valido(v: Optional[float]) -> Optional[float]:
        if v is not None and not (30 <= v <= 300):
            raise ValueError("Peso debe estar entre 30 y 300 kg")
        return v

    @field_validator("presion_sistolica", "presion_diastolica")
    def presion_valida(v: Optional[int]) -> Optional[int]:
        if v is not None and not (40 <= v <= 200):
            raise ValueError("Presión debe estar entre 40 y 200 mmHg")
        return v

    @field_validator("ritmo_cardiaco")
    def ritmo_valido(v: Optional[int]) -> Optional[int]:
        if v is not None and not (30 <= v <= 200):
            raise ValueError("Ritmo cardíaco debe estar entre 30 y 200 bpm")
        return v

    @field_validator("glucosa_sangre")
    def glucosa_valida(v: Optional[float]) -> Optional[float]:
        if v is not None and not (40 <= v <= 500):
            raise ValueError("Glucosa debe estar entre 40 y 500 mg/dL")
        return v

    @field_validator("horas_sueno")
    def horas_sueno_valida(v: Optional[int]) -> Optional[int]:
        if v is not None and not (0 <= v <= 24):
            raise ValueError("Horas de sueño debe estar entre 0 y 24")
        return v

    @field_validator("minutos_sueno")
    def minutos_sueno_valida(v: Optional[int]) -> Optional[int]:
        if v is not None and not (0 <= v <= 59):
            raise ValueError("Minutos de sueño debe estar entre 0 y 59")
        return v

    @field_validator("nivel_estres")
    def check_estres(v):
        if v is not None and not (1 <= v <= 10):
            raise ValueError("nivel_estres debe estar entre 1 y 10")
        return v


class MetricaSaludCreate(MetricaSaludBase):
    pass


class MetricaSaludUpdate(BaseModel):
    fecha_metrica: Optional[date] = None
    peso_kg: Optional[float] = None
    presion_sistolica: Optional[int] = None
    presion_diastolica: Optional[int] = None
    ritmo_cardiaco: Optional[int] = None
    glucosa_sangre: Optional[float] = None
    horas_sueno: Optional[int] = None
    minutos_sueno: Optional[int] = None
    nivel_estres: Optional[int] = None
    notas: Optional[str] = None


class MetricaSaludOut(MetricaSaludBase):
    metrica_id: int
    usuario_id: int
    fecha_creacion: datetime

    model_config = {"from_attributes": True}


# HÁBITO
class HabitoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    frecuencia: Optional[Literal["diario", "semanal", "mensual", "personalizado"]] = "diario"
    objetivo_cantidad: Optional[int] = 1
    unidad: Optional[str] = "veces"
    hora_recordatorio: Optional[time] = None
    activo: Optional[bool] = True

    @field_validator("nombre")
    def nombre_no_vacio(v: str) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError("Nombre del hábito debe tener al menos 2 caracteres")
        return v.strip()

    @field_validator("objetivo_cantidad")
    def objetivo_valido(v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("Objetivo cantidad debe ser mayor a 0")
        return v


class HabitoCreate(HabitoBase):
    pass


class HabitoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    frecuencia: Optional[Literal["diario", "semanal", "mensual", "personalizado"]] = None
    objetivo_cantidad: Optional[int] = None
    unidad: Optional[str] = None
    hora_recordatorio: Optional[time] = None
    activo: Optional[bool] = None


class HabitoOut(HabitoBase):
    habito_id: int
    usuario_id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    model_config = {"from_attributes": True}


# REGISTRO DE HÁBITO
class RegistroHabitoBase(BaseModel):
    fecha_registro: date
    cantidad_completada: Optional[int] = 0
    notas: Optional[str] = None


class RegistroHabitoCreate(RegistroHabitoBase):
    pass


class RegistroHabitoUpdate(BaseModel):
    cantidad_completada: Optional[int] = None
    notas: Optional[str] = None


class RegistroHabitoOut(RegistroHabitoBase):
    registro_id: int
    habito_id: int
    fecha_creacion: datetime

    model_config = {"from_attributes": True}


# SESIÓN DE ENTRENAMIENTO
class SesionEntrenamientoBase(BaseModel):
    tipo_entrenamiento: str
    inicio: datetime
    duracion_minutos: Optional[int] = None
    calorias_quemadas: Optional[int] = None
    ritmo_promedio: Optional[int] = None
    nivel_intensidad: Optional[int] = None
    notas: Optional[str] = None

    @field_validator("tipo_entrenamiento")
    def tipo_no_vacio(v: str) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError("Tipo de entrenamiento debe tener al menos 2 caracteres")
        return v.strip()

    @field_validator("duracion_minutos")
    def duracion_valida(v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError("Duración debe ser mayor a 0 minutos")
        if v is not None and v > 1440:  # 24 horas
            raise ValueError("Duración no puede exceder 1440 minutos (24 horas)")
        return v

    @field_validator("calorias_quemadas")
    def calorias_validas(v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Calorías no puede ser negativa")
        return v

    @field_validator("ritmo_promedio")
    def ritmo_valido(v: Optional[int]) -> Optional[int]:
        if v is not None and not (30 <= v <= 200):
            raise ValueError("Ritmo promedio debe estar entre 30 y 200 bpm")
        return v

    @field_validator("nivel_intensidad")
    def check_intensidad(v):
        if v is not None and not (1 <= v <= 10):
            raise ValueError("nivel_intensidad debe estar entre 1 y 10")
        return v


class SesionEntrenamientoCreate(SesionEntrenamientoBase):
    pass


class SesionEntrenamientoUpdate(BaseModel):
    tipo_entrenamiento: Optional[str] = None
    inicio: Optional[datetime] = None
    duracion_minutos: Optional[int] = None
    calorias_quemadas: Optional[int] = None
    ritmo_promedio: Optional[int] = None
    nivel_intensidad: Optional[int] = None
    notas: Optional[str] = None


class SesionEntrenamientoOut(SesionEntrenamientoBase):
    sesion_id: int
    usuario_id: int
    fecha_creacion: datetime

    model_config = {"from_attributes": True}


# MEDICACIÓN PROGRAMADA
FrecuenciaMed = Literal[
    "una_vez_dia", "dos_veces_dia", "tres_veces_dia",
    "semanal", "segun_necesidad", "personalizado"
]


class MedicacionBase(BaseModel):
    nombre_medicacion: str
    dosis: Optional[str] = None
    frecuencia: Optional[FrecuenciaMed] = "una_vez_dia"
    hora_programada: Optional[time] = None
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    instrucciones: Optional[str] = None
    activo: Optional[bool] = True

    @field_validator("nombre_medicacion")
    def nombre_no_vacio(v: str) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError("Nombre de medicación debe tener al menos 2 caracteres")
        return v.strip()

    @model_validator(mode="after")
    def fecha_fin_valida(self):
        if self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValueError("Fecha fin debe ser igual o posterior a fecha inicio")
        return self


class MedicacionCreate(MedicacionBase):
    pass


class MedicacionUpdate(BaseModel):
    nombre_medicacion: Optional[str] = None
    dosis: Optional[str] = None
    frecuencia: Optional[FrecuenciaMed] = None
    hora_programada: Optional[time] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    instrucciones: Optional[str] = None
    activo: Optional[bool] = None


class MedicacionOut(MedicacionBase):
    medicacion_id: int
    usuario_id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    model_config = {"from_attributes": True}


# PLAN
TipoPlan = Literal["fitness", "nutricion", "bienestar", "rehabilitacion", "personalizado"]
EstadoPlan = Literal["borrador", "activo", "pausado", "completado", "cancelado"]


class PlanBase(BaseModel):
    nombre_plan: str
    tipo_plan: TipoPlan
    descripcion: Optional[str] = None
    objetivos: Optional[str] = None
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    estado: Optional[EstadoPlan] = "borrador"

    @field_validator("nombre_plan")
    def nombre_no_vacio(v: str) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError("Nombre del plan debe tener al menos 2 caracteres")
        return v.strip()

    @model_validator(mode="after")
    def fecha_fin_valida(self):
        if self.fecha_fin and self.fecha_fin < self.fecha_inicio:
            raise ValueError("Fecha fin debe ser igual o posterior a fecha inicio")
        return self


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    nombre_plan: Optional[str] = None
    tipo_plan: Optional[TipoPlan] = None
    descripcion: Optional[str] = None
    objetivos: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: Optional[EstadoPlan] = None
    


class PlanOut(PlanBase):
    plan_id: int
    usuario_id: int
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    model_config = {"from_attributes": True}


# ALERTA
TipoAlerta = Literal[
    "medicacion", "habito", "entrenamiento",
    "chequeo_salud", "sistema"
]
Prioridad = Literal["baja", "media", "alta", "urgente"]


class AlertaBase(BaseModel):
    tipo_alerta: TipoAlerta
    titulo: str
    mensaje: Optional[str] = None
    prioridad: Optional[Prioridad] = "media"
    programada_para: Optional[datetime] = None

    @field_validator("titulo")
    def titulo_no_vacio(v: str) -> str:
        if not v or len(v.strip()) < 2:
            raise ValueError("Título de alerta debe tener al menos 2 caracteres")
        return v.strip()


class AlertaCreate(AlertaBase):
    pass


class AlertaUpdate(BaseModel):
    titulo: Optional[str] = None
    mensaje: Optional[str] = None
    prioridad: Optional[Prioridad] = None
    leida: Optional[bool] = None
    programada_para: Optional[datetime] = None


class AlertaOut(AlertaBase):
    alerta_id: int
    usuario_id: int
    leida: bool
    fecha_creacion: datetime

    model_config = {"from_attributes": True}


# TOKEN DE AUTENTICACIÓN
# TokenAutenticacionOut schema removed — not referenced elsewhere in the codebase


# SESIONES DE ENTRENAMIENTO
class SesionCrear(BaseModel):
    tipo_entrenamiento: str
    inicio: Optional[datetime] = None
    duracion_minutos: Optional[int] = None
    calorias_quemadas: Optional[int] = None
    ritmo_promedio: Optional[int] = None
    nivel_intensidad: Optional[int] = None  # 1-10
    notas: Optional[str] = None


class SesionActualizar(BaseModel):
    tipo_entrenamiento: Optional[str] = None
    duracion_minutos: Optional[int] = None
    calorias_quemadas: Optional[int] = None
    ritmo_promedio: Optional[int] = None
    nivel_intensidad: Optional[int] = None
    notas: Optional[str] = None


class SesionRespuesta(BaseModel):
    sesion_id: int
    usuario_id: int
    tipo_entrenamiento: str
    inicio: datetime
    duracion_minutos: Optional[int]
    calorias_quemadas: Optional[int]
    ritmo_promedio: Optional[int]
    nivel_intensidad: Optional[int]
    notas: Optional[str]
    fecha_creacion: datetime

    model_config = {"from_attributes": True}