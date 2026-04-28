# Vitalia CJ – Plataforma Multiplataforma de Salud y Bienestar

## 🧩 Descripción General
**Vitalia CJ** es un proyecto completo desarrollado como Trabajo Final de Grado (TFG).  
Su objetivo es ofrecer una plataforma integral de salud y bienestar compuesta por:

- **API Backend (Python + FastAPI)**
- **Aplicación de Escritorio (VB.NET – WPF)**
- **Aplicación Android (Kotlin + Jetpack Compose)**
- **Interfaz Web (HTML/CSS/JS)**
- **Base de Datos MySQL**

El sistema permite gestionar usuarios, métricas, hábitos, medicación, alertas y planes personalizados.

---

# 🗂 Estructura del Repositorio

Vitalia_CJ/
│
├── ANDROID/              # Aplicación móvil Android (Kotlin)
│
├── PYTHON/               # API Backend (FastAPI)
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── main.py
│   ├── .env.example
│   └── requirements.txt
│
├── SQL/                  # Base de datos
│   └── TFG.sql
│
├── VISUAL/               # Aplicación de escritorio (VB.NET – WPF)
│
├── WEB/                  # Interfaz web
│   ├── css/
│   ├── js/
│   └── pages/
│
└── README.md

Code

---

# 🛠 Tecnologías Utilizadas

### Backend
- Python 3  
- FastAPI  
- SQLAlchemy  
- MySQL  
- Pydantic  
- Uvicorn  

### Frontend Web
- HTML5  
- CSS3  
- JavaScript  

### Aplicación Android
- Kotlin  
- Jetpack Compose  
- Retrofit  
- MVVM  

### Aplicación Escritorio
- VB.NET  
- WPF  
- MVVM  

### Otros
- Git & GitHub  
- MySQL Workbench  

---

# 🚀 Cómo Ejecutar Cada Módulo

---

## 🟦 1. API Backend (FastAPI)

### Crear entorno virtual
python -m venv .venv

Code

### Activarlo (Windows)
.venv\Scripts\activate

Code

### Instalar dependencias
pip install -r requirements.txt

Code

### Ejecutar la API
uvicorn app.main:app --reload

Code

### Documentación automática
- Swagger UI → `http://127.0.0.1:8000/docs`
- ReDoc → `http://127.0.0.1:8000/redoc`

---

## 🟩 2. Aplicación Android

### Requisitos
- Android Studio  
- SDK 24+  

### Ejecución
1. Abrir Android Studio  
2. Seleccionar la carpeta `ANDROID/`  
3. Sincronizar Gradle  
4. Ejecutar en emulador o dispositivo físico  

---

## 🟧 3. Aplicación de Escritorio (VB.NET – WPF)

### Requisitos
- Visual Studio 2022  
- .NET 6 o superior  

### Ejecución
1. Abrir Visual Studio  
2. Cargar la solución:  
VISUAL/VitaliaJC/VitaliaJC.sln

Code
3. Ejecutar con F5  

---

## 🟨 4. Interfaz Web

### Ejecución
1. Abrir la carpeta `WEB/`  
2. Abrir `pages/login.html` en el navegador  

---

## 🟥 5. Base de Datos MySQL

### Importar la base de datos
1. Abrir MySQL Workbench  
2. Crear una base de datos vacía  
3. Importar el archivo:  
SQL/TFG.sql

Code

---

# 🧪 Endpoints Principales de la API

- `/auth/login` – Autenticación  
- `/usuarios/` – Gestión de usuarios  
- `/metricas/` – Registro de métricas  
- `/habitos/` – Hábitos saludables  
- `/medicacion/` – Medicación  
- `/alertas/` – Alertas personalizadas  
- `/planes/` – Planes de salud  

---

# 🏷 Tags Semanales (Requisito del TFG)

Crear un tag por semana:

git tag entrega-semana-X
git push origin entrega-semana-X

Code

Ejemplo:

git tag entrega-semana-0
git push origin entrega-semana-0

Code

---

# 👥 Autores
- **Jaime Perán Alcantarilla**  
- **Carlota Lebrancon**

---

# 👨‍🏫 Tutor
- **franciscomendezjoyfe**