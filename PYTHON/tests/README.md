# Tests - VitaliaCJ

## Estructura

```
tests/
├── test_auth.py           # Tests de autenticación y registro
├── test_schemas.py         # Tests de validaciones Pydantic
└── test_endpoints.py       # Tests de endpoints activos (usuarios, métricas, sesiones, hábitos)
```

## Instalación de dependencias

```bash
cd PYTHON
pip install -r requirements-test.txt
```

## Ejecutar tests

### Todos los tests
```bash
pytest tests/ -v
```

### Tests específicos
```bash
# Solo autenticación
pytest tests/test_auth.py -v

# Solo validaciones
pytest tests/test_schemas.py -v

# Solo endpoints
pytest tests/test_endpoints.py -v

# Con cobertura
pytest tests/ --cov=app --cov-report=html
```

## Qué se prueba

### test_auth.py
✅ Registro exitoso
✅ Email duplicado (rechaza)
✅ Contraseña débil (rechaza)
✅ Login exitoso
✅ Login con credenciales incorrectas (rechaza)
✅ Email case-insensitive

### test_schemas.py
✅ Validaciones de Usuario (altura, peso, contraseña)
✅ Validaciones de Métricas (presión, glucosa, estrés, peso)
✅ Validaciones de Sesión (duración, intensidad, calorías)
✅ Validaciones de Medicación (fecha fin >= inicio)
✅ Validaciones de Plan (fecha fin >= inicio)
✅ Validaciones de Hábito (objetivo > 0)
✅ Validaciones de Alerta (título no vacío)

### test_endpoints.py
✅ GET /usuarios/me - Obtener perfil
✅ PUT /usuarios/me - Actualizar perfil
✅ POST /metricas/ - Crear métrica
✅ GET /metricas/ - Listar métricas
✅ GET /metricas/resumen/general - Resumen de métricas
✅ POST /sesiones/ - Crear sesión
✅ GET /sesiones/ - Listar sesiones
✅ GET /sesiones/stats/resumen - Resumen de sesiones
✅ POST /habitos/ - Crear hábito
✅ GET /habitos/ - Listar hábitos
✅ POST /habitos/{id}/registros - Crear registro de hábito

## Estado de cobertura

- **auth.py**: ~95% (registro, login, refresh)
- **usuarios.py**: ~85% (CRUD básico)
- **metricas.py**: ~90% (CRUD + análisis)
- **sesiones.py**: ~90% (CRUD + stats)
- **habitos.py**: ~90% (CRUD + estadísticas)
- **schemas.py**: ~100% (todas las validaciones)

## Notas importantes

- Los tests usan SQLite en memoria (`:memory:` o `test.db`)
- Cada test es independiente (sin contaminar BD)
- Se utilizan fixtures para compartir tokens/usuarios
- Los tests validan tanto entrada válida como inválida (happy path + error cases)

## Próximos pasos para cobertura al 100%

- Tests para medicación (POST, PUT, DELETE)
- Tests para planes y notas de entrenador
- Tests para alertas
- Tests de autorización (usuarios no pueden ver datos de otros)
- Tests de paginación
- Tests de filtros avanzados
