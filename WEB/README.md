# 🎨 Frontend Vitalia CJ - Dashboard Moderno

## 📋 Descripción

Frontend moderno y profesional para la plataforma Vitalia CJ, con interfaz similar a la proporcionada. Diseño oscuro con tema amarillo/negro, totalmente responsivo y conectado con la API FastAPI.

## ✨ Características

✅ **Autenticación JWT**
- Login y registro de usuarios
- Token de acceso y refresh token
- Gestión de sesión local

✅ **Dashboard Completo**
- Estadísticas principales (entrenamientos, calorías, minutos activos, récords)
- Gráficos interactivos con Chart.js
- Actividad semanal visualizada
- Racha de entrenamiento con progreso
- Tabla de ejercicios del día

✅ **Navegación Intuitiva**
- Sidebar con menú principal
- Secciones: Dashboard, Mis Rutinas, Progreso, Calendario
- Subsecciones: Ejercicios, Estadísticas, Historial
- Perfil de usuario con avatar dinámico

✅ **Diseño Profesional**
- Tema oscuro moderno
- Color principal: Amarillo (#c8ff00)
- Animaciones suaves
- Totalmente responsivo
- Interfaces claras y modernas

## 🚀 Cómo Usar

### 1. Asegúrate de que el Backend está corriendo

```bash
cd PYTHON
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verifica que esté disponible en: http://127.0.0.1:8000/docs

### 2. Abre el Frontend

Abre en el navegador:
```
file:///c:/Users/Juan%20Cendrero/Desktop/tfgchar/juanpito/WEB/index.html
```

O simplemente haz doble clic en `WEB/index.html`

### 3. Registra un Usuario

En la pantalla de login, haz clic en **"Regístrate aquí"** y completa:
- Nombre
- Apellidos  
- Email
- Contraseña

### 4. Inicia Sesión

Usa esta credencial de prueba:

- `juan@test.com` / `Vitalia2026!`

Si la sesión expira, el frontend intenta renovar el token automáticamente antes de mostrar el login.

### 5. Explora el Dashboard

- **Mi Panel**: Ver estadísticas y actividad
- **Mis Rutinas**: Gestionar rutinas de entrenamiento
- **Progreso**: Ver tu progreso personal
- **Calendario**: Ver entrenamientos por fecha
- **Ejercicios**: Catálogo de ejercicios
- **Estadísticas**: Análisis detallado
- **Historial**: Historial de entrenamientos

## 🔌 Conexión con API

El frontend se conecta con estos endpoints:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/auth/register` | POST | Registrar usuario |
| `/auth/login` | POST | Iniciar sesión |
| `/auth/refresh` | POST | Renovar token |
| `/usuarios/me` | GET | Obtener perfil actual |
| `/metricas/` | GET | Obtener métricas de salud |
| `/habitos/` | GET | Obtener hábitos |
| `/medicacion/` | GET | Obtener medicación |
| `/planes/` | GET | Obtener planes |
| `/alertas/` | GET | Obtener alertas |

## 📁 Estructura de Archivos

```
WEB/
├── index.html           # HTML principal
├── pages/
│   └── login.html       # (antiguo - ahora integrado)
├── css/
│   ├── login.css        # (antiguo - ahora integrado)
│   └── estilos.css      # ✨ Nuevos estilos modernos
└── js/
    ├── login.js         # (antiguo - reemplazado)
    ├── auth.js          # ✨ Autenticación mejorada
    └── app.js           # ✨ Lógica de la aplicación
```

## 🎨 Diseño y Colores

- **Color Primario**: `#c8ff00` (Amarillo neon)
- **Fondo Oscuro**: `#0a0a0a` (Negro oscuro)
- **Fondo Claro**: `#1e1e1e` (Gris oscuro)
- **Texto Principal**: `#ffffff` (Blanco)
- **Texto Secundario**: `#a0a0a0` (Gris)

## 🔧 Personalización

### Cambiar URL de API

En `js/auth.js`:
```javascript
const API_URL = 'http://127.0.0.1:8000'; // Cambia aquí
```

### Cambiar Colores

En `css/estilos.css`:
```css
:root {
    --color-primary: #c8ff00; /* Amarillo */
    --color-secondary: #1e1e1e; /* Gris oscuro */
    /* ... más variables */
}
```

## 📊 Próximas Mejoras

- [ ] Editar/eliminar ejercicios
- [ ] Gráficos de progreso temporal más avanzados
- [ ] Notificaciones en tiempo real
- [ ] Exportar datos a PDF
- [ ] Integración con wearables
- [ ] Tema claro/oscuro toggle
- [ ] Múltiples idiomas

## 🐛 Troubleshooting

### Error: "No se puede conectar a la API"
- Asegúrate de que el backend está corriendo
- Verifica que esté en `http://127.0.0.1:8000`
- Comprueba la consola del navegador (F12)

### Error: "CORS"
- El backend debe tener CORS habilitado
- En `PYTHON/app/main.py`, CORS está configurado para aceptar `null` y orígenes locales de desarrollo

### Error: "Email ya existe"
- El email ya está registrado en la base de datos
- Usa otro email o limpia la BD

## 📝 Notas

- Los datos se guardan en SQLite (`vitalia.db`)
- Los tokens se guardan en localStorage
- El frontend muestra mensajes de estado en login y registro
- El frontend intenta refrescar el token automáticamente si expira
- El frontend es 100% stand-alone, sin dependencias de build
- Compatible con todos los navegadores modernos

## 👨‍💻 Autor

Creado como parte del proyecto Vitalia CJ - Fitness Tracker

---

**¡Disfruta entrenando con Vitalia! 💪**
