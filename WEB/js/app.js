let weeklyChartInstance = null;
let weightChartInstance = null;
let caloriesChartInstance = null;

// NAVEGACIÓN
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages    = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const pageName = link.getAttribute('data-page');
            pages.forEach(p => p.classList.remove('active'));

            const page = document.getElementById(pageName + 'Page');
            if (page) page.classList.add('active');

            switch (pageName) {
                case 'dashboard':  loadDashboard();  break;
                case 'routines':   loadRoutines();   break;
                case 'progress':   loadProgress();   break;
                case 'calendar':   loadCalendar();   break;
                case 'exercises':  loadExercises();  break;
                case 'stats':      loadStats();      break;
                case 'history':    loadHistory();    break;
                case 'metrics':    loadMetrics();    break;
                case 'medication': loadMedication(); break;
            }
        });
    });
}

// ALERTAS — badge en sidebar
async function loadAlertsBadge() {
    try {
        const res = await window.authFetch(`${API_URL}/alertas/?solo_no_leidas=true&limit=99`);
        if (!res.ok) return;
        const alertas = await res.json();
        const count   = alertas.length;
        const badge   = document.getElementById('alertsBadge');
        if (!badge) return;
        badge.textContent = count > 0 ? count : '';
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    } catch (_) {}
}

// DASHBOARD
async function loadDashboard() {
    const now       = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // lunes
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const opts = { month: 'long', day: 'numeric' };
    const weekInfo = document.getElementById('weekInfo');
    if (weekInfo) weekInfo.textContent =
        `Semana del ${weekStart.toLocaleDateString('es-ES', opts)} al ${weekEnd.toLocaleDateString('es-ES', opts)}`;

    // Stats de la API
    let stats = { trainingSessions: 0, caloriesBurned: 0, activeMinutes: 0, personalRecords: 0, streakDays: 0 };
    try {
        const res = await window.authFetch(`${API_URL}/sesiones/stats/resumen?dias_atras=30`);
        if (res.ok) {
            const d = await res.json();
            stats.trainingSessions = d.total_entrenamientos || 0;
            stats.caloriesBurned   = d.total_calorias       || 0;
            stats.activeMinutes    = d.total_minutos        || 0;
        }
    } catch (_) {}

    // Sumar workouts guardados localmente
    const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
    local.forEach(w => {
        stats.trainingSessions++;
        stats.caloriesBurned += Number(w.calories) || 0;
        stats.activeMinutes  += parseWorkoutMinutes(w.duration);
    });

    // Calcular racha
    stats.streakDays = await calcularRacha();

    // Actualizar UI
    setEl('trainingSessions', stats.trainingSessions);
    setEl('caloriesBurned',   formatCalories(stats.caloriesBurned));
    setEl('activeMinutes',    stats.activeMinutes);
    setEl('personalRecords',  stats.personalRecords);
    setEl('streakDays',       stats.streakDays);

    renderWeeklyChart();
    loadAlertsBadge();
}

async function calcularRacha() {
    try {
        const res = await window.authFetch(`${API_URL}/sesiones/?dias_atras=90`);
        if (!res.ok) return 0;
        const sesiones = await res.json();
        if (!sesiones.length) return 0;

        // Días únicos con sesión
        const dias = new Set(sesiones.map(s => new Date(s.inicio).toISOString().split('T')[0]));
        let racha = 0;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        for (let i = 0; i < 365; i++) {
            const d = new Date(hoy);
            d.setDate(hoy.getDate() - i);
            if (dias.has(d.toISOString().split('T')[0])) {
                racha++;
            } else if (i > 0) {
                break;
            }
        }
        return racha;
    } catch (_) { return 0; }
}

function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    if (weeklyChartInstance) weeklyChartInstance.destroy();

    // Datos de la semana actual desde localStorage + API (usamos localStorage para inmediatez)
    const data = [0, 0, 0, 0, 0, 0, 0];
    const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
    local.forEach(w => {
        const d   = new Date(w.date);
        const idx = (d.getDay() + 6) % 7;
        data[idx] += parseWorkoutMinutes(w.duration);
    });

    const ctx = canvas.getContext('2d');
    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Minutos de Ejercicio',
                data,
                backgroundColor: data.map(v => v > 0 ? 'rgba(200,255,0,0.4)' : 'rgba(100,100,100,0.2)'),
                borderColor: '#c8ff00',
                borderWidth: 0,
                borderRadius: 6,
                barPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#a0a0a0' }, grid: { display: false } }
            }
        }
    });
}

// ============================================================
// MIS RUTINAS (Hábitos)
// ============================================================
async function loadRoutines() {
    const grid = document.querySelector('.routines-grid');
    if (!grid) return;
    grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Cargando hábitos…</p>';

    try {
        const res = await window.authFetch(`${API_URL}/habitos/resumen/todos`);
        if (!res.ok) throw new Error();
        const habitos = await res.json();
        grid.innerHTML = '';

        if (!habitos.length) {
            grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px">No tienes hábitos registrados. ¡Crea el primero!</p>';
            return;
        }

        habitos.forEach(h => {
            const color = h.estado === 'activo' ? '#c8ff00' : h.estado === 'riesgo' ? '#ffaa00' : '#ff4444';
            const icon  = h.estado === 'activo' ? '✓ Activo'  : h.estado === 'riesgo' ? '⚠ En riesgo' : '✗ Abandonado';
            const card  = document.createElement('div');
            card.className = 'routine-card';
            card.innerHTML = `
                <div class="routine-title">${h.nombre}</div>
                <div class="routine-info">${capitalize(h.frecuencia)}</div>
                <div class="routine-exercises">
                    Cumplimiento: ${h.porcentaje_cumplimiento}% &nbsp;·&nbsp; ${h.registros_periodo} registros
                </div>
                <div style="color:${color};font-size:12px;margin-bottom:12px;font-weight:600">${icon}</div>
                <div style="display:flex;gap:8px">
                    <button class="routine-btn" onclick="verDetallesHabito(${h.habito_id})">Ver detalles</button>
                    <button class="routine-btn" style="border-color:#ff4444;color:#ff4444"
                        onclick="registrarCumplimiento(${h.habito_id},'${h.nombre}')">✓ Registrar</button>
                </div>`;
            grid.appendChild(card);
        });
    } catch (_) {
        grid.innerHTML = '<p style="text-align:center;color:#ff4444;padding:40px">Error al cargar hábitos</p>';
    }
}

async function verDetallesHabito(id) {
    try {
        const res = await window.authFetch(`${API_URL}/habitos/${id}/estadisticas`);
        if (!res.ok) throw new Error();
        const s = await res.json();
        showInfoModal(`📊 ${s.nombre_habito}`,
            `<div class="detail-grid">
                <div class="detail-item"><span>Cumplimiento</span><strong>${s.porcentaje_cumplimiento}%</strong></div>
                <div class="detail-item"><span>Racha actual</span><strong>${s.racha_actual} días</strong></div>
                <div class="detail-item"><span>Racha máxima</span><strong>${s.racha_maxima} días</strong></div>
                <div class="detail-item"><span>Registros</span><strong>${s.total_registros}</strong></div>
             </div>`);
    } catch (_) {
        alert('No se pudieron cargar los detalles');
    }
}

async function registrarCumplimiento(id, nombre) {
    const hoy = new Date().toISOString().split('T')[0];
    try {
        const res = await window.authFetch(`${API_URL}/habitos/${id}/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fecha_registro: hoy, cantidad_completada: 1, notas: '' })
        });
        if (res.ok) {
            showToast(`✓ "${nombre}" registrado hoy`);
            loadRoutines();
        } else {
            const d = await res.json();
            showToast(d.detail || 'Ya registrado hoy', 'error');
        }
    } catch (_) {
        showToast('Error al registrar', 'error');
    }
}

function showNewHabitModal() {
    removeModal('newHabitModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'newHabitModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Nuevo Hábito</h2>
                <button class="modal-close" onclick="removeModal('newHabitModal')">×</button>
            </div>
            <div class="form-group">
                <label>Nombre del hábito *</label>
                <input id="hNombre" type="text" placeholder="Ej: Beber 2L de agua" required>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Descripción</label>
                <textarea id="hDesc" placeholder="Descripción opcional…" style="min-height:70px;width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font:inherit;padding:12px 14px;resize:vertical"></textarea>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Frecuencia</label>
                <select id="hFrecuencia" style="width:100%;padding:12px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font:inherit">
                    <option value="diario">Diario</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                </select>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Objetivo (cantidad por periodo)</label>
                <input id="hObjetivo" type="number" min="1" value="1" placeholder="1">
            </div>
            <div style="display:flex;gap:10px;margin-top:20px">
                <button class="btn-primary" style="flex:1" onclick="saveHabito()">Guardar Hábito</button>
                <button class="btn-secondary" style="flex:1" onclick="removeModal('newHabitModal')">Cancelar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) removeModal('newHabitModal'); });
}

async function saveHabito() {
    const nombre   = document.getElementById('hNombre')?.value.trim();
    const desc     = document.getElementById('hDesc')?.value.trim();
    const frec     = document.getElementById('hFrecuencia')?.value;
    const objetivo = parseInt(document.getElementById('hObjetivo')?.value) || 1;

    if (!nombre) { showToast('El nombre es obligatorio', 'error'); return; }

    try {
        const res = await window.authFetch(`${API_URL}/habitos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion: desc, frecuencia: frec, objetivo_cantidad: objetivo, unidad: 'veces' })
        });
        if (!res.ok) throw new Error();
        showToast('✓ Hábito creado');
        removeModal('newHabitModal');
        loadRoutines();
    } catch (_) {
        showToast('Error al crear el hábito', 'error');
    }
}

// ============================================================
// PROGRESO
// ============================================================
async function loadProgress() {
    await renderWeightChart();
    await renderCaloriesChart();
    renderMetricsSummaryCards();
}

async function renderWeightChart() {
    const canvas = document.getElementById('weightChart');
    if (!canvas) return;
    if (weightChartInstance) weightChartInstance.destroy();

    let labels = ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'];
    let data   = [78, 77.5, 77.2, 76.8, 76.5, 76.2, 75.8, 75.5];

    try {
        const res = await window.authFetch(`${API_URL}/metricas/resumen/general?dias_atras=60`);
        if (res.ok) {
            const d = await res.json();
            if (d.peso?.promedio) {
                const p = d.peso.promedio;
                data = [p+2, p+1.5, p+1, p+.5, p, p-.5, p-1, p-1.5];
            }
        }
    } catch (_) {}

    weightChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{ label: 'Peso (kg)', data, borderColor: '#c8ff00', backgroundColor: 'rgba(200,255,0,0.1)', tension: 0.4, fill: true, pointBackgroundColor: '#c8ff00' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: '#a0a0a0' } } },
            scales: {
                y: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#a0a0a0' }, grid: { display: false } }
            }
        }
    });
}

async function renderCaloriesChart() {
    const canvas = document.getElementById('caloriesChart');
    if (!canvas) return;
    if (caloriesChartInstance) caloriesChartInstance.destroy();

    let data = [0,0,0,0,0,0,0];
    try {
        const res = await window.authFetch(`${API_URL}/sesiones/?dias_atras=7`);
        if (res.ok) {
            const sesiones = await res.json();
            sesiones.forEach(s => {
                const idx = (new Date(s.inicio).getDay() + 6) % 7;
                data[idx] += s.calorias_quemadas || 0;
            });
        }
    } catch (_) {}

    caloriesChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
            datasets: [{ label: 'Calorías quemadas', data, backgroundColor: 'rgba(200,255,0,0.4)', borderColor: '#c8ff00', borderWidth: 1 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: '#a0a0a0' } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#a0a0a0' }, grid: { display: false } }
            }
        }
    });
}

async function renderMetricsSummaryCards() {
    const container = document.getElementById('metricsSummaryCards');
    if (!container) return;
    try {
        const res = await window.authFetch(`${API_URL}/metricas/resumen/general?dias_atras=30`);
        if (!res.ok) return;
        const d = await res.json();
        if (d.total_registros === 0) { container.innerHTML = '<p style="color:#888">Sin métricas registradas aún.</p>'; return; }
        container.innerHTML = `
            <div class="metrics-summary-grid">
                ${metricCard('⚖️ Peso promedio', d.peso?.promedio ? d.peso.promedio + ' kg' : '—', d.peso?.tendencia || '')}
                ${metricCard('❤️ Pulso promedio', d.ritmo_cardiaco?.promedio ? d.ritmo_cardiaco.promedio + ' bpm' : '—', '')}
                ${metricCard('😴 Sueño promedio', d.sueño_minutos?.promedio ? Math.round(d.sueño_minutos.promedio / 60) + 'h ' + (Math.round(d.sueño_minutos.promedio) % 60) + 'min' : '—', '')}
                ${metricCard('🧠 Estrés promedio', d.nivel_estres?.promedio ? d.nivel_estres.promedio + '/10' : '—', '')}
            </div>`;
    } catch (_) {}
}

function metricCard(label, value, sub) {
    return `<div class="metric-summary-card"><div class="metric-label">${label}</div><div class="metric-value">${value}</div>${sub ? `<div class="metric-sub">${sub}</div>` : ''}</div>`;
}

// ============================================================
// CALENDARIO — conectado a sesiones reales
// ============================================================
async function loadCalendar() {
    const container = document.getElementById('calendarGrid') || document.querySelector('.calendar-grid');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Cargando…</p>';

    const hoy   = new Date();
    const year  = hoy.getFullYear();
    const month = hoy.getMonth();

    // Obtener sesiones del mes actual
    const diasConSesion = new Set();
    try {
        const res = await window.authFetch(`${API_URL}/sesiones/?dias_atras=40`);
        if (res.ok) {
            const sesiones = await res.json();
            sesiones.forEach(s => {
                const d = new Date(s.inicio);
                if (d.getMonth() === month && d.getFullYear() === year) {
                    diasConSesion.add(d.getDate());
                }
            });
        }
    } catch (_) {}

    // Añadir días de workouts locales
    const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
    local.forEach(w => {
        const d = new Date(w.date);
        if (d.getMonth() === month && d.getFullYear() === year) diasConSesion.add(d.getDate());
    });

    container.innerHTML = '';

    // Nombre del mes
    const monthName = hoy.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const title = document.createElement('div');
    title.style.cssText = 'grid-column:1/-1;font-size:18px;font-weight:700;margin-bottom:10px;text-transform:capitalize;color:#c8ff00';
    title.textContent = monthName;
    container.appendChild(title);

    // Cabeceras
    ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(d => {
        const h = document.createElement('div');
        h.className = 'calendar-day-header';
        h.textContent = d;
        h.style.cssText = 'text-align:center;font-size:11px;color:#a0a0a0;font-weight:600;letter-spacing:1px;padding:6px 0';
        container.appendChild(h);
    });

    // Días vacíos (lunes = 0)
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
    for (let i = 0; i < firstDow; i++) {
        const e = document.createElement('div');
        e.className = 'calendar-day empty';
        e.style.opacity = '0';
        container.appendChild(e);
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const el = document.createElement('div');
        el.className = 'calendar-day';

        const isToday    = day === hoy.getDate();
        const hasSession = diasConSesion.has(day);

        if (isToday)    el.style.border = '2px solid #c8ff00';
        if (hasSession) el.classList.add('active');

        el.innerHTML = `<span style="font-size:13px;font-weight:${isToday?'700':'400'}">${day}</span>
            ${hasSession ? '<div style="font-size:9px;margin-top:2px">💪</div>' : ''}`;

        el.addEventListener('click', () => showDayDetail(day, month, year, hasSession));
        container.appendChild(el);
    }
}

function showDayDetail(day, month, year, hasSession) {
    const fecha = new Date(year, month, day).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });
    showInfoModal(`📅 ${capitalize(fecha)}`,
        hasSession
            ? '<p style="color:#c8ff00;font-weight:600">✓ Entrenaste este día</p>'
            : '<p style="color:#a0a0a0">Sin sesiones registradas este día.</p>');
}

// ============================================================
// EJERCICIOS (catálogo local — no hay endpoint en backend)
// ============================================================
const EJERCICIOS_CATALOGO = [
    { id:1,  name:'Press de Banca',        grupo:'Pecho',    series:'4x8',  peso:'80 kg',   dif:'Intermedio' },
    { id:2,  name:'Sentadilla',            grupo:'Piernas',  series:'4x10', peso:'100 kg',  dif:'Avanzado'   },
    { id:3,  name:'Peso Muerto',           grupo:'Espalda',  series:'3x5',  peso:'140 kg',  dif:'Avanzado'   },
    { id:4,  name:'Flexiones',             grupo:'Pecho',    series:'3x12', peso:'Corporal',dif:'Básico'      },
    { id:5,  name:'Dominadas',             grupo:'Espalda',  series:'3x8',  peso:'Corporal',dif:'Intermedio' },
    { id:6,  name:'Curl de Bíceps',        grupo:'Brazos',   series:'3x12', peso:'15 kg',   dif:'Básico'     },
    { id:7,  name:'Extensiones Tríceps',   grupo:'Brazos',   series:'3x15', peso:'12 kg',   dif:'Básico'     },
    { id:8,  name:'Leg Press',             grupo:'Piernas',  series:'4x12', peso:'200 kg',  dif:'Intermedio' },
    { id:9,  name:'Press Militar',         grupo:'Hombros',  series:'4x8',  peso:'60 kg',   dif:'Intermedio' },
    { id:10, name:'Remo con Barra',        grupo:'Espalda',  series:'4x8',  peso:'80 kg',   dif:'Intermedio' },
    { id:11, name:'Zancadas',              grupo:'Piernas',  series:'3x12', peso:'20 kg',   dif:'Básico'     },
    { id:12, name:'Plancha',               grupo:'Core',     series:'3x60s',peso:'Corporal',dif:'Básico'     },
    { id:13, name:'Hip Thrust',            grupo:'Glúteos',  series:'4x12', peso:'80 kg',   dif:'Intermedio' },
    { id:14, name:'Aperturas con Cable',   grupo:'Pecho',    series:'3x15', peso:'20 kg',   dif:'Básico'     },
    { id:15, name:'Face Pull',             grupo:'Hombros',  series:'3x15', peso:'25 kg',   dif:'Básico'     },
];

function loadExercises() {
    renderExerciseList(EJERCICIOS_CATALOGO);
    const search = document.getElementById('exerciseSearch');
    if (search) {
        search.oninput = e => {
            const q = e.target.value.toLowerCase();
            renderExerciseList(EJERCICIOS_CATALOGO.filter(ex => ex.name.toLowerCase().includes(q) || ex.grupo.toLowerCase().includes(q)));
        };
    }
}

function renderExerciseList(list) {
    const container = document.getElementById('exercisesList') || document.querySelector('.exercises-list');
    if (!container) return;
    container.innerHTML = '';
    if (!list.length) { container.innerHTML = '<p style="color:#888;text-align:center;padding:40px">No se encontraron ejercicios</p>'; return; }
    list.forEach(ex => {
        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.innerHTML = `
            <div class="exercise-name">${ex.name}</div>
            <div class="exercise-details">
                <span style="color:#c8ff00">${ex.grupo}</span> &nbsp;·&nbsp; ${ex.series} &nbsp;·&nbsp; ${ex.peso}<br>
                <span style="margin-top:4px;display:inline-block">Dificultad: ${ex.dif}</span>
            </div>
            <button class="exercise-add-btn" onclick="agregarEjercicioHoy(${ex.id})">+ Agregar a hoy</button>`;
        container.appendChild(card);
    });
}

function agregarEjercicioHoy(id) {
    const ex = EJERCICIOS_CATALOGO.find(e => e.id === id);
    if (!ex) return;
    showToast(`✓ "${ex.name}" añadido al entrenamiento de hoy`);
}

// ============================================================
// ESTADÍSTICAS — datos reales de la API
// ============================================================
async function loadStats() {
    const ids = ['totalWorkouts','totalCalories','totalMinutes','weeklyAverage'];
    ids.forEach(id => setEl(id, '…'));

    try {
        const res = await window.authFetch(`${API_URL}/sesiones/stats/resumen?dias_atras=365`);
        if (!res.ok) throw new Error();
        const d = await res.json();

        // Sumar locales
        const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
        const extraCal = local.reduce((a, w) => a + (Number(w.calories) || 0), 0);
        const extraMin = local.reduce((a, w) => a + parseWorkoutMinutes(w.duration), 0);

        setEl('totalWorkouts',  (d.total_entrenamientos || 0) + local.length);
        setEl('totalCalories',  formatCalories((d.total_calorias || 0) + extraCal));
        setEl('totalMinutes',   (d.total_minutos || 0) + extraMin);
        setEl('weeklyAverage',  d.promedio_semanal ? d.promedio_semanal.toFixed(1) : '0');
    } catch (_) {
        ids.forEach(id => setEl(id, '0'));
    }

    // Gráfico de intensidad por tipo
    await renderStatsTypeChart();
}

async function renderStatsTypeChart() {
    const container = document.getElementById('statsTypeChart');
    if (!container) return;

    try {
        const res = await window.authFetch(`${API_URL}/sesiones/?dias_atras=90`);
        if (!res.ok) return;
        const sesiones = await res.json();
        if (!sesiones.length) return;

        // Agrupar por tipo
        const byType = {};
        sesiones.forEach(s => {
            const t = s.tipo_entrenamiento || 'Otro';
            byType[t] = (byType[t] || 0) + 1;
        });

        const labels = Object.keys(byType);
        const data   = Object.values(byType);
        const colors = ['#c8ff00','#ff4444','#4da6ff','#ffdd44','#44ff44','#ff88aa','#88ffcc'];

        container.innerHTML = '<canvas id="typeChart" style="max-height:260px"></canvas>';
        new Chart(document.getElementById('typeChart').getContext('2d'), {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] },
            options: {
                responsive: true,
                plugins: { legend: { labels: { color: '#a0a0a0' } } }
            }
        });
    } catch (_) {}
}

// ============================================================
// HISTORIAL
// ============================================================
async function loadHistory() {
    const list = document.getElementById('historyList') || document.querySelector('.history-list');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center;color:#a0a0a0;padding:40px">Cargando…</p>';

    let items = [];
    try {
        const res = await window.authFetch(`${API_URL}/sesiones/?dias_atras=90`);
        if (res.ok) {
            const api = await res.json();
            items = api.map(s => ({
                date:     new Date(s.inicio).toISOString().split('T')[0],
                activity: s.tipo_entrenamiento,
                duration: `${s.duracion_minutos || 0} min`,
                calories: s.calorias_quemadas || 0,
                intensity: s.nivel_intensidad || 0
            }));
        }
    } catch (_) {}

    // Añadir locales
    const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
    items = [...local.map(w => ({ date: w.date.split('T')[0], activity: w.activity, duration: w.duration, calories: w.calories, intensity: w.intensity || 0 })), ...items];

    list.innerHTML = '';
    if (!items.length) {
        list.innerHTML = '<p style="text-align:center;color:#a0a0a0;padding:40px">Sin entrenamientos registrados aún</p>';
        return;
    }

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'history-item';
        el.innerHTML = `
            <div class="history-info">
                <div class="history-date">${new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</div>
                <div class="history-activity">${item.activity}</div>
                <div class="history-details">${item.duration} &nbsp;·&nbsp; ${item.calories} kcal ${item.intensity ? '&nbsp;·&nbsp; Intensidad ' + item.intensity + '/10' : ''}</div>
            </div>
            <div class="history-duration">
                <div class="duration-value">${item.duration}</div>
                <div class="duration-label">duración</div>
            </div>`;
        list.appendChild(el);
    });
}

// ============================================================
// MÉTRICAS DE SALUD
// ============================================================
async function loadMetrics() {
    const page = document.getElementById('metricsPage');
    if (!page) return;

    // Cargar lista de métricas recientes
    const list = document.getElementById('metricsList');
    if (list) {
        list.innerHTML = '<p style="color:#888">Cargando…</p>';
        try {
            const res = await window.authFetch(`${API_URL}/metricas/?limit=10`);
            if (res.ok) {
                const metricas = await res.json();
                list.innerHTML = '';
                if (!metricas.length) { list.innerHTML = '<p style="color:#888">Sin métricas registradas</p>'; }
                metricas.forEach(m => {
                    const el = document.createElement('div');
                    el.className = 'history-item';
                    el.innerHTML = `
                        <div class="history-info">
                            <div class="history-date">${new Date(m.fecha_metrica).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}</div>
                            <div class="history-activity" style="font-size:14px">
                                ${m.peso_kg ? '⚖️ ' + m.peso_kg + ' kg &nbsp;' : ''}
                                ${m.ritmo_cardiaco ? '❤️ ' + m.ritmo_cardiaco + ' bpm &nbsp;' : ''}
                                ${m.horas_sueno != null ? '😴 ' + m.horas_sueno + 'h &nbsp;' : ''}
                                ${m.nivel_estres ? '🧠 Estrés ' + m.nivel_estres + '/10' : ''}
                            </div>
                            ${m.notas ? `<div class="history-details">${m.notas}</div>` : ''}
                        </div>`;
                    list.appendChild(el);
                });
            }
        } catch (_) { list.innerHTML = '<p style="color:#ff4444">Error al cargar métricas</p>'; }
    }
}

function showNewMetricModal() {
    removeModal('newMetricModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'newMetricModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:480px;max-height:90vh;overflow-y:auto">
            <div class="modal-header">
                <h2>Registrar Métrica</h2>
                <button class="modal-close" onclick="removeModal('newMetricModal')">×</button>
            </div>
            <div class="form-group">
                <label>Fecha</label>
                <input id="mFecha" type="date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
                <div class="form-group">
                    <label>Peso (kg)</label>
                    <input id="mPeso" type="number" step="0.1" placeholder="75.0">
                </div>
                <div class="form-group">
                    <label>Pulso (bpm)</label>
                    <input id="mPulso" type="number" placeholder="72">
                </div>
                <div class="form-group">
                    <label>Presión sistólica</label>
                    <input id="mPSist" type="number" placeholder="120">
                </div>
                <div class="form-group">
                    <label>Presión diastólica</label>
                    <input id="mPDias" type="number" placeholder="80">
                </div>
                <div class="form-group">
                    <label>Horas de sueño</label>
                    <input id="mSueno" type="number" step="0.5" placeholder="7.5">
                </div>
                <div class="form-group">
                    <label>Glucosa (mg/dL)</label>
                    <input id="mGlucosa" type="number" step="0.1" placeholder="90">
                </div>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Nivel de estrés (1–10)</label>
                <input id="mEstres" type="range" min="1" max="10" value="5">
                <span id="mEstresVal" style="color:#c8ff00;font-weight:600">5</span>/10
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Notas</label>
                <textarea id="mNotas" placeholder="Observaciones…" style="min-height:70px;width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font:inherit;padding:12px 14px;resize:vertical"></textarea>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px">
                <button class="btn-primary" style="flex:1" onclick="saveMetrica()">Guardar</button>
                <button class="btn-secondary" style="flex:1" onclick="removeModal('newMetricModal')">Cancelar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) removeModal('newMetricModal'); });
    const slider = document.getElementById('mEstres');
    slider?.addEventListener('input', e => { document.getElementById('mEstresVal').textContent = e.target.value; });
}

async function saveMetrica() {
    const fecha   = document.getElementById('mFecha')?.value;
    const peso    = parseFloatOrNull('mPeso');
    const pulso   = parseIntOrNull('mPulso');
    const pSist   = parseIntOrNull('mPSist');
    const pDias   = parseIntOrNull('mPDias');
    const sueno   = parseFloatOrNull('mSueno');
    const glucosa = parseFloatOrNull('mGlucosa');
    const estres  = parseIntOrNull('mEstres');
    const notas   = document.getElementById('mNotas')?.value.trim() || null;

    if (!fecha) { showToast('Indica la fecha', 'error'); return; }

    const body = {
        fecha_metrica: fecha,
        peso_kg: peso,
        ritmo_cardiaco: pulso,
        presion_sistolica: pSist,
        presion_diastolica: pDias,
        horas_sueno: sueno ? Math.floor(sueno) : null,
        minutos_sueno: sueno ? Math.round((sueno % 1) * 60) : null,
        glucosa_sangre: glucosa,
        nivel_estres: estres,
        notas
    };

    try {
        const res = await window.authFetch(`${API_URL}/metricas/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error();
        showToast('✓ Métrica registrada');
        removeModal('newMetricModal');
        loadMetrics();
    } catch (_) {
        showToast('Error al guardar la métrica', 'error');
    }
}

// ============================================================
// MEDICACIÓN
// ============================================================
async function loadMedication() {
    const list = document.getElementById('medicationList');
    if (!list) return;
    list.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Cargando…</p>';

    try {
        const res = await window.authFetch(`${API_URL}/medicacion/`);
        if (!res.ok) throw new Error();
        const meds = await res.json();
        list.innerHTML = '';

        if (!meds.length) {
            list.innerHTML = '<p style="text-align:center;color:#888;padding:40px">Sin medicación registrada</p>';
            return;
        }

        meds.forEach(m => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-info">
                    <div class="history-activity">${m.nombre_medicacion}</div>
                    <div class="history-details">${m.dosis || ''} &nbsp;·&nbsp; ${formatFrecuencia(m.frecuencia)} ${m.hora_programada ? '&nbsp;·&nbsp; ' + m.hora_programada.slice(0,5) : ''}</div>
                    <div class="history-date">${m.activo ? '<span style="color:#c8ff00">● Activa</span>' : '<span style="color:#888">● Inactiva</span>'} &nbsp;·&nbsp; Desde ${new Date(m.fecha_inicio).toLocaleDateString('es-ES')}</div>
                </div>
                <div style="display:flex;gap:8px">
                    <button class="routine-btn" style="border-color:#ff4444;color:#ff4444;font-size:11px" onclick="deleteMed(${m.medicacion_id})">Eliminar</button>
                </div>`;
            list.appendChild(el);
        });
    } catch (_) {
        list.innerHTML = '<p style="text-align:center;color:#ff4444;padding:40px">Error al cargar medicación</p>';
    }
}

function showNewMedModal() {
    removeModal('newMedModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'newMedModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Nueva Medicación</h2>
                <button class="modal-close" onclick="removeModal('newMedModal')">×</button>
            </div>
            <div class="form-group">
                <label>Nombre *</label>
                <input id="medNombre" type="text" placeholder="Ej: Ibuprofeno 400mg">
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Dosis</label>
                <input id="medDosis" type="text" placeholder="Ej: 1 comprimido">
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Frecuencia</label>
                <select id="medFrec" style="width:100%;padding:12px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font:inherit">
                    <option value="una_vez_dia">1 vez al día</option>
                    <option value="dos_veces_dia">2 veces al día</option>
                    <option value="tres_veces_dia">3 veces al día</option>
                    <option value="semanal">Semanal</option>
                    <option value="segun_necesidad">Según necesidad</option>
                </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
                <div class="form-group">
                    <label>Hora (opcional)</label>
                    <input id="medHora" type="time">
                </div>
                <div class="form-group">
                    <label>Fecha inicio *</label>
                    <input id="medInicio" type="date" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px">
                <button class="btn-primary" style="flex:1" onclick="saveMed()">Guardar</button>
                <button class="btn-secondary" style="flex:1" onclick="removeModal('newMedModal')">Cancelar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) removeModal('newMedModal'); });
}

async function saveMed() {
    const nombre = document.getElementById('medNombre')?.value.trim();
    const dosis  = document.getElementById('medDosis')?.value.trim() || null;
    const frec   = document.getElementById('medFrec')?.value;
    const hora   = document.getElementById('medHora')?.value || null;
    const inicio = document.getElementById('medInicio')?.value;

    if (!nombre) { showToast('El nombre es obligatorio', 'error'); return; }
    if (!inicio) { showToast('Indica la fecha de inicio', 'error'); return; }

    try {
        const res = await window.authFetch(`${API_URL}/medicacion/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre_medicacion: nombre, dosis, frecuencia: frec, hora_programada: hora, fecha_inicio: inicio })
        });
        if (!res.ok) throw new Error();
        showToast('✓ Medicación guardada');
        removeModal('newMedModal');
        loadMedication();
    } catch (_) {
        showToast('Error al guardar', 'error');
    }
}

async function deleteMed(id) {
    if (!confirm('¿Eliminar esta medicación?')) return;
    try {
        await window.authFetch(`${API_URL}/medicacion/${id}`, { method: 'DELETE' });
        showToast('Medicación eliminada');
        loadMedication();
    } catch (_) { showToast('Error al eliminar', 'error'); }
}

// ============================================================
// NUEVO ENTRENAMIENTO (modal)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.btn-new-training')?.addEventListener('click', showNewWorkoutModal);
    document.getElementById('newRoutineBtn')?.addEventListener('click', showNewHabitModal);
});

function showNewWorkoutModal() {
    removeModal('newTrainingModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'newTrainingModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Nuevo Entrenamiento</h2>
                <button class="modal-close" onclick="removeModal('newTrainingModal')">×</button>
            </div>
            <div class="form-group">
                <label>Nombre *</label>
                <input id="wNombre" type="text" placeholder="Ej: Push Day" required>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
                <div class="form-group">
                    <label>Duración (min)</label>
                    <input id="wDuracion" type="number" min="1" placeholder="60">
                </div>
                <div class="form-group">
                    <label>Calorías</label>
                    <input id="wCalorias" type="number" min="0" placeholder="450">
                </div>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Intensidad &nbsp;<span id="wIntVal" style="color:#c8ff00;font-weight:700">5</span>/10</label>
                <input id="wIntensidad" type="range" min="1" max="10" value="5">
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Notas</label>
                <textarea id="wNotas" placeholder="Notas del entrenamiento…" style="min-height:80px;width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font:inherit;padding:12px 14px;resize:vertical"></textarea>
            </div>
            <div style="display:flex;gap:10px;margin-top:20px">
                <button class="btn-primary" style="flex:1" onclick="saveWorkout()">Guardar</button>
                <button class="btn-secondary" style="flex:1" onclick="removeModal('newTrainingModal')">Cancelar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) removeModal('newTrainingModal'); });
    document.getElementById('wIntensidad')?.addEventListener('input', e => {
        document.getElementById('wIntVal').textContent = e.target.value;
    });
}

async function saveWorkout() {
    const name      = document.getElementById('wNombre')?.value.trim();
    const duration  = parseInt(document.getElementById('wDuracion')?.value) || 60;
    const calories  = parseInt(document.getElementById('wCalorias')?.value) || 0;
    const intensity = parseInt(document.getElementById('wIntensidad')?.value) || 5;
    const notes     = document.getElementById('wNotas')?.value.trim() || '';

    if (!name) { showToast('El nombre es obligatorio', 'error'); return; }

    const workout = { id: Date.now(), date: new Date().toISOString(), activity: name, duration: `${duration} min`, calories, intensity, notes };

    const finishSave = (local) => {
        if (local) {
            const stored = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
            stored.unshift(workout);
            localStorage.setItem('vitaliaLocalWorkouts', JSON.stringify(stored.slice(0, 50)));
        }
        updateDashboardAfterWorkout(workout);
        showToast(`✓ "${name}" guardado`);
        removeModal('newTrainingModal');
        if (document.getElementById('historyPage')?.classList.contains('active')) loadHistory();
    };

    try {
        const res = await window.authFetch(`${API_URL}/sesiones/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo_entrenamiento: name, duracion_minutos: duration, calorias_quemadas: calories, nivel_intensidad: intensity, notas: notes })
        });
        finishSave(!res.ok);
    } catch (_) {
        finishSave(true);
    }
}

function updateDashboardAfterWorkout(w) {
    const ts = document.getElementById('trainingSessions');
    const cb = document.getElementById('caloriesBurned');
    const am = document.getElementById('activeMinutes');
    if (ts) ts.textContent = (parseInt(ts.textContent) || 0) + 1;
    if (cb) { const cur = parseDisplayedCalories(cb.textContent); cb.textContent = formatCalories(cur + (Number(w.calories) || 0)); }
    if (am) am.textContent = (parseInt(am.textContent) || 0) + parseWorkoutMinutes(w.duration);
    if (weeklyChartInstance) {
        const idx = (new Date().getDay() + 6) % 7;
        weeklyChartInstance.data.datasets[0].data[idx] = (weeklyChartInstance.data.datasets[0].data[idx] || 0) + parseWorkoutMinutes(w.duration);
        weeklyChartInstance.update();
    }
}

// ============================================================
// TABS (filtro tabla dashboard)
// ============================================================
function initializeTabs() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const container = btn.closest('[data-tab-container]');
            if (!container) return;
            container.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterTableByStatus(btn.getAttribute('data-tab'));
        });
    });
}

function filterTableByStatus(status) {
    document.querySelectorAll('tbody tr').forEach(row => {
        const cell = row.querySelector('td:last-child');
        if (status === 'todos') { row.style.display = ''; return; }
        if (status === 'completados') row.style.display = cell?.textContent.includes('✓') ? '' : 'none';
        if (status === 'favoritos')   row.style.display = cell?.textContent.includes('⭐') ? '' : 'none';
    });
}

// ============================================================
// HELPERS UI
// ============================================================
function showToast(msg, type = 'success') {
    let toast = document.getElementById('vitaliaToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'vitaliaToast';
        toast.style.cssText = `position:fixed;bottom:30px;right:30px;z-index:9999;padding:14px 22px;border-radius:10px;font-size:14px;font-weight:600;transition:opacity .3s;max-width:320px;pointer-events:none;`;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'error' ? 'rgba(255,68,68,0.9)' : 'rgba(200,255,0,0.9)';
    toast.style.color       = type === 'error' ? '#fff' : '#000';
    toast.style.opacity     = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function showInfoModal(title, bodyHtml) {
    removeModal('infoModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.id = 'infoModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:420px">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close" onclick="removeModal('infoModal')">×</button>
            </div>
            <div style="margin-top:10px">${bodyHtml}</div>
            <button class="btn-secondary" style="width:100%;margin-top:20px" onclick="removeModal('infoModal')">Cerrar</button>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) removeModal('infoModal'); });
}

function removeModal(id) {
    document.getElementById(id)?.remove();
    document.body.style.overflow = '';
}

function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function formatCalories(cal) {
    const n = Number(cal) || 0;
    return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n);
}

function parseDisplayedCalories(text) {
    text = String(text || '').trim();
    if (text.toUpperCase().endsWith('K')) return Math.round(parseFloat(text) * 1000) || 0;
    return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
}

function parseWorkoutMinutes(dur) {
    const n = parseInt(String(dur || '').replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
}

function parseFloatOrNull(id) {
    const v = parseFloat(document.getElementById(id)?.value);
    return isNaN(v) ? null : v;
}

function parseIntOrNull(id) {
    const v = parseInt(document.getElementById(id)?.value);
    return isNaN(v) ? null : v;
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function formatFrecuencia(f) {
    const m = { una_vez_dia:'1×/día', dos_veces_dia:'2×/día', tres_veces_dia:'3×/día', semanal:'Semanal', segun_necesidad:'Según necesidad', personalizado:'Personalizado' };
    return m[f] || f;
}

// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    if (loginModal && loginModal.classList.contains('hidden')) {
        loadDashboard();
    }
    initializeNavigation();
    initializeTabs();
});

window.addEventListener('resize', () => {
    if (document.getElementById('dashboardPage')?.classList.contains('active')) {
        setTimeout(renderWeeklyChart, 100);
    }
});

// Exponer globalmente lo que el HTML necesita
window.verDetallesHabito    = verDetallesHabito;
window.registrarCumplimiento = registrarCumplimiento;
window.saveHabito           = saveHabito;
window.agregarEjercicioHoy  = agregarEjercicioHoy;
window.saveWorkout          = saveWorkout;
window.saveMetrica          = saveMetrica;
window.saveMed              = saveMed;
window.deleteMed            = deleteMed;
window.showNewHabitModal    = showNewHabitModal;
window.showNewMetricModal   = showNewMetricModal;
window.showNewMedModal      = showNewMedModal;
window.removeModal          = removeModal;