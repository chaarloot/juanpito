// ============================================================
// metricas.js — Vitalia JC
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initPage('metricas');
    loadMetricas();
    document.getElementById('btnNewMetric')?.addEventListener('click', showNewMetricModal);
    document.getElementById('filtroMetricas')?.addEventListener('change', loadMetricas);
});

async function loadMetricas() {
    const list = document.getElementById('metricasList');
    if (!list) return;
    list.innerHTML = '<p class="loading-text">Cargando métricas…</p>';

    const dias = parseInt(document.getElementById('filtroMetricas')?.value) || 30;

    try {
        const [resMetricas, resResumen] = await Promise.all([
            authFetch(`${API_URL}/metricas/?limit=50`),
            authFetch(`${API_URL}/metricas/resumen/general?dias_atras=${dias}`)
        ]);

        // Resumen cards
        if (resResumen.ok) {
            const d = await resResumen.json();
            renderResumenCards(d);
        }

        if (!resMetricas.ok) throw new Error();
        const metricas = await resMetricas.json();

        list.innerHTML = '';
        if (!metricas.length) {
            list.innerHTML = `<div class="empty-state">
                <div class="empty-icon">📏</div>
                <p>Sin métricas registradas</p>
                <button class="btn-primary" onclick="showNewMetricModal()" style="margin-top:16px">+ Registrar primera métrica</button>
            </div>`;
            return;
        }

        metricas.forEach(m => {
            const el = document.createElement('div');
            el.className = 'metric-row-card';
            el.innerHTML = `
                <div class="metric-row-date">
                    ${new Date(m.fecha_metrica).toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}
                </div>
                <div class="metric-row-values">
                    ${m.peso_kg           ? `<span class="metric-pill">⚖️ ${m.peso_kg} kg</span>`              : ''}
                    ${m.ritmo_cardiaco    ? `<span class="metric-pill">❤️ ${m.ritmo_cardiaco} bpm</span>`       : ''}
                    ${m.presion_sistolica ? `<span class="metric-pill">🩺 ${m.presion_sistolica}/${m.presion_diastolica}</span>` : ''}
                    ${m.horas_sueno != null ? `<span class="metric-pill">😴 ${m.horas_sueno}h${m.minutos_sueno ? m.minutos_sueno + 'min' : ''}</span>` : ''}
                    ${m.glucosa_sangre    ? `<span class="metric-pill">🩸 ${m.glucosa_sangre} mg/dL</span>`     : ''}
                    ${m.nivel_estres      ? `<span class="metric-pill">🧠 Estrés ${m.nivel_estres}/10</span>`   : ''}
                </div>
                ${m.notas ? `<div class="metric-row-notes">${m.notas}</div>` : ''}
                <button class="metric-delete-btn" onclick="deleteMetrica(${m.metrica_id})" title="Eliminar">✕</button>`;
            list.appendChild(el);
        });
    } catch (_) {
        list.innerHTML = '<p style="color:#ff4444;text-align:center;padding:40px">Error al cargar métricas</p>';
    }
}

function renderResumenCards(d) {
    const container = document.getElementById('resumenCards');
    if (!container) return;
    if (!d.total_registros) { container.innerHTML = ''; return; }

    const fmtSueno = (min) => { const h = Math.floor(min/60), m = Math.round(min%60); return m ? `${h}h ${m}min` : `${h}h`; };

    container.innerHTML = `<div class="metrics-summary-grid" style="margin-bottom:28px">
        ${rc('⚖️ Peso',    d.peso?.promedio          ? d.peso.promedio + ' kg'            : '—', d.peso?.tendencia)}
        ${rc('❤️ Pulso',   d.ritmo_cardiaco?.promedio ? d.ritmo_cardiaco.promedio + ' bpm' : '—', '')}
        ${rc('😴 Sueño',   d.sueño_minutos?.promedio  ? fmtSueno(d.sueño_minutos.promedio) : '—', '')}
        ${rc('🧠 Estrés',  d.nivel_estres?.promedio    ? d.nivel_estres.promedio + '/10'    : '—', '')}
        ${rc('🩺 Presión', d.presion_sistolica?.promedio ? `${d.presion_sistolica.promedio}/${d.presion_diastolica?.promedio}` : '—', '')}
        ${rc('🩸 Glucosa', d.glucosa?.promedio          ? d.glucosa.promedio + ' mg/dL'     : '—', '')}
    </div>`;
}

function rc(label, value, sub) {
    return `<div class="metric-summary-card">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${value}</div>
        ${sub ? `<div class="metric-sub">${capitalize(sub)}</div>` : ''}
    </div>`;
}

async function deleteMetrica(id) {
    if (!confirm('¿Eliminar esta métrica?')) return;
    try {
        const res = await authFetch(`${API_URL}/metricas/${id}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) { showToast('Métrica eliminada'); loadMetricas(); }
        else throw new Error();
    } catch (_) { showToast('Error al eliminar', 'error'); }
}

function showNewMetricModal() {
    removeModal('newMetricModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop'; modal.id = 'newMetricModal';
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
                <div class="form-group"><label>Peso (kg)</label><input id="mPeso" type="number" step="0.1" placeholder="75.0"></div>
                <div class="form-group"><label>Pulso (bpm)</label><input id="mPulso" type="number" placeholder="72"></div>
                <div class="form-group"><label>Presión sistólica</label><input id="mPSist" type="number" placeholder="120"></div>
                <div class="form-group"><label>Presión diastólica</label><input id="mPDias" type="number" placeholder="80"></div>
                <div class="form-group"><label>Horas de sueño</label><input id="mSueno" type="number" step="0.5" placeholder="7.5"></div>
                <div class="form-group"><label>Glucosa (mg/dL)</label><input id="mGlucosa" type="number" step="0.1" placeholder="90"></div>
            </div>
            <div class="form-group" style="margin-top:14px">
                <label>Nivel de estrés &nbsp;<span id="mEstresVal" style="color:#c8ff00;font-weight:700">5</span>/10</label>
                <input id="mEstres" type="range" min="1" max="10" value="5" style="width:100%">
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
    document.getElementById('mEstres')?.addEventListener('input', e => {
        document.getElementById('mEstresVal').textContent = e.target.value;
    });
}

async function saveMetrica() {
    const fecha = document.getElementById('mFecha')?.value;
    if (!fecha) { showToast('Indica la fecha', 'error'); return; }
    const sueno = parseFloatOrNull('mSueno');
    const body  = {
        fecha_metrica:      fecha,
        peso_kg:            parseFloatOrNull('mPeso'),
        ritmo_cardiaco:     parseIntOrNull('mPulso'),
        presion_sistolica:  parseIntOrNull('mPSist'),
        presion_diastolica: parseIntOrNull('mPDias'),
        horas_sueno:        sueno ? Math.floor(sueno) : null,
        minutos_sueno:      sueno ? Math.round((sueno % 1) * 60) : null,
        glucosa_sangre:     parseFloatOrNull('mGlucosa'),
        nivel_estres:       parseIntOrNull('mEstres'),
        notas:              document.getElementById('mNotas')?.value.trim() || null,
    };
    try {
        const res = await authFetch(`${API_URL}/metricas/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error();
        showToast('✓ Métrica guardada');
        removeModal('newMetricModal');
        loadMetricas();
    } catch (_) { showToast('Error al guardar', 'error'); }
}

window.showNewMetricModal = showNewMetricModal;
window.saveMetrica        = saveMetrica;
window.deleteMetrica      = deleteMetrica;