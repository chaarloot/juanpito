// ============================================================
// rutina-aleatoria.js — Vitalia JC
// ============================================================

let duracionObjetivo = 30;
let nivelFiltro      = 'Intermedio';
let equipFiltro      = 'gym';
let historialGrupos  = {}; // grupo → último día entrenado

// Base de datos de ejercicios con equipamiento
const EJERCICIOS_DB = [
    // PECHO
    { name:'Press de Banca',        grupo:'Pecho',   dif:'Intermedio', eq:['gym'],          series:4, reps:'8',  desc:'Barra en banco plano',      tiempo: 8  },
    { name:'Press Inclinado',        grupo:'Pecho',   dif:'Intermedio', eq:['gym'],          series:4, reps:'10', desc:'Banco a 30-45°',             tiempo: 7  },
    { name:'Aperturas Cable',        grupo:'Pecho',   dif:'Básico',     eq:['gym'],          series:3, reps:'15', desc:'Tensión constante',          tiempo: 5  },
    { name:'Flexiones',              grupo:'Pecho',   dif:'Básico',     eq:['gym','casa','corporal'], series:3, reps:'12', desc:'Peso corporal', tiempo: 4  },
    { name:'Fondos Paralelas',       grupo:'Pecho',   dif:'Intermedio', eq:['gym','casa'],   series:3, reps:'10', desc:'Inclínate al frente',        tiempo: 5  },
    { name:'Press con Mancuernas',   grupo:'Pecho',   dif:'Básico',     eq:['gym','casa'],   series:3, reps:'12', desc:'Mayor rango de movimiento',  tiempo: 6  },
    // ESPALDA
    { name:'Dominadas',              grupo:'Espalda', dif:'Intermedio', eq:['gym','casa'],   series:3, reps:'8',  desc:'Agarre pronado',             tiempo: 6  },
    { name:'Remo con Barra',         grupo:'Espalda', dif:'Intermedio', eq:['gym'],          series:4, reps:'8',  desc:'Torso 45°',                  tiempo: 7  },
    { name:'Jalón al Pecho',         grupo:'Espalda', dif:'Básico',     eq:['gym'],          series:4, reps:'10', desc:'Polea alta',                 tiempo: 6  },
    { name:'Remo en Polea',          grupo:'Espalda', dif:'Básico',     eq:['gym'],          series:3, reps:'12', desc:'Codos pegados',              tiempo: 5  },
    { name:'Peso Muerto',            grupo:'Espalda', dif:'Avanzado',   eq:['gym'],          series:3, reps:'5',  desc:'Cadena posterior completa',  tiempo: 9  },
    { name:'Superman',               grupo:'Espalda', dif:'Básico',     eq:['gym','casa','corporal'], series:3, reps:'15', desc:'En el suelo',    tiempo: 4  },
    // PIERNAS
    { name:'Sentadilla',             grupo:'Piernas', dif:'Avanzado',   eq:['gym'],          series:4, reps:'8',  desc:'Espalda neutra',             tiempo: 9  },
    { name:'Leg Press',              grupo:'Piernas', dif:'Intermedio', eq:['gym'],          series:4, reps:'12', desc:'Pies al ancho de hombros',   tiempo: 8  },
    { name:'Zancadas',               grupo:'Piernas', dif:'Básico',     eq:['gym','casa'],   series:3, reps:'12', desc:'Paso largo controlado',      tiempo: 6  },
    { name:'Peso Muerto Rumano',     grupo:'Piernas', dif:'Intermedio', eq:['gym'],          series:4, reps:'10', desc:'Isquios y glúteos',          tiempo: 7  },
    { name:'Sentadilla Búlgara',     grupo:'Piernas', dif:'Avanzado',   eq:['gym','casa'],   series:3, reps:'10', desc:'Pie trasero elevado',        tiempo: 8  },
    { name:'Sentadilla Corporal',    grupo:'Piernas', dif:'Básico',     eq:['gym','casa','corporal'], series:4, reps:'15', desc:'Sin peso',         tiempo: 4  },
    // BRAZOS
    { name:'Curl de Bíceps',         grupo:'Brazos',  dif:'Básico',     eq:['gym','casa'],   series:3, reps:'12', desc:'Codos fijos',                tiempo: 5  },
    { name:'Extensiones Tríceps',    grupo:'Brazos',  dif:'Básico',     eq:['gym'],          series:3, reps:'15', desc:'Polea alta',                 tiempo: 4  },
    { name:'Curl Martillo',          grupo:'Brazos',  dif:'Básico',     eq:['gym','casa'],   series:3, reps:'12', desc:'Agarre neutro',              tiempo: 5  },
    { name:'Press Francés',          grupo:'Brazos',  dif:'Intermedio', eq:['gym'],          series:3, reps:'12', desc:'Barra EZ tumbado',           tiempo: 6  },
    { name:'Fondos en Banco',        grupo:'Brazos',  dif:'Básico',     eq:['gym','casa','corporal'], series:3, reps:'15', desc:'Tríceps',          tiempo: 4  },
    // HOMBROS
    { name:'Press Militar',          grupo:'Hombros', dif:'Intermedio', eq:['gym'],          series:4, reps:'8',  desc:'De pie o sentado',           tiempo: 7  },
    { name:'Elevaciones Laterales',  grupo:'Hombros', dif:'Básico',     eq:['gym','casa'],   series:4, reps:'15', desc:'Hasta altura de hombro',     tiempo: 5  },
    { name:'Face Pull',              grupo:'Hombros', dif:'Básico',     eq:['gym'],          series:3, reps:'15', desc:'Polea alta, rotación',       tiempo: 5  },
    { name:'Elevaciones Frontales',  grupo:'Hombros', dif:'Básico',     eq:['gym','casa'],   series:3, reps:'12', desc:'Mancuernas alternas',        tiempo: 5  },
    // CORE
    { name:'Plancha',                grupo:'Core',    dif:'Básico',     eq:['gym','casa','corporal'], series:3, reps:'45s', desc:'Cuerpo recto',     tiempo: 4  },
    { name:'Crunch Abdominal',       grupo:'Core',    dif:'Básico',     eq:['gym','casa','corporal'], series:3, reps:'20',  desc:'No fuerces el cuello', tiempo: 4 },
    { name:'Plancha Lateral',        grupo:'Core',    dif:'Intermedio', eq:['gym','casa','corporal'], series:3, reps:'30s', desc:'Cada lado',        tiempo: 4  },
    { name:'Russian Twist',          grupo:'Core',    dif:'Intermedio', eq:['gym','casa'],   series:3, reps:'20', desc:'Con o sin peso',             tiempo: 4  },
    { name:'Rueda Abdominal',        grupo:'Core',    dif:'Avanzado',   eq:['gym','casa'],   series:3, reps:'10', desc:'Core completo',              tiempo: 6  },
    // GLÚTEOS
    { name:'Hip Thrust',             grupo:'Glúteos', dif:'Intermedio', eq:['gym'],          series:4, reps:'12', desc:'Espalda en banco',           tiempo: 7  },
    { name:'Abducción de Cadera',    grupo:'Glúteos', dif:'Básico',     eq:['gym'],          series:4, reps:'15', desc:'Máquina o goma',             tiempo: 5  },
    { name:'Patada Trasera',         grupo:'Glúteos', dif:'Básico',     eq:['gym','casa','corporal'], series:3, reps:'15', desc:'A cuatro patas', tiempo: 4  },
    { name:'Sentadilla Sumo',        grupo:'Glúteos', dif:'Básico',     eq:['gym','casa'],   series:4, reps:'12', desc:'Pies muy abiertos',          tiempo: 6  },
];

// Tiempo por ejercicio (min): series × (tiempo trabajo + 90s descanso)
function tiempoEjercicio(ej) {
    return ej.series * (ej.tiempo + 1.5); // aprox minutos
}

document.addEventListener('DOMContentLoaded', () => {
    initPage('rutina-aleatoria');
    cargarHistorial();
});

async function cargarHistorial() {
    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=30`);
        if (!res.ok) return;
        const sesiones = await res.json();

        // Mapear tipo_entrenamiento a grupos musculares
        const mapaGrupos = {
            'push': ['Pecho','Hombros','Brazos'],
            'pecho': ['Pecho'],
            'pull': ['Espalda','Brazos'],
            'espalda': ['Espalda'],
            'pierna': ['Piernas','Glúteos'],
            'leg': ['Piernas','Glúteos'],
            'hombro': ['Hombros'],
            'brazo': ['Brazos'],
            'core': ['Core'],
            'full': ['Pecho','Espalda','Piernas','Hombros','Brazos'],
            'body': ['Pecho','Espalda','Piernas','Hombros','Brazos'],
        };

        sesiones.forEach(s => {
            const tipo  = (s.tipo_entrenamiento || '').toLowerCase();
            const fecha = new Date(s.inicio);
            Object.entries(mapaGrupos).forEach(([key, grupos]) => {
                if (tipo.includes(key)) {
                    grupos.forEach(g => {
                        if (!historialGrupos[g] || fecha > historialGrupos[g]) {
                            historialGrupos[g] = fecha;
                        }
                    });
                }
            });
        });
    } catch (_) {}
}

// ── Filtros ───────────────────────────────────────────────────
function setDur(btn, val) {
    document.querySelectorAll('[data-dur]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    duracionObjetivo = parseInt(val);
}
function setNiv(btn, val) {
    document.querySelectorAll('[data-niv]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    nivelFiltro = val;
}
function setEq(btn, val) {
    document.querySelectorAll('[data-eq]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    equipFiltro = val;
}

// ── Generar rutina ────────────────────────────────────────────
function generarRutina() {
    const btn = document.getElementById('btnGenerar');
    btn.textContent = '⏳ Generando…';
    btn.disabled = true;

    setTimeout(() => {
        _doGenerar();
        btn.textContent = '🔀 Generar otra';
        btn.disabled = false;
    }, 600);
}

function _doGenerar() {
    // 1. Filtrar por equipamiento y nivel
    let pool = EJERCICIOS_DB.filter(e => {
        const eqOk = e.eq.includes(equipFiltro);
        const nivOk = nivelFiltro === 'Mixto' ? true : e.dif === nivelFiltro;
        return eqOk && nivOk;
    });

    if (!pool.length) {
        pool = EJERCICIOS_DB.filter(e => e.eq.includes(equipFiltro));
    }

    // 2. Puntuar grupos musculares (más días sin entrenar = más prioridad)
    const hoy = new Date();
    const grupos = [...new Set(pool.map(e => e.grupo))];
    const puntuacion = {};
    grupos.forEach(g => {
        const ultimo = historialGrupos[g];
        puntuacion[g] = ultimo
            ? Math.floor((hoy - ultimo) / 86400000)
            : 999; // nunca entrenado = máxima prioridad
    });

    // 3. Ordenar grupos por prioridad
    const gruposPriorizados = grupos.sort((a, b) => puntuacion[b] - puntuacion[a]);

    // 4. Seleccionar ejercicios hasta llenar el tiempo
    const seleccionados = [];
    let tiempoTotal = 0;
    const usados = new Set();

    // Calentamiento: 5 min fijo
    tiempoTotal += 5;

    for (const grupo of gruposPriorizados) {
        if (tiempoTotal >= duracionObjetivo - 5) break;
        const delGrupo = pool.filter(e => e.grupo === grupo);
        shuffleArray(delGrupo);

        for (const ej of delGrupo) {
            if (usados.has(ej.name)) continue;
            const t = tiempoEjercicio(ej);
            if (tiempoTotal + t > duracionObjetivo + 5) continue;
            seleccionados.push({ ...ej, grupo });
            usados.add(ej.name);
            tiempoTotal += t;
            break; // 1 ejercicio por grupo en primera pasada
        }
    }

    // Segunda pasada: rellenar tiempo restante
    if (tiempoTotal < duracionObjetivo - 10) {
        for (const grupo of gruposPriorizados) {
            if (tiempoTotal >= duracionObjetivo - 5) break;
            const delGrupo = pool.filter(e => e.grupo === grupo && !usados.has(e.name));
            shuffleArray(delGrupo);
            for (const ej of delGrupo) {
                const t = tiempoEjercicio(ej);
                if (tiempoTotal + t > duracionObjetivo + 8) continue;
                seleccionados.push({ ...ej, grupo });
                usados.add(ej.name);
                tiempoTotal += t;
                break;
            }
        }
    }

    // Vuelta a la calma: 3 min fijo
    tiempoTotal += 3;

    renderRutina(seleccionados, tiempoTotal, gruposPriorizados.slice(0, 3));
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ── Render ────────────────────────────────────────────────────
function renderRutina(ejercicios, tiempoTotal, gruposPrioritarios) {
    const result = document.getElementById('rutinaResult');

    if (!ejercicios.length) {
        result.innerHTML = `<div class="empty-state">
            <div class="empty-icon">😕</div>
            <p>No hay ejercicios disponibles con estos filtros. Prueba cambiando el nivel o equipamiento.</p>
        </div>`;
        return;
    }

    const grupStrings = gruposPrioritarios.map(g => {
        const dias = historialGrupos[g]
            ? Math.floor((new Date() - historialGrupos[g]) / 86400000)
            : null;
        return dias !== null
            ? `<span class="rng-grupo-tag">${g} <small>(${dias}d sin trabajar)</small></span>`
            : `<span class="rng-grupo-tag">${g} <small>(nunca entrenado)</small></span>`;
    }).join('');

    const difColors = { Básico: '#4da6ff', Intermedio: '#c8ff00', Avanzado: '#ff4444' };

    result.innerHTML = `
        <div class="rng-result-header">
            <div>
                <h2 style="font-size:22px;font-weight:700;margin-bottom:8px">Tu rutina de hoy</h2>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px">${grupStrings}</div>
                <p style="color:#a0a0a0;font-size:13px">
                    ${ejercicios.length} ejercicios &nbsp;·&nbsp; ~${Math.round(tiempoTotal)} min estimados
                </p>
            </div>
            <button class="btn-primary" onclick="guardarComoSesion()" style="white-space:nowrap">
                ✓ Guardar como sesión
            </button>
        </div>

        <!-- CALENTAMIENTO -->
        <div class="rng-fase">
            <div class="rng-fase-label" style="color:#ffaa00">🔥 CALENTAMIENTO — 5 min</div>
            <p style="color:#888;font-size:13px">5 min de cardio suave + movilidad articular dinámica</p>
        </div>

        <!-- EJERCICIOS -->
        <div class="rng-ejercicios-grid">
            ${ejercicios.map((e, i) => `
                <div class="rng-ejercicio-card">
                    <div class="rng-ej-num">${i + 1}</div>
                    <div class="rng-ej-body">
                        <div class="rng-ej-header">
                            <span class="rng-ej-name">${e.name}</span>
                            <span class="rng-ej-dif" style="color:${difColors[e.dif]}">${e.dif}</span>
                        </div>
                        <div class="rng-ej-grupo">${e.grupo}</div>
                        <div class="rng-ej-config">
                            <span>📊 ${e.series} series × ${e.reps}</span>
                            <span>⏱ ~${Math.round(tiempoEjercicio(e))} min</span>
                        </div>
                        <div class="rng-ej-desc">${e.desc}</div>
                    </div>
                    <div class="rng-ej-check" id="check_${i}" onclick="toggleCheck(${i})">○</div>
                </div>`).join('')}
        </div>

        <!-- VUELTA A LA CALMA -->
        <div class="rng-fase">
            <div class="rng-fase-label" style="color:#4da6ff">🧘 VUELTA A LA CALMA — 3 min</div>
            <p style="color:#888;font-size:13px">Estiramientos estáticos de los grupos trabajados</p>
        </div>`;

    // Guardar ejercicios para poder guardar como sesión
    window._rutinaActual = {
        ejercicios,
        tiempoTotal,
        grupos: gruposPrioritarios,
    };
}

let checksCompletados = new Set();

function toggleCheck(i) {
    const el = document.getElementById(`check_${i}`);
    if (!el) return;
    if (checksCompletados.has(i)) {
        checksCompletados.delete(i);
        el.textContent = '○';
        el.style.color = '#888';
        el.closest('.rng-ejercicio-card').classList.remove('completado');
    } else {
        checksCompletados.add(i);
        el.textContent = '✓';
        el.style.color = '#c8ff00';
        el.closest('.rng-ejercicio-card').classList.add('completado');
    }
}

async function guardarComoSesion() {
    if (!window._rutinaActual) return;
    const { ejercicios, tiempoTotal, grupos } = window._rutinaActual;
    const nombre = `Rutina: ${grupos.slice(0,2).join(' + ')}`;
    const calorias = Math.round(tiempoTotal * 7); // ~7 kcal/min estimado

    const workout = {
        id:       Date.now(),
        date:     new Date().toISOString(),
        activity: nombre,
        duration: `${Math.round(tiempoTotal)} min`,
        calories: calorias,
        intensity: 6,
    };

    try {
        const res = await authFetch(`${API_URL}/sesiones/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo_entrenamiento: nombre,
                duracion_minutos:   Math.round(tiempoTotal),
                calorias_quemadas:  calorias,
                nivel_intensidad:   6,
                notas: ejercicios.map(e => e.name).join(', '),
            })
        });

        if (res.ok || res.status === 201) {
            showToast(`✓ "${nombre}" guardada como sesión`);
        } else {
            // Guardar local como fallback
            const stored = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
            stored.unshift(workout);
            localStorage.setItem('vitaliaLocalWorkouts', JSON.stringify(stored.slice(0, 50)));
            showToast(`✓ Guardado localmente`);
        }
    } catch (_) {
        const stored = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
        stored.unshift(workout);
        localStorage.setItem('vitaliaLocalWorkouts', JSON.stringify(stored.slice(0, 50)));
        showToast(`✓ Guardado localmente`);
    }
}

window.generarRutina      = generarRutina;
window.setDur             = setDur;
window.setNiv             = setNiv;
window.setEq              = setEq;
window.toggleCheck        = toggleCheck;
window.guardarComoSesion  = guardarComoSesion;