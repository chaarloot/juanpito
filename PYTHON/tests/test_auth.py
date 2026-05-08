"""
tests/test_auth.py – Tests para autenticación
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.main import app
from app.core.database import get_db, Base
from app.models.models import Usuario


# ────────────────────────────────────────────────────────────────
# Configurar BD de prueba
# ────────────────────────────────────────────────────────────────

DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override para usar BD de prueba"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


Base.metadata.create_all(bind=engine)
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


# ────────────────────────────────────────────────────────────────
# Tests
# ────────────────────────────────────────────────────────────────

class TestAuth:
    """Tests para endpoints de autenticación"""

    def test_registro_exitoso(self):
        """Registrar usuario con datos válidos"""
        response = client.post(
            "/auth/register",
            json={
                "nombre": "Juan",
                "apellidos": "Pérez",
                "email": "juan@test.com",
                "password": "TestPass123!",
                "fecha_nacimiento": None,
                "genero": None,
                "altura_cm": None,
                "peso_kg": None,
                "zona_horaria": "UTC"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "juan@test.com"
        assert data["nombre"] == "Juan"

    def test_registro_email_duplicado(self):
        """No permitir email duplicado"""
        email = "duplicate@test.com"
        # Crear usuario
        client.post(
            "/auth/register",
            json={
                "nombre": "Juan",
                "apellidos": "Pérez",
                "email": email,
                "password": "TestPass123!",
            }
        )
        # Intentar crear otro con mismo email
        response = client.post(
            "/auth/register",
            json={
                "nombre": "Pedro",
                "apellidos": "López",
                "email": email,
                "password": "TestPass456!",
            }
        )
        assert response.status_code == 400
        assert "existe" in response.json()["detail"].lower()

    def test_contraseña_debil(self):
        """Rechazar contraseña débil (sin mayúscula)"""
        response = client.post(
            "/auth/register",
            json={
                "nombre": "Juan",
                "apellidos": "Pérez",
                "email": "weak@test.com",
                "password": "testpass123"  # sin mayúscula
            }
        )
        assert response.status_code == 422
        assert "mayúscula" in str(response.json()).lower()

    def test_login_exitoso(self):
        """Login con credenciales correctas"""
        # Registrar usuario
        email = "login@test.com"
        password = "LoginPass123!"
        client.post(
            "/auth/register",
            json={
                "nombre": "Login",
                "apellidos": "Test",
                "email": email,
                "password": password,
            }
        )
        
        # Login
        response = client.post(
            "/auth/login",
            data={"username": email, "password": password}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_credenciales_incorrectas(self):
        """Login con contraseña incorrecta"""
        email = "incorrect@test.com"
        client.post(
            "/auth/register",
            json={
                "nombre": "Inc",
                "apellidos": "Correct",
                "email": email,
                "password": "CorrectPass123!"
            }
        )
        
        response = client.post(
            "/auth/login",
            data={"username": email, "password": "WrongPassword123!"}
        )
        assert response.status_code == 401

    def test_email_case_insensitive(self):
        """Email normalizado (case-insensitive)"""
        response = client.post(
            "/auth/register",
            json={
                "nombre": "Case",
                "apellidos": "Test",
                "email": "CaseSensitive@Test.COM",
                "password": "CasePass123!"
            }
        )
        assert response.status_code == 201
        
        # Intentar login con mayúsculas diferentes
        login_response = client.post(
            "/auth/login",
            data={"username": "casesensitive@test.com", "password": "CasePass123!"}
        )
        assert login_response.status_code == 200
