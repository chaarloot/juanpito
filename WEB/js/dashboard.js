// ============================================================
// dashboard.js — Vitalia JC
// ============================================================

let weeklyChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initPage('dashboard');
    loadDashboard();
    document.getElementById('btnNewWorkout')?.addEventListener('click', showNewWorkoutModal);
});

async function loadDashboard() {
    setWeekInfo();
    await loadStats();
    await renderWeeklyChart();
    await loadRecentSessions();
    renderXP();
}

// ── Semana ────────────────────────────────────────────────────
function setWeekInfo() {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const opts = { month: 'long', day: 'numeric' };
    setEl('weekInfo', `Semana del ${weekStart.toLocaleDateString('es-ES', opts)} al ${weekEnd.toLocaleDateString('es-ES', opts)}`);
}

// ── Stats ─────────────────────────────────────────────────────
async function loadStats() {
    try {
        const res = await authFetch(`${API_URL}/sesiones/stats/resumen?dias_atras=30`);
        if (res.ok) {
            const d = await res.json();
            const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
            const extraCal = local.reduce((a, w) => a + (Number(w.calories) || 0), 0);
            const extraMin = local.reduce((a, w) => a + parseWorkoutMinutes(w.duration), 0);
            setEl('trainingSessions', (d.total_entrenamientos || 0) + local.length);
            setEl('caloriesBurned',   formatCalories((d.total_calorias || 0) + extraCal));
            setEl('activeMinutes',    (d.total_minutos || 0) + extraMin);
        }
    } catch (_) {}

    const streak = await calcularRacha();
    setEl('streakDays', streak);
    setEl('streakNum',  streak);

    // Fuego animado si racha > 3
    const streakCircle = document.getElementById('streakCircle');
    const streakMsg    = document.getElementById('streakMsg');
    if (streakCircle && streak > 3) {
        streakCircle.classList.add('on-fire');
    }
    if (streakMsg) {
        if (streak === 0) {
            streakMsg.innerHTML = '<span style="color:#888">¡Empieza hoy tu racha!</span>';
        } else if (streak >= 7) {
            streakMsg.innerHTML = '<span class="percentage">🔥 ¡Racha épica! Sigue así</span>';
        } else if (streak >= 3) {
            streakMsg.innerHTML = '<span class="percentage">🔥 ¡Estás en racha!</span>';
        } else {
            streakMsg.innerHTML = '<span class="percentage">💪 ¡Sigue entrenando!</span>';
        }
    }
}

async function calcularRacha() {
    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=90`);
        if (!res.ok) return 0;
        const sesiones = await res.json();
        const dias = new Set(sesiones.map(s => new Date(s.inicio).toISOString().split('T')[0]));
        const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
        local.forEach(w => dias.add(w.date.split('T')[0]));
        let racha = 0;
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        for (let i = 0; i < 365; i++) {
            const d = new Date(hoy); d.setDate(hoy.getDate() - i);
            if (dias.has(d.toISOString().split('T')[0])) racha++;
            else if (i > 0) break;
        }
        return racha;
    } catch (_) { return 0; }
}

// ── XP / NIVELES ──────────────────────────────────────────────
const XP_LEVELS = [
    { nivel: 1,  titulo: 'Principiante',  xpNeeded: 100  },
    { nivel: 2,  titulo: 'Aprendiz',      xpNeeded: 250  },
    { nivel: 3,  titulo: 'Atleta',        xpNeeded: 500  },
    { nivel: 4,  titulo: 'Guerrero',      xpNeeded: 1000 },
    { nivel: 5,  titulo: 'Campeón',       xpNeeded: 2000 },
    { nivel: 6,  titulo: 'Élite',         xpNeeded: 3500 },
    { nivel: 7,  titulo: 'Leyenda',       xpNeeded: 5000 },
    { nivel: 8,  titulo: 'Inmortal',      xpNeeded: 7500 },
    { nivel: 9,  titulo: 'Titán',         xpNeeded: 10000},
    { nivel: 10, titulo: 'DIOS del GYM',  xpNeeded: 99999},
];

async function renderXP() {
    const container = document.getElementById('xpContainer');
    if (!container) return;

    // Calcular XP total basado en sesiones reales
    let totalXP = 0;
    try {
        const res = await authFetch(`${API_URL}/sesiones/stats/resumen?dias_atras=365`);
        if (res.ok) {
            const d = await res.json();
            // 10 XP por sesión + 1 XP por cada 10 calorías + 2 XP por minuto/10
            totalXP += (d.total_entrenamientos || 0) * 10;
            totalXP += Math.floor((d.total_calorias || 0) / 10);
            totalXP += Math.floor((d.total_minutos || 0) / 10) * 2;
        }
    } catch (_) {}

    // Sumar locales
    const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
    totalXP += local.length * 10;
    totalXP += local.reduce((a, w) => a + Math.floor((w.calories || 0) / 10), 0);

    // Calcular nivel actual
    let nivelActual = XP_LEVELS[0];
    let nivelSiguiente = XP_LEVELS[1];
    let xpAcumulado = 0;

    for (let i = 0; i < XP_LEVELS.length; i++) {
        if (totalXP >= XP_LEVELS[i].xpNeeded) {
            nivelActual = XP_LEVELS[i];
            nivelSiguiente = XP_LEVELS[i + 1] || XP_LEVELS[i];
            xpAcumulado = XP_LEVELS[i].xpNeeded;
        } else {
            break;
        }
    }

    const xpEnNivel    = totalXP - xpAcumulado;
    const xpParaSiguiente = nivelSiguiente.xpNeeded - xpAcumulado;
    const porcentaje   = Math.min((xpEnNivel / xpParaSiguiente) * 100, 100);

    // Renderizar
    container.innerHTML = `
        <div class="xp-bar-container">
            <div class="xp-left">
                <span class="xp-level">Nv.${nivelActual.nivel}</span>
                <span class="xp-title">${nivelActual.titulo}</span>
            </div>
            <div class="xp-bar-wrap" title="${totalXP} XP total">
                <div class="xp-bar-fill" style="width:${porcentaje}%"></div>
            </div>
            <div class="xp-right">
                <span>${xpEnNivel} / ${xpParaSiguiente} XP</span>
                ${nivelActual.nivel < 10 ? `<span style="font-size:11px;color:#888">→ ${nivelSiguiente.titulo}</span>` : ''}
            </div>
        </div>`;
}

// ── Gráfico semanal ───────────────────────────────────────────
async function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    if (weeklyChartInstance) weeklyChartInstance.destroy();

    const data = [0, 0, 0, 0, 0, 0, 0];
    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=7`);
        if (res.ok) {
            const sesiones = await res.json();
            sesiones.forEach(s => {
                const idx = (new Date(s.inicio).getDay() + 6) % 7;
                data[idx] += s.duracion_minutos || 0;
            });
        }
    } catch (_) {}
    const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
    local.forEach(w => {
        const idx = (new Date(w.date).getDay() + 6) % 7;
        data[idx] += parseWorkoutMinutes(w.duration);
    });

    weeklyChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Minutos',
                data,
                backgroundColor: data.map(v => v > 0 ? 'rgba(200,255,0,0.45)' : 'rgba(100,100,100,0.18)'),
                borderColor: '#c8ff00',
                borderWidth: 0,
                borderRadius: 6,
                barPercentage: 0.65,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#a0a0a0' }, grid: { display: false } }
            }
        }
    });
}

// ── Sesiones recientes ────────────────────────────────────────
async function loadRecentSessions() {
    const container = document.getElementById('recentSessions');
    if (!container) return;
    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=14`);
        const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
        let items = [];
        if (res.ok) {
            const api = await res.json();
            items = api.slice(0, 5).map(s => ({
                date:     new Date(s.inicio).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
                name:     s.tipo_entrenamiento,
                duration: `${s.duracion_minutos || 0} min`,
                calories: s.calorias_quemadas || 0,
            }));
        }
        const localItems = local.slice(0, 3).map(w => ({
            date:     new Date(w.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
            name:     w.activity,
            duration: w.duration,
            calories: w.calories,
        }));
        items = [...localItems, ...items].slice(0, 6);

        if (!items.length) {
            container.innerHTML = '<p style="color:#888;text-align:center;padding:30px">Sin sesiones recientes. ¡Empieza hoy!</p>';
            return;
        }
        container.innerHTML = `<div class="recent-sessions-grid">
            ${items.map(i => `
                <div class="recent-session-card">
                    <div class="rs-date">${i.date}</div>
                    <div class="rs-name">${i.name}</div>
                    <div class="rs-meta">${i.duration} &nbsp;·&nbsp; ${i.calories} kcal</div>
                </div>`).join('')}
        </div>`;
    } catch (_) {
        container.innerHTML = '<p style="color:#888;text-align:center;padding:30px">No se pudieron cargar las sesiones</p>';
    }
}

// ── Modal nuevo entrenamiento ─────────────────────────────────
function showNewWorkoutModal() {
    removeModal('newTrainingModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop'; modal.id = 'newTrainingModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Nuevo Entrenamiento</h2>
                <button class="modal-close" onclick="removeModal('newTrainingModal')">×</button>
            </div>
            <div class="form-group">
                <label>Nombre *</label>
                <input id="wNombre" type="text" placeholder="Ej: Push Day" autofocus>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
                <div class="form-group"><label>Duración (min)</label><input id="wDuracion" type="number" min="1" placeholder="60"></div>
                <div class="form-group"><label>Calorías</label><input id="wCalorias" type="number" min="0" placeholder="450"></div>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Intensidad &nbsp;<span id="wIntVal" style="color:#c8ff00;font-weight:700">5</span>/10</label>
                <input id="wIntensidad" type="range" min="1" max="10" value="5" style="width:100%">
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Notas</label>
                <textarea id="wNotas" placeholder="Notas…" style="min-height:70px;width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font:inherit;padding:12px 14px;resize:vertical"></textarea>
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

    const workout = { id: Date.now(), date: new Date().toISOString(), activity: name, duration: `${duration} min`, calories, intensity };
    const persist = (local) => {
        if (local) {
            const stored = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
            stored.unshift(workout);
            localStorage.setItem('vitaliaLocalWorkouts', JSON.stringify(stored.slice(0, 50)));
        }
        showToast(`✓ "${name}" guardado`);
        removeModal('newTrainingModal');
        loadDashboard();
    };
    try {
        const res = await authFetch(`${API_URL}/sesiones/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo_entrenamiento: name, duracion_minutos: duration, calorias_quemadas: calories, nivel_intensidad: intensity, notas: notes })
        });
        persist(!res.ok);
    } catch (_) { persist(true); }
}

window.saveWorkout         = saveWorkout;
window.showNewWorkoutModal = showNewWorkoutModal;