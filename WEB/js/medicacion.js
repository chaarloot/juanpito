// ============================================================
// medicacion.js — Vitalia JC
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initPage('medicacion');
    loadMedicacion();
    document.getElementById('btnNewMed')?.addEventListener('click', showNewMedModal);
    document.getElementById('filtroMed')?.addEventListener('change', loadMedicacion);
});

async function loadMedicacion() {
    const list = document.getElementById('medicacionList');
    if (!list) return;
    list.innerHTML = '<p class="loading-text">Cargando medicación…</p>';

    try {
        const res = await authFetch(`${API_URL}/medicacion/`);
        if (!res.ok) throw new Error();
        let meds = await res.json();

        const filtro = document.getElementById('filtroMed')?.value || 'todas';
        if (filtro === 'activas')   meds = meds.filter(m => m.activo);
        if (filtro === 'inactivas') meds = meds.filter(m => !m.activo);

        setEl('totalMeds',   meds.length);
        setEl('medsActivas', meds.filter(m => m.activo).length);

        list.innerHTML = '';
        if (!meds.length) {
            list.innerHTML = `<div class="empty-state">
                <div class="empty-icon">💊</div>
                <p>Sin medicación registrada</p>
                <button class="btn-primary" onclick="showNewMedModal()" style="margin-top:16px">+ Añadir medicación</button>
            </div>`;
            return;
        }

        meds.forEach(m => {
            const el = document.createElement('div');
            el.className = 'med-card';
            el.innerHTML = `
                <div class="med-card-header">
                    <div>
                        <div class="med-name">${m.nombre_medicacion}</div>
                        <div class="med-dosis">${m.dosis || 'Sin dosis especificada'}</div>
                    </div>
                    <span class="med-status ${m.activo ? 'active' : 'inactive'}">${m.activo ? '● Activa' : '● Inactiva'}</span>
                </div>
                <div class="med-details">
                    <span>⏰ ${formatFrecuencia(m.frecuencia)}</span>
                    ${m.hora_programada ? `<span>🕐 ${m.hora_programada.slice(0,5)}</span>` : ''}
                    <span>📅 Desde ${new Date(m.fecha_inicio).toLocaleDateString('es-ES')}</span>
                    ${m.fecha_fin ? `<span>📅 Hasta ${new Date(m.fecha_fin).toLocaleDateString('es-ES')}</span>` : ''}
                </div>
                ${m.instrucciones ? `<div class="med-instrucciones">${m.instrucciones}</div>` : ''}
                <div class="med-actions">
                    <button class="btn-secondary" style="padding:7px 14px;font-size:12px" onclick="toggleMed(${m.medicacion_id}, ${m.activo})">
                        ${m.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="btn-secondary" style="padding:7px 14px;font-size:12px;border-color:#ff4444;color:#ff4444" onclick="deleteMed(${m.medicacion_id})">
                        Eliminar
                    </button>
                </div>`;
            list.appendChild(el);
        });
    } catch (_) {
        list.innerHTML = '<p style="color:#ff4444;text-align:center;padding:40px">Error al cargar medicación</p>';
    }
}

async function toggleMed(id, activo) {
    try {
        const res = await authFetch(`${API_URL}/medicacion/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: !activo })
        });
        if (!res.ok) throw new Error();
        showToast(activo ? 'Medicación desactivada' : 'Medicación activada');
        loadMedicacion();
    } catch (_) { showToast('Error al actualizar', 'error'); }
}

async function deleteMed(id) {
    if (!confirm('¿Eliminar esta medicación?')) return;
    try {
        const res = await authFetch(`${API_URL}/medicacion/${id}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) { showToast('Medicación eliminada'); loadMedicacion(); }
        else throw new Error();
    } catch (_) { showToast('Error al eliminar', 'error'); }
}

function showNewMedModal() {
    removeModal('newMedModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop'; modal.id = 'newMedModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:480px">
            <div class="modal-header">
                <h2>Nueva Medicación</h2>
                <button class="modal-close" onclick="removeModal('newMedModal')">×</button>
            </div>
            <div class="form-group">
                <label>Nombre *</label>
                <input id="medNombre" type="text" placeholder="Ej: Ibuprofeno 400mg" autofocus>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Dosis</label>
                <input id="medDosis" type="text" placeholder="Ej: 1 comprimido">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px">
                <div class="form-group">
                    <label>Frecuencia</label>
                    <select id="medFrec" class="modal-select">
                        <option value="una_vez_dia">1 vez al día</option>
                        <option value="dos_veces_dia">2 veces al día</option>
                        <option value="tres_veces_dia">3 veces al día</option>
                        <option value="semanal">Semanal</option>
                        <option value="segun_necesidad">Según necesidad</option>
                        <option value="personalizado">Personalizado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Hora (opcional)</label>
                    <input id="medHora" type="time">
                </div>
                <div class="form-group">
                    <label>Fecha inicio *</label>
                    <input id="medInicio" type="date" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label>Fecha fin (opcional)</label>
                    <input id="medFin" type="date">
                </div>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Instrucciones</label>
                <textarea id="medInstrucciones" placeholder="Ej: Tomar con comida…" style="min-height:70px;width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;color:#fff;font:inherit;padding:12px 14px;resize:vertical"></textarea>
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
    const inicio = document.getElementById('medInicio')?.value;
    if (!nombre) { showToast('El nombre es obligatorio', 'error'); return; }
    if (!inicio) { showToast('Indica la fecha de inicio', 'error'); return; }
    const fin = document.getElementById('medFin')?.value || null;
    const body = {
        nombre_medicacion: nombre,
        dosis:             document.getElementById('medDosis')?.value.trim() || null,
        frecuencia:        document.getElementById('medFrec')?.value,
        hora_programada:   document.getElementById('medHora')?.value || null,
        fecha_inicio:      inicio,
        fecha_fin:         fin,
        instrucciones:     document.getElementById('medInstrucciones')?.value.trim() || null,
    };
    try {
        const res = await authFetch(`${API_URL}/medicacion/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error();
        showToast('✓ Medicación guardada');
        removeModal('newMedModal');
        loadMedicacion();
    } catch (_) { showToast('Error al guardar', 'error'); }
}

window.showNewMedModal = showNewMedModal;
window.saveMed         = saveMed;
window.toggleMed       = toggleMed;
window.deleteMed       = deleteMed;