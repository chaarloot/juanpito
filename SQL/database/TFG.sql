-- ============================================
-- BASE DE DATOS: VITALIA TRACKER
-- ============================================
DROP DATABASE IF EXISTS VitaliaCJ;
CREATE DATABASE IF NOT EXISTS VitaliaCJ;
USE VitaliaCJ;

-- ============================================
-- DROPS TABLAS (ORDEN CORRECTO)
-- ============================================
DROP TABLE IF EXISTS tokens_autenticacion;
DROP TABLE IF EXISTS alertas;
DROP TABLE IF EXISTS notas_entrenador;
DROP TABLE IF EXISTS planes;
DROP TABLE IF EXISTS medicacion_programada;
DROP TABLE IF EXISTS sesiones_entrenamiento;
DROP TABLE IF EXISTS registros_habitos;
DROP TABLE IF EXISTS habitos;
DROP TABLE IF EXISTS metricas_salud;
DROP TABLE IF EXISTS usuarios;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE,
    genero ENUM('hombre', 'mujer', 'otro', 'prefiero_no_decirlo'),
    altura_cm DECIMAL(5,2),
    peso_kg DECIMAL(5,2),
    zona_horaria VARCHAR(50) DEFAULT 'UTC',
    rol ENUM('usuario', 'entrenador', 'admin') DEFAULT 'usuario',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (email)
);

-- ============================================
-- TABLA: metricas_salud
-- ============================================
CREATE TABLE metricas_salud (
    metrica_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_metrica DATE NOT NULL,
    peso_kg DECIMAL(5,2),
    presion_sistolica SMALLINT,
    presion_diastolica SMALLINT,
    ritmo_cardiaco SMALLINT,
    glucosa_sangre DECIMAL(5,2),
    horas_sueno SMALLINT,
    minutos_sueno SMALLINT,
    nivel_estres SMALLINT CHECK (nivel_estres BETWEEN 1 AND 10),
    notas TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_metricas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- ============================================
-- TABLA: habitos
-- ============================================
CREATE TABLE habitos (
    habito_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    frecuencia ENUM('diario', 'semanal', 'mensual', 'personalizado') DEFAULT 'diario',
    objetivo_cantidad INT DEFAULT 1,
    unidad VARCHAR(50) DEFAULT 'veces',
    hora_recordatorio TIME,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_habitos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- ============================================
-- TABLA: registros_habitos
-- ============================================
CREATE TABLE registros_habitos (
    registro_id INT AUTO_INCREMENT PRIMARY KEY,
    habito_id INT NOT NULL,
    fecha_registro DATE NOT NULL,
    cantidad_completada INT DEFAULT 0,
    notas TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (habito_id, fecha_registro),

    CONSTRAINT fk_registros_habitos
        FOREIGN KEY (habito_id) REFERENCES habitos(habito_id)
        ON DELETE CASCADE
);

-- ============================================
-- TABLA: sesiones_entrenamiento
-- ============================================
CREATE TABLE sesiones_entrenamiento (
    sesion_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_entrenamiento VARCHAR(100) NOT NULL,
    inicio DATETIME NOT NULL,
    duracion_minutos INT,
    calorias_quemadas INT,
    ritmo_promedio SMALLINT,
    nivel_intensidad SMALLINT CHECK (nivel_intensidad BETWEEN 1 AND 10),
    notas TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sesiones_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- ============================================
-- TABLA: medicacion_programada
-- ============================================
CREATE TABLE medicacion_programada (
    medicacion_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre_medicacion VARCHAR(200) NOT NULL,
    dosis VARCHAR(100),
    frecuencia ENUM('una_vez_dia', 'dos_veces_dia', 'tres_veces_dia', 'semanal', 'segun_necesidad', 'personalizado') DEFAULT 'una_vez_dia',
    hora_programada TIME,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    instrucciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_medicacion_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- ============================================
-- TABLA: planes
-- ============================================
CREATE TABLE planes (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    entrenador_id INT,
    nombre_plan VARCHAR(200) NOT NULL,
    tipo_plan ENUM('fitness', 'nutricion', 'bienestar', 'rehabilitacion', 'personalizado') NOT NULL,
    descripcion TEXT,
    objetivos TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    estado ENUM('borrador', 'activo', 'pausado', 'completado', 'cancelado') DEFAULT 'borrador',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_planes_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_planes_entrenador
        FOREIGN KEY (entrenador_id) REFERENCES usuarios(usuario_id)
        ON DELETE SET NULL
);

-- ============================================
-- TABLA: notas_entrenador
-- ============================================
CREATE TABLE notas_entrenador (
    nota_id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    entrenador_id INT NOT NULL,
    contenido TEXT NOT NULL,
    privado BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notas_plan
        FOREIGN KEY (plan_id) REFERENCES planes(plan_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notas_entrenador
        FOREIGN KEY (entrenador_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- ============================================
-- TABLA: alertas
-- ============================================
CREATE TABLE alertas (
    alerta_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_alerta ENUM('medicacion', 'habito', 'entrenamiento', 'chequeo_salud', 'mensaje_entrenador', 'sistema') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT,
    prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
    leida BOOLEAN DEFAULT FALSE,
    programada_para DATETIME,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alertas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- ============================================
-- TABLA: tokens_autenticacion
-- ============================================
CREATE TABLE tokens_autenticacion (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    tipo_token ENUM('acceso', 'refresco', 'restablecer_password', 'verificacion_email') NOT NULL,
    expira DATETIME NOT NULL,
    ip VARCHAR(45),
    user_agent VARCHAR(500),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    revocado_en DATETIME,

    CONSTRAINT fk_tokens_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

INSERT INTO usuarios 
(email, password_hash, nombre, apellidos, fecha_nacimiento, genero, altura_cm, peso_kg, zona_horaria, rol)
VALUES
('carlota@vitalia.com', '$2b$12$q5PqQ43LkMTFBr0bqMu5VOHFPVDeqFhzBA/uiYSqyRdVqKi9Ksuoi', 'Carlota', 'Gómez', '1992-04-10', 'mujer', 168.00, 60.00, 'UTC', 'admin'),
('jaime@vitalia.com', '$2b$12$RUlgBQ/pl1.0HUSRlBadCO6jZl9LWcGYZCxI89P7tCrssTVdjBtqm', 'Jaime', 'Crespo', '1990-01-20', 'hombre', 175.00, 75.00, 'UTC', 'admin'),
('usuario1@vitalia.com', '$2b$12$SCB3OuZ5qam65ciG1dL7deQPRybNUmSsz3OhFHSgxzCMEP8bgh2Hy', 'Laura', 'Martínez', '1995-08-12', 'mujer', 162.00, 58.00, 'UTC', 'usuario'),
('usuario2@vitalia.com', '$2b$12$/mTbtvD/wtg.tstQKFsbFOJ3BBrHKkBuS1B9F3KQLiJM6hX4JIKQe', 'Pedro', 'López', '1988-11-03', 'hombre', 180.00, 82.00, 'UTC', 'usuario');

INSERT INTO metricas_salud 
(usuario_id, fecha_metrica, peso_kg, presion_sistolica, presion_diastolica, ritmo_cardiaco, glucosa_sangre, horas_sueno, minutos_sueno, nivel_estres, notas)
VALUES
(1, CURDATE(), 60.0, 118, 76, 70, 90.5, 7, 30, 4, 'Día normal, sin estrés'),
(2, CURDATE(), 75.0, 122, 80, 72, 95.0, 6, 45, 5, 'Entrenamiento intenso'),
(3, CURDATE(), 58.0, 110, 70, 65, 85.0, 8, 10, 3, 'Buena noche de sueño');

INSERT INTO habitos 
(usuario_id, nombre, descripcion, frecuencia, objetivo_cantidad, unidad, hora_recordatorio, activo)
VALUES
(1, 'Beber agua', 'Beber 8 vasos de agua al día', 'diario', 8, 'vasos', '09:00:00', TRUE),
(1, 'Meditación', 'Sesión de meditación matutina', 'diario', 1, 'sesión', '07:00:00', TRUE),
(2, 'Caminar', 'Caminar 30 minutos', 'diario', 30, 'minutos', '08:00:00', TRUE),
(3, 'Leer', 'Leer 20 páginas', 'diario', 20, 'páginas', '21:00:00', TRUE);

INSERT INTO registros_habitos 
(habito_id, fecha_registro, cantidad_completada, notas)
VALUES
(1, CURDATE(), 5, 'Va bien, pero faltan 3 vasos'),
(2, CURDATE(), 1, 'Meditación completada'),
(3, CURDATE(), 20, 'Caminata ligera'),
(4, CURDATE(), 15, 'Lectura antes de dormir');

INSERT INTO sesiones_entrenamiento
(usuario_id, tipo_entrenamiento, inicio, duracion_minutos, calorias_quemadas, ritmo_promedio, nivel_intensidad, notas)
VALUES
(1, 'Cardio', NOW(), 45, 350, 130, 6, 'Buena sesión'),
(2, 'Fuerza', NOW(), 60, 420, 120, 7, 'Entrenamiento de piernas'),
(3, 'Yoga', NOW(), 30, 150, 90, 3, 'Sesión relajante');

INSERT INTO medicacion_programada
(usuario_id, nombre_medicacion, dosis, frecuencia, hora_programada, fecha_inicio, fecha_fin, instrucciones, activo)
VALUES
(1, 'Ibuprofeno', '400mg', 'segun_necesidad', '10:00:00', CURDATE(), NULL, 'Tomar después de comer', TRUE),
(2, 'Vitamina D', '1 cápsula', 'una_vez_dia', '08:00:00', CURDATE(), NULL, 'Tomar con agua', TRUE);


INSERT INTO planes
(usuario_id, entrenador_id, nombre_plan, tipo_plan, descripcion, objetivos, fecha_inicio, fecha_fin, estado)
VALUES
(1, 2, 'Plan de pérdida de peso', 'fitness', 'Entrenamiento y dieta', 'Perder 5kg en 2 meses', CURDATE(), NULL, 'activo'),
(3, 1, 'Plan de bienestar', 'bienestar', 'Meditación y hábitos saludables', 'Reducir estrés', CURDATE(), NULL, 'activo');


INSERT INTO notas_entrenador
(plan_id, entrenador_id, contenido, privado)
VALUES
(1, 2, 'El progreso es bueno, seguir igual.', FALSE),
(2, 1, 'Recomiendo aumentar la meditación a 15 minutos.', TRUE);


INSERT INTO alertas
(usuario_id, tipo_alerta, titulo, mensaje, prioridad, leida, programada_para)
VALUES
(1, 'habito', 'Recordatorio: Beber agua', 'Acuérdate de beber agua', 'media', FALSE, NOW()),
(2, 'entrenamiento', 'Entrenamiento programado', 'Sesión de fuerza hoy', 'alta', FALSE, NOW());

INSERT INTO tokens_autenticacion
(usuario_id, token_hash, tipo_token, expira, ip, user_agent)
VALUES
(1, 'hash_token_1', 'acceso', DATE_ADD(NOW(), INTERVAL 1 DAY), '192.168.1.10', 'Chrome'),
(2, 'hash_token_2', 'refresco', DATE_ADD(NOW(), INTERVAL 7 DAY), '192.168.1.20', 'Firefox');


