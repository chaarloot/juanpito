"""
tests/test_endpoints.py – Tests para endpoints críticos
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date, datetime

from app.main import app
from app.core.database import get_db, Base


# ────────────────────────────────────────────────────────────────
# Setup BD de prueba
# ────────────────────────────────────────────────────────────────

DATABASE_URL = "sqlite:///./test_endpoints.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


Base.metadata.create_all(bind=engine)
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


# ────────────────────────────────────────────────────────────────
# Fixtures
# ────────────────────────────────────────────────────────────────

@pytest.fixture
def usuario_token():
    """Registrar usuario y retornar token"""
    # Registrar
    response = client.post(
        "/auth/register",
        json={
            "nombre": "Test",
            "apellidos": "User",
            "email": "testuser@test.com",
            "password": "TestPass123!"
        }
    )
    assert response.status_code == 201
    
    # Login
    login_response = client.post(
        "/auth/login",
        data={"username": "testuser@test.com", "password": "TestPass123!"}
    )
    assert login_response.status_code == 200
    return login_response.json()["access_token"]


# ────────────────────────────────────────────────────────────────
# Tests Usuarios
# ────────────────────────────────────────────────────────────────

class TestUsuariosEndpoints:
    """Tests para endpoints de usuarios"""

    def test_get_usuario_me(self, usuario_token):
        """Obtener perfil del usuario autenticado"""
        response = client.get(
            "/usuarios/me",
            headers={"Authorization": f"Bearer {usuario_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "testuser@test.com"
        assert data["nombre"] == "Test"

    def test_get_usuario_me_sin_token(self):
        """Rechazar sin token"""
        response = client.get("/usuarios/me")
        assert response.status_code == 403

    def test_update_usuario(self, usuario_token):
        """Actualizar perfil del usuario"""
        response = client.put(
            "/usuarios/me",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "nombre": "TestUpdated",
                "altura_cm": 180.0,
                "peso_kg": 75.5
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "TestUpdated"
        assert data["altura_cm"] == 180.0

    def test_update_usuario_altura_invalida(self, usuario_token):
        """Rechazar altura fuera de rango"""
        response = client.put(
            "/usuarios/me",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "altura_cm": 500  # > 300
            }
        )
        assert response.status_code == 422


# ────────────────────────────────────────────────────────────────
# Tests Métricas
# ────────────────────────────────────────────────────────────────

class TestMetricasEndpoints:
    """Tests para endpoints de métricas"""

    def test_crear_metrica(self, usuario_token):
        """Crear métrica de salud"""
        response = client.post(
            "/metricas/",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "fecha_metrica": str(date.today()),
                "peso_kg": 75.5,
                "presion_sistolica": 120,
                "presion_diastolica": 80,
                "nivel_estres": 5
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["peso_kg"] == 75.5

    def test_crear_metrica_estres_invalido(self, usuario_token):
        """Rechazar métrica con estrés inválido"""
        response = client.post(
            "/metricas/",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "fecha_metrica": str(date.today()),
                "nivel_estres": 15  # > 10
            }
        )
        assert response.status_code == 422

    def test_listar_metricas(self, usuario_token):
        """Listar métricas del usuario"""
        # Crear métrica
        client.post(
            "/metricas/",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "fecha_metrica": str(date.today()),
                "peso_kg": 75.5
            }
        )
        
        # Listar
        response = client.get(
            "/metricas/",
            headers={"Authorization": f"Bearer {usuario_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert data[0]["peso_kg"] == 75.5

    def test_resumen_metricas(self, usuario_token):
        """Obtener resumen de métricas"""
        # Crear varias métricas
        for i in range(3):
            client.post(
                "/metricas/",
                headers={"Authorization": f"Bearer {usuario_token}"},
                json={
                    "fecha_metrica": str(date.today()),
                    "peso_kg": 75.0 + i,
                    "nivel_estres": 5 + i
                }
            )
        
        # Resumen
        response = client.get(
            "/metricas/resumen/general?dias_atras=30",
            headers={"Authorization": f"Bearer {usuario_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_registros"] >= 3
        assert data["peso"]["promedio"] is not None


# ────────────────────────────────────────────────────────────────
# Tests Sesiones
# ────────────────────────────────────────────────────────────────

class TestSesionesEndpoints:
    """Tests para endpoints de sesiones"""

    def test_crear_sesion(self, usuario_token):
        """Crear sesión de entrenamiento"""
        response = client.post(
            "/sesiones/",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "tipo_entrenamiento": "Cardio",
                "duracion_minutos": 30,
                "calorias_quemadas": 250,
                "nivel_intensidad": 7
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["tipo_entrenamiento"] == "Cardio"

    def test_crear_sesion_duracion_invalida(self, usuario_token):
        """Rechazar sesión con duración <= 0"""
        response = client.post(
            "/sesiones/",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "tipo_entrenamiento": "Cardio",
                "duracion_minutos": 0
            }
        )
        assert response.status_code == 422

    def test_listar_sesiones(self, usuario_token):
        """Listar sesiones del usuario"""
        # Crear sesión
        client.post(
            "/sesiones/",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "tipo_entrenamiento": "Pesas",
                "duracion_minutos": 45,
                "calorias_quemadas": 400
            }
        )
        
        # Listar
        response = client.get(
            "/sesiones/",
            headers={"Authorization": f"Bearer {usuario_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0

    def test_resumen_sesiones(self, usuario_token):
        """Obtener resumen de sesiones de entrenamiento"""
        # Crear sesiones
        for i in range(2):
            client.post(
                "/sesiones/",
                headers={"Authorization": f"Bearer {usuario_token}"},
                json={
                    "tipo_entrenamiento": f"Cardio{i}",
                    "duracion_minutos": 30 + i * 10,
                    "calorias_quemadas": 250 + i * 50
                }
            )
        
        # Resumen
        response = client.get(
            "/sesiones/stats/resumen?dias_atras=30",
            headers={"Authorization": f"Bearer {usuario_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total_entrenamientos"] >= 2


# ────────────────────────────────────────────────────────────────
# Tests Hábitos
# ────────────────────────────────────────────────────────────────

class TestHabitosEndpoints:
    """Tests para endpoints de hábitos"""

    def test_crear_habito(self, usuario_token):
        """Crear hábito"""
        response = client.post(
            "/habitos/",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "nombre": "Beber agua",
                "frecuencia": "diario",
                "objetivo_cantidad": 8
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["nombre"] == "Beber agua"

    def test_listar_habitos(self, usuario_token):
        """Listar hábitos del usuario"""
        # Crear hábito
        client.post(
            "/habitos/",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "nombre": "Ejercicio",
                "frecuencia": "diario"
            }
        )
        
        # Listar
        response = client.get(
            "/habitos/",
            headers={"Authorization": f"Bearer {usuario_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0

    def test_crear_registro_habito(self, usuario_token):
        """Crear registro de cumplimiento de hábito"""
        # Crear hábito
        habito_response = client.post(
            "/habitos/",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "nombre": "Meditar",
                "frecuencia": "diario"
            }
        )
        habito_id = habito_response.json()["habito_id"]
        
        # Crear registro
        response = client.post(
            f"/habitos/{habito_id}/registros",
            headers={"Authorization": f"Bearer {usuario_token}"},
            json={
                "fecha_registro": str(date.today()),
                "cantidad_completada": 1
            }
        )
        assert response.status_code == 201
