// ============================================================
// historial.js — Vitalia JC
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initPage('historial');
    loadHistorial();
    document.getElementById('filtroDias')?.addEventListener('change', loadHistorial);
    document.getElementById('filtroTipo')?.addEventListener('input', filterLocal);
    document.getElementById('btnNewWorkout')?.addEventListener('click', showNewWorkoutModal);
});

let allItems = [];

async function loadHistorial() {
    const list = document.getElementById('historialList');
    if (!list) return;
    list.innerHTML = '<p class="loading-text">Cargando historial…</p>';

    const dias = parseInt(document.getElementById('filtroDias')?.value) || 30;
    allItems = [];

    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=${dias}`);
        if (res.ok) {
            const api = await res.json();
            allItems = api.map(s => ({
                id:       s.sesion_id,
                date:     s.inicio,
                name:     s.tipo_entrenamiento,
                duration: `${s.duracion_minutos || 0} min`,
                calories: s.calorias_quemadas || 0,
                intensity: s.nivel_intensidad || 0,
                notes:    s.notas || '',
                source:   'api',
            }));
        }
    } catch (_) {}

    const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
    const localItems = local.map(w => ({
        id:       w.id,
        date:     w.date,
        name:     w.activity,
        duration: w.duration,
        calories: w.calories,
        intensity: w.intensity || 0,
        notes:    '',
        source:   'local',
    }));

    allItems = [...localItems, ...allItems];
    setEl('historialCount', allItems.length);
    renderHistorial(allItems);
}

function filterLocal() {
    const q = (document.getElementById('filtroTipo')?.value || '').toLowerCase();
    renderHistorial(q ? allItems.filter(i => i.name.toLowerCase().includes(q)) : allItems);
}

function renderHistorial(items) {
    const list = document.getElementById('historialList');
    if (!list) return;
    list.innerHTML = '';

    if (!items.length) {
        list.innerHTML = `<div class="empty-state">
            <div class="empty-icon">⏱️</div>
            <p>Sin entrenamientos en este periodo</p>
            <button class="btn-primary" onclick="showNewWorkoutModal()" style="margin-top:16px">+ Registrar entrenamiento</button>
        </div>`;
        return;
    }

    // Agrupar por fecha
    const byDate = {};
    items.forEach(i => {
        const day = new Date(i.date).toISOString().split('T')[0];
        if (!byDate[day]) byDate[day] = [];
        byDate[day].push(i);
    });

    Object.keys(byDate).sort((a,b) => b.localeCompare(a)).forEach(day => {
        const dateLabel = document.createElement('div');
        dateLabel.className = 'history-date-label';
        dateLabel.textContent = new Date(day + 'T12:00:00').toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
        list.appendChild(dateLabel);

        byDate[day].forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-info">
                    <div class="history-name">${item.name}</div>
                    <div class="history-meta">
                        <span>⏱ ${item.duration}</span>
                        <span>🔥 ${item.calories} kcal</span>
                        ${item.intensity ? `<span>⚡ ${item.intensity}/10</span>` : ''}
                        ${item.source === 'local' ? '<span class="local-badge">Local</span>' : ''}
                    </div>
                    ${item.notes ? `<div class="history-notes">${item.notes}</div>` : ''}
                </div>
                <div class="history-actions">
                    ${item.source === 'local'
                        ? `<button class="icon-btn danger" onclick="deleteLocal(${item.id})" title="Eliminar">🗑</button>`
                        : `<button class="icon-btn danger" onclick="deleteApi(${item.id})" title="Eliminar">🗑</button>`}
                </div>`;
            list.appendChild(el);
        });
    });
}

function deleteLocal(id) {
    if (!confirm('¿Eliminar este entrenamiento local?')) return;
    const stored = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
    localStorage.setItem('vitaliaLocalWorkouts', JSON.stringify(stored.filter(w => w.id !== id)));
    showToast('Entrenamiento eliminado');
    loadHistorial();
}

async function deleteApi(id) {
    if (!confirm('¿Eliminar esta sesión?')) return;
    try {
        const res = await authFetch(`${API_URL}/sesiones/${id}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) { showToast('Sesión eliminada'); loadHistorial(); }
        else throw new Error();
    } catch (_) { showToast('Error al eliminar', 'error'); }
}

// ── Modal nuevo entrenamiento ─────────────────────────────────
function showNewWorkoutModal() {
    removeModal('newWorkoutModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop'; modal.id = 'newWorkoutModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Nuevo Entrenamiento</h2>
                <button class="modal-close" onclick="removeModal('newWorkoutModal')">×</button>
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
                <button class="btn-primary" style="flex:1" onclick="saveWorkoutHistory()">Guardar</button>
                <button class="btn-secondary" style="flex:1" onclick="removeModal('newWorkoutModal')">Cancelar</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) removeModal('newWorkoutModal'); });
    document.getElementById('wIntensidad')?.addEventListener('input', e => {
        document.getElementById('wIntVal').textContent = e.target.value;
    });
}

async function saveWorkoutHistory() {
    const name      = document.getElementById('wNombre')?.value.trim();
    const duration  = parseInt(document.getElementById('wDuracion')?.value) || 60;
    const calories  = parseInt(document.getElementById('wCalorias')?.value) || 0;
    const intensity = parseInt(document.getElementById('wIntensidad')?.value) || 5;
    const notes     = document.getElementById('wNotas')?.value.trim() || '';
    if (!name) { showToast('El nombre es obligatorio', 'error'); return; }

    const workout = { id: Date.now(), date: new Date().toISOString(), activity: name, duration: `${duration} min`, calories, intensity };
    const persist = (local) => {
        if (local) {
            const s = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
            s.unshift(workout);
            localStorage.setItem('vitaliaLocalWorkouts', JSON.stringify(s.slice(0, 50)));
        }
        showToast(`✓ "${name}" guardado`);
        removeModal('newWorkoutModal');
        loadHistorial();
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

window.deleteLocal          = deleteLocal;
window.deleteApi            = deleteApi;
window.showNewWorkoutModal  = showNewWorkoutModal;
window.saveWorkoutHistory   = saveWorkoutHistory;