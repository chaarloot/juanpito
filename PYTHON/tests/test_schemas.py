"""
tests/test_schemas.py – Tests para validaciones de schemas Pydantic
"""
import pytest
from datetime import date, datetime, time
from pydantic import ValidationError

from app.schemas.schemas import (
    UsuarioCreate, MetricaSaludCreate, SesionEntrenamientoCreate,
    MedicacionCreate, PlanCreate, HabitoCreate, AlertaCreate
)


class TestUsuarioValidation:
    """Tests para validaciones de usuario"""

    def test_usuario_valido(self):
        """Crear usuario con datos válidos"""
        user = UsuarioCreate(
            nombre="Juan",
            apellidos="Pérez",
            email="juan@test.com",
            password="SecurePass123!"
        )
        assert user.nombre == "Juan"

    def test_contraseña_muy_corta(self):
        """Rechazar contraseña < 8 caracteres"""
        with pytest.raises(ValidationError) as exc_info:
            UsuarioCreate(
                nombre="Juan",
                apellidos="Pérez",
                email="juan@test.com",
                password="Short1!"
            )
        assert "8 caracteres" in str(exc_info.value)

    def test_contraseña_sin_mayuscula(self):
        """Rechazar contraseña sin mayúscula"""
        with pytest.raises(ValidationError):
            UsuarioCreate(
                nombre="Juan",
                apellidos="Pérez",
                email="juan@test.com",
                password="securepass123!"
            )

    def test_contraseña_sin_numero(self):
        """Rechazar contraseña sin número"""
        with pytest.raises(ValidationError):
            UsuarioCreate(
                nombre="Juan",
                apellidos="Pérez",
                email="juan@test.com",
                password="SecurePass!"
            )

    def test_altura_invalida(self):
        """Rechazar altura fuera de rango"""
        with pytest.raises(ValidationError):
            UsuarioCreate(
                nombre="Juan",
                apellidos="Pérez",
                email="juan@test.com",
                password="SecurePass123!",
                altura_cm=500  # > 300
            )

    def test_peso_invalido(self):
        """Rechazar peso fuera de rango"""
        with pytest.raises(ValidationError):
            UsuarioCreate(
                nombre="Juan",
                apellidos="Pérez",
                email="juan@test.com",
                password="SecurePass123!",
                peso_kg=20  # < 30
            )

    def test_nombre_muy_corto(self):
        """Rechazar nombre < 2 caracteres"""
        with pytest.raises(ValidationError):
            UsuarioCreate(
                nombre="J",
                apellidos="Pérez",
                email="juan@test.com",
                password="SecurePass123!"
            )


class TestMetricaSaludValidation:
    """Tests para validaciones de métricas de salud"""

    def test_metrica_valida(self):
        """Crear métrica con datos válidos"""
        metrica = MetricaSaludCreate(
            fecha_metrica=date.today(),
            peso_kg=75.5,
            presion_sistolica=120,
            presion_diastolica=80,
            nivel_estres=5
        )
        assert metrica.peso_kg == 75.5

    def test_nivel_estres_invalido(self):
        """Rechazar nivel de estrés fuera de 1-10"""
        with pytest.raises(ValidationError):
            MetricaSaludCreate(
                fecha_metrica=date.today(),
                nivel_estres=15
            )

    def test_presion_invalida(self):
        """Rechazar presión fuera de rango"""
        with pytest.raises(ValidationError):
            MetricaSaludCreate(
                fecha_metrica=date.today(),
                presion_sistolica=300  # > 200
            )

    def test_peso_invalido(self):
        """Rechazar peso fuera de rango"""
        with pytest.raises(ValidationError):
            MetricaSaludCreate(
                fecha_metrica=date.today(),
                peso_kg=500
            )

    def test_glucosa_invalida(self):
        """Rechazar glucosa fuera de rango"""
        with pytest.raises(ValidationError):
            MetricaSaludCreate(
                fecha_metrica=date.today(),
                glucosa_sangre=600
            )


class TestSesionEntrenamientoValidation:
    """Tests para validaciones de sesión de entrenamiento"""

    def test_sesion_valida(self):
        """Crear sesión con datos válidos"""
        sesion = SesionEntrenamientoCreate(
            tipo_entrenamiento="Cardio",
            inicio=datetime.now(),
            duracion_minutos=30,
            calorias_quemadas=300,
            nivel_intensidad=7
        )
        assert sesion.duracion_minutos == 30

    def test_duracion_cero(self):
        """Rechazar duración <= 0"""
        with pytest.raises(ValidationError):
            SesionEntrenamientoCreate(
                tipo_entrenamiento="Cardio",
                inicio=datetime.now(),
                duracion_minutos=0
            )

    def test_intensidad_invalida(self):
        """Rechazar intensidad fuera de 1-10"""
        with pytest.raises(ValidationError):
            SesionEntrenamientoCreate(
                tipo_entrenamiento="Cardio",
                inicio=datetime.now(),
                duracion_minutos=30,
                nivel_intensidad=15
            )

    def test_calorias_negativas(self):
        """Rechazar calorías negativas"""
        with pytest.raises(ValidationError):
            SesionEntrenamientoCreate(
                tipo_entrenamiento="Cardio",
                inicio=datetime.now(),
                duracion_minutos=30,
                calorias_quemadas=-100
            )

    def test_tipo_vacio(self):
        """Rechazar tipo de entrenamiento vacío"""
        with pytest.raises(ValidationError):
            SesionEntrenamientoCreate(
                tipo_entrenamiento="",
                inicio=datetime.now(),
                duracion_minutos=30
            )


class TestMedicacionValidation:
    """Tests para validaciones de medicación"""

    def test_medicacion_valida(self):
        """Crear medicación con datos válidos"""
        med = MedicacionCreate(
            nombre_medicacion="Ibuprofeno",
            fecha_inicio=date.today()
        )
        assert med.nombre_medicacion == "Ibuprofeno"

    def test_fecha_fin_anterior_inicio(self):
        """Rechazar fecha fin anterior a inicio"""
        with pytest.raises(ValidationError):
            MedicacionCreate(
                nombre_medicacion="Ibuprofeno",
                fecha_inicio=date(2026, 5, 10),
                fecha_fin=date(2026, 5, 5)  # anterior
            )

    def test_nombre_medicacion_vacio(self):
        """Rechazar nombre de medicación vacío"""
        with pytest.raises(ValidationError):
            MedicacionCreate(
                nombre_medicacion="",
                fecha_inicio=date.today()
            )


class TestPlanValidation:
    """Tests para validaciones de plan"""

    def test_plan_valido(self):
        """Crear plan con datos válidos"""
        plan = PlanCreate(
            nombre_plan="Plan Fitness",
            tipo_plan="fitness",
            fecha_inicio=date.today()
        )
        assert plan.nombre_plan == "Plan Fitness"

    def test_fecha_fin_anterior_inicio(self):
        """Rechazar fecha fin anterior a inicio"""
        with pytest.raises(ValidationError):
            PlanCreate(
                nombre_plan="Plan Fitness",
                tipo_plan="fitness",
                fecha_inicio=date(2026, 5, 10),
                fecha_fin=date(2026, 5, 5)
            )

    def test_nombre_plan_vacio(self):
        """Rechazar nombre de plan vacío"""
        with pytest.raises(ValidationError):
            PlanCreate(
                nombre_plan="",
                tipo_plan="fitness",
                fecha_inicio=date.today()
            )


class TestHabitoValidation:
    """Tests para validaciones de hábito"""

    def test_habito_valido(self):
        """Crear hábito con datos válidos"""
        habito = HabitoCreate(
            nombre="Beber agua"
        )
        assert habito.nombre == "Beber agua"

    def test_objetivo_invalid(self):
        """Rechazar objetivo 0 o negativo"""
        with pytest.raises(ValidationError):
            HabitoCreate(
                nombre="Hábito",
                objetivo_cantidad=0
            )

    def test_nombre_vacio(self):
        """Rechazar nombre de hábito vacío"""
        with pytest.raises(ValidationError):
            HabitoCreate(
                nombre=""
            )


class TestAlertaValidation:
    """Tests para validaciones de alerta"""

    def test_alerta_valida(self):
        """Crear alerta con datos válidos"""
        alerta = AlertaCreate(
            tipo_alerta="medicacion",
            titulo="Tomar medicina"
        )
        assert alerta.titulo == "Tomar medicina"

    def test_titulo_vacio(self):
        """Rechazar título de alerta vacío"""
        with pytest.raises(ValidationError):
            AlertaCreate(
                tipo_alerta="medicacion",
                titulo=""
            )
