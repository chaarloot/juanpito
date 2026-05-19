// ============================================================
// habitos.js — Vitalia JC
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initPage('habitos');
    loadHabitos();
    document.getElementById('btnNuevoHabito')?.addEventListener('click', showNewHabitModal);
    document.getElementById('btnSoloActivos')?.addEventListener('change', loadHabitos);
});

async function loadHabitos() {
    const grid = document.getElementById('habitosGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="loading-text">Cargando hábitos…</p>';

    try {
        const res = await authFetch(`${API_URL}/habitos/resumen/todos`);
        if (!res.ok) throw new Error();
        const datosBackend = await res.json();

        // 1. CORRECCIÓN UNIFICADA: Normalizamos el estado de los hábitos nuevos en todo el array
        const habitos = datosBackend.map(h => {
            const pct = h.porcentaje_cumplimiento || 0;
            // Si no tiene registros o es su primer registro con un porcentaje bajo, es un hábito nuevo
            const esHabitoNuevo = h.registros_periodo === 0 || (h.registros_periodo === 1 && pct < 15);
            
            return {
                ...h,
                estado: esHabitoNuevo ? 'activo' : h.estado // Forzamos 'activo' globalmente si aplica
            };
        });

        // 2. Ahora los contadores leerán los datos ya normalizados correctamente
        setEl('totalHabitos',   habitos.length);
        setEl('habitosActivos', habitos.filter(h => h.estado === 'activo').length);
        setEl('habitosRiesgo',  habitos.filter(h => h.estado === 'riesgo').length);

        // 3. El filtro de "Solo activos" ahora funcionará a la perfección
        const soloActivos = document.getElementById('btnSoloActivos')?.checked;
        const filtered = soloActivos ? habitos.filter(h => h.estado === 'activo') : habitos;

        grid.innerHTML = '';
        if (!filtered.length) {
            grid.innerHTML = `<div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>No hay hábitos que coincidan con el filtro</p>
                <button class="btn-primary" onclick="showNewHabitModal()" style="margin-top:16px">+ Crear nuevo hábito</button>
            </div>`;
            return;
        }

        // 4. Renderizado de las tarjetas
        filtered.forEach(h => {
            const pct = h.porcentaje_cumplimiento || 0;
            const color = h.estado === 'activo' ? '#c8ff00' : h.estado === 'riesgo' ? '#ffaa00' : '#ff4444';
            const icon  = h.estado === 'activo' ? '✅' : h.estado === 'riesgo' ? '⚠️' : '❌';
            const textoEstado = h.estado === 'activo' ? 'Activo' : h.estado === 'riesgo' ? 'En riesgo' : 'Abandonado';

            const nombreEscapado = h.nombre.replace(/'/g, "\\'").replace(/"/g, '&quot;');

            const card = document.createElement('div');
            card.className = 'habit-card';
            card.innerHTML = `
                <div class="habit-card-header">
                    <span class="habit-icon">${icon}</span>
                    <div class="habit-meta">
                        <div class="habit-name">${h.nombre}</div>
                        <div class="habit-freq">${capitalize(h.frecuencia)}</div>
                    </div>
                    <button class="habit-delete-btn" onclick="eliminarHabito(${h.habito_id}, '${nombreEscapado}')" title="Eliminar hábito">✕</button>
                </div>
                <div class="habit-progress-wrap">
                    <div class="habit-progress-bar">
                        <div class="habit-progress-fill" style="width:${Math.min(pct,100)}%;background:${color}"></div>
                    </div>
                    <span class="habit-pct" style="color:${color}">${pct}%</span>
                </div>
                <div class="habit-stats">
                    <span>${h.registros_periodo} registros este periodo</span>
                    <span style="color:${color};font-weight:600">${textoEstado}</span>
                </div>
                <div class="habit-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn-secondary" style="flex:1; min-width:80px; padding:8px" onclick="verDetallesHabito(${h.habito_id}, '${nombreEscapado}')">Ver detalles</button>
                    <button class="btn-primary"   style="flex:1; min-width:100px; padding:8px" onclick="registrarHoy(${h.habito_id},'${nombreEscapado}')">✓ Registrar</button>
                    <button class="btn-secondary" style="background: rgba(255, 68, 68, 0.15); color: #ff4444; border: 1px solid rgba(255, 68, 68, 0.3); padding: 8px 12px; border-radius: 8px; cursor: pointer;" onclick="eliminarHabito(${h.habito_id}, '${nombreEscapado}')" title="Eliminar Hábito">🗑️</button>
                </div>`;
            grid.appendChild(card);
        });
    } catch (_) {
        grid.innerHTML = '<p style="color:#ff4444;text-align:center;padding:40px">Error al cargar hábitos</p>';
    }
}

async function verDetallesHabito(id, nombreFallback = 'Hábito') {
    let s = null;
    try {
        const res = await authFetch(`${API_URL}/habitos/${id}/estadisticas/`);
        if (res.ok) {
            s = await res.json();
        } else {
            const resAlt = await authFetch(`${API_URL}/habitos/${id}/estadisticas`);
            if (resAlt.ok) s = await resAlt.json();
        }
    } catch (err) {
        console.warn("Error consultando estadísticas en el servidor:", err);
    }

    if (!s) {
        s = {
            nombre_habito: nombreFallback,
            porcentaje_cumplimiento: 0,
            racha_actual: 0,
            racha_maxima: 0,
            total_registros: 0,
            periodo_dias: 30
        };
    }

    showInfoModal(`📊 ${s.nombre_habito}`, `
        <div class="detail-grid">
            <div class="detail-item"><span>Cumplimiento</span><strong>${s.porcentaje_cumplimiento}%</strong></div>
            <div class="detail-item"><span>Racha actual</span><strong>${s.racha_actual} días</strong></div>
            <div class="detail-item"><span>Racha máxima</span><strong>${s.racha_maxima} días</strong></div>
            <div class="detail-item"><span>Total registros</span><strong>${s.total_registros}</strong></div>
        </div>
        <div style="margin-top:16px;color:#a0a0a0;font-size:13px">Periodo: últimos ${s.periodo_dias} días</div>`);
}

async function registrarHoy(id, nombre) {
    const hoy = new Date().toISOString().split('T')[0];

    try {
        const checkRes = await authFetch(`${API_URL}/habitos/${id}/registros?limit=100`);
        if (checkRes.ok) {
            const registros = await checkRes.json();
            const yaRegistrado = registros.some(r => r.fecha_registro === hoy || r.fecha_registro?.startsWith(hoy));
            if (yaRegistrado) {
                showToast(`Ya registraste "${nombre}" hoy ✓`, 'error');
                return;
            }
        }
    } catch (_) {}

    try {
        const res = await authFetch(`${API_URL}/habitos/${id}/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fecha_registro: hoy, cantidad_completada: 1, notas: '' })
        });

        if (res.ok || res.status === 201) {
            showToast(`✓ "${nombre}" registrado hoy`);
            loadHabitos();
        } else {
            const d = await res.json().catch(() => ({}));
            const msg = typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail);
            if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate') || res.status === 422) {
                showToast(`Ya registraste "${nombre}" hoy ✓`, 'error');
            } else {
                showToast(msg || 'Error al registrar', 'error');
            }
        }
    } catch (_) {
        showToast('Error de conexión', 'error');
    }
}

async function eliminarHabito(id, nombre = 'este hábito') {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el hábito "${nombre}" y todo su historial de registros?`)) return;
    try {
        const res = await authFetch(`${API_URL}/habitos/${id}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) { 
            showToast('Hábito eliminado correctamente'); 
            loadHabitos(); 
        } else {
            throw new Error();
        }
    } catch (_) { 
        showToast('Error del servidor al intentar eliminar el hábito', 'error'); 
    }
}

function showNewHabitModal() {
    removeModal('newHabitModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop'; modal.id = 'newHabitModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:480px">
            <div class="modal-header">
                <h2>Nuevo Hábito</h2>
                <button class="modal-close" onclick="removeModal('newHabitModal')">×</button>
            </div>
            <div class="form-group">
                <label>Nombre *</label>
                <input id="hNombre" type="text" placeholder="Ej: Beber 2L de agua" autofocus>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Descripción</label>
                <textarea id="hDesc" placeholder="Descripción opcional…" style="min-height:70px;width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font:inherit;padding:12px 14px;resize:vertical"></textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
                <div class="form-group">
                    <label>Frecuencia</label>
                    <select id="hFrecuencia" class="modal-select">
                        <option value="diario">Diario</option>
                        <option value="semanal">Semanal</option>
                        <option value="mensual">Mensual</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Objetivo (cantidad)</label>
                    <input id="hObjetivo" type="number" min="1" value="1">
                </div>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Unidad</label>
                <input id="hUnidad" type="text" placeholder="veces, vasos, km…" value="veces">
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Hora recordatorio (opcional)</label>
                <input id="hHora" type="time">
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
    const desc     = document.getElementById('hDesc')?.value.trim() || null;
    const frec     = document.getElementById('hFrecuencia')?.value || 'diario';
    const objetivo = parseInt(document.getElementById('hObjetivo')?.value) || 1;
    const unidad   = document.getElementById('hUnidad')?.value.trim() || 'veces';
    const hora     = document.getElementById('hHora')?.value || null;
    if (!nombre) { showToast('El nombre es obligatorio', 'error'); return; }
    try {
        const res = await authFetch(`${API_URL}/habitos/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, descripcion: desc, frecuencia: frec, objetivo_cantidad: objetivo, unidad, hora_recordatorio: hora })
        });
        if (!res.ok) throw new Error();
        showToast('✓ Hábito creado');
        removeModal('newHabitModal');
        loadHabitos();
    } catch (_) { showToast('Error al crear el hábito', 'error'); }
}

window.verDetallesHabito = verDetallesHabito;
window.registrarHoy      = registrarHoy;
window.eliminarHabito    = eliminarHabito;
window.showNewHabitModal = showNewHabitModal;
window.saveHabito        = saveHabito;