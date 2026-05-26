DROP DATABASE IF EXISTS VitaliaCJ;
CREATE DATABASE IF NOT EXISTS VitaliaCJ
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_spanish_ci;
USE VitaliaCJ;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS tokens_autenticacion;
DROP TABLE IF EXISTS alertas;
DROP TABLE IF EXISTS planes;
DROP TABLE IF EXISTS medicacion_programada;
DROP TABLE IF EXISTS sesiones_entrenamiento;
DROP TABLE IF EXISTS registros_habitos;
DROP TABLE IF EXISTS habitos;
DROP TABLE IF EXISTS metricas_salud;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE usuarios (
    usuario_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NULL,
    genero ENUM('hombre', 'mujer', 'otro', 'prefiero_no_decirlo') NULL,
    altura_cm DECIMAL(5,2) NULL,
    peso_kg DECIMAL(5,2) NULL,
    zona_horaria VARCHAR(50) NOT NULL DEFAULT 'UTC',
    rol VARCHAR(20) NOT NULL DEFAULT 'usuario',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso DATETIME NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_usuarios_email (email),
    INDEX idx_usuarios_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE metricas_salud (
    metrica_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha_metrica DATE NOT NULL,
    peso_kg DECIMAL(5,2) NULL,
    presion_sistolica SMALLINT NULL,
    presion_diastolica SMALLINT NULL,
    ritmo_cardiaco SMALLINT NULL,
    glucosa_sangre DECIMAL(5,2) NULL,
    horas_sueno SMALLINT NULL,
    minutos_sueno SMALLINT NULL,
    nivel_estres SMALLINT NULL,
    notas TEXT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_metricas_nivel_estres CHECK (nivel_estres IS NULL OR nivel_estres BETWEEN 1 AND 10),
    CONSTRAINT fk_metricas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,
    INDEX idx_metricas_usuario_fecha (usuario_id, fecha_metrica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE habitos (
    habito_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    frecuencia ENUM('diario', 'semanal', 'mensual', 'personalizado') NOT NULL DEFAULT 'diario',
    objetivo_cantidad INT NOT NULL DEFAULT 1,
    unidad VARCHAR(50) NOT NULL DEFAULT 'veces',
    hora_recordatorio TIME NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_habitos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,
    INDEX idx_habitos_usuario (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE registros_habitos (
    registro_id INT AUTO_INCREMENT PRIMARY KEY,
    habito_id INT NOT NULL,
    fecha_registro DATE NOT NULL,
    cantidad_completada INT NOT NULL DEFAULT 0,
    notas TEXT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_registro_habito_fecha (habito_id, fecha_registro),
    CONSTRAINT fk_registros_habitos
        FOREIGN KEY (habito_id) REFERENCES habitos(habito_id)
        ON DELETE CASCADE,
    INDEX idx_registros_habito (habito_id),
    INDEX idx_registros_fecha (fecha_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE sesiones_entrenamiento (
    sesion_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_entrenamiento VARCHAR(100) NOT NULL,
    inicio DATETIME NOT NULL,
    duracion_minutos INT NULL,
    calorias_quemadas INT NULL,
    ritmo_promedio SMALLINT NULL,
    nivel_intensidad SMALLINT NULL,
    notas TEXT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sesiones_nivel_intensidad CHECK (nivel_intensidad IS NULL OR nivel_intensidad BETWEEN 1 AND 10),
    CONSTRAINT fk_sesiones_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,
    INDEX idx_sesiones_usuario_inicio (usuario_id, inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE medicacion_programada (
    medicacion_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre_medicacion VARCHAR(200) NOT NULL,
    dosis VARCHAR(100) NULL,
    frecuencia ENUM('una_vez_dia', 'dos_veces_dia', 'tres_veces_dia', 'semanal', 'segun_necesidad', 'personalizado') NOT NULL DEFAULT 'una_vez_dia',
    hora_programada TIME NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    instrucciones TEXT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicacion_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,
    INDEX idx_medicacion_usuario (usuario_id),
    INDEX idx_medicacion_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE planes (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre_plan VARCHAR(200) NOT NULL,
    tipo_plan ENUM('fitness', 'nutricion', 'bienestar', 'rehabilitacion', 'personalizado') NOT NULL,
    descripcion TEXT NULL,
    objetivos TEXT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    estado ENUM('borrador', 'activo', 'pausado', 'completado', 'cancelado') NOT NULL DEFAULT 'borrador',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_planes_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_planes_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,
    INDEX idx_planes_usuario (usuario_id),
    INDEX idx_planes_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE alertas (
    alerta_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_alerta ENUM('medicacion', 'habito', 'entrenamiento', 'chequeo_salud', 'sistema') NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NULL,
    prioridad ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    programada_para DATETIME NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alertas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,
    INDEX idx_alertas_usuario (usuario_id),
    INDEX idx_alertas_leida (leida),
    INDEX idx_alertas_programada (programada_para)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;

CREATE TABLE tokens_autenticacion (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    tipo_token ENUM('acceso', 'refresco', 'restablecer_password', 'verificacion_email') NOT NULL,
    expira DATETIME NOT NULL,
    ip VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revocado_en DATETIME NULL,
    CONSTRAINT fk_tokens_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,
    UNIQUE KEY uq_tokens_hash (token_hash),
    INDEX idx_tokens_usuario (usuario_id),
    INDEX idx_tokens_tipo (tipo_token),
    INDEX idx_tokens_expira (expira)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;