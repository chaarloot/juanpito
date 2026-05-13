// ============================================================
// progreso.js — Vitalia JC
// ============================================================

let weightChartInstance   = null;
let caloriesChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initPage('progreso');
    loadProgreso();
    document.getElementById('btnNewMetric')?.addEventListener('click', showNewMetricModal);
});

async function loadProgreso() {
    await loadMetricsSummary();
    await renderWeightChart();
    await renderCaloriesChart();
}

// ── Tarjetas resumen ──────────────────────────────────────────
async function loadMetricsSummary() {
    const container = document.getElementById('metricsSummary');
    if (!container) return;
    try {
        const res = await authFetch(`${API_URL}/metricas/resumen/general?dias_atras=30`);
        if (!res.ok) { container.innerHTML = ''; return; }
        const d = await res.json();
        if (!d.total_registros) {
            container.innerHTML = '<p style="color:#888;margin-bottom:20px">Sin métricas registradas. Empieza registrando tu peso y sueño.</p>';
            return;
        }
        container.innerHTML = `
            <div class="metrics-summary-grid" style="margin-bottom:28px">
                ${metricCard('⚖️ Peso promedio',    d.peso?.promedio        ? d.peso.promedio + ' kg'                   : '—', d.peso?.tendencia || '')}
                ${metricCard('❤️ Pulso promedio',   d.ritmo_cardiaco?.promedio ? d.ritmo_cardiaco.promedio + ' bpm'     : '—', '')}
                ${metricCard('😴 Sueño promedio',   d.sueño_minutos?.promedio  ? fmtSueno(d.sueño_minutos.promedio)    : '—', '')}
                ${metricCard('🧠 Estrés promedio',  d.nivel_estres?.promedio   ? d.nivel_estres.promedio + '/10'        : '—', '')}
            </div>`;
    } catch (_) { container.innerHTML = ''; }
}

function metricCard(label, value, sub) {
    return `<div class="metric-summary-card">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${value}</div>
        ${sub ? `<div class="metric-sub">${sub}</div>` : ''}
    </div>`;
}

function fmtSueno(minutos) {
    const h = Math.floor(minutos / 60);
    const m = Math.round(minutos % 60);
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Gráfico Peso ─────────────────────────────────────────────
async function renderWeightChart() {
    const canvas = document.getElementById('weightChart');
    if (!canvas) return;
    if (weightChartInstance) weightChartInstance.destroy();

    let labels = ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6','Sem 7','Sem 8'];
    let data   = [];

    try {
        const res = await authFetch(`${API_URL}/metricas/?limit=50`);
        if (res.ok) {
            const metricas = await res.json();
            const conPeso  = metricas.filter(m => m.peso_kg).reverse();
            if (conPeso.length >= 2) {
                labels = conPeso.map(m => new Date(m.fecha_metrica).toLocaleDateString('es-ES', { day:'numeric', month:'short' }));
                data   = conPeso.map(m => m.peso_kg);
            }
        }
    } catch (_) {}

    if (!data.length) {
        canvas.parentElement.innerHTML = '<p style="color:#888;text-align:center;padding:40px">Sin datos de peso. Regístralos en Métricas.</p>';
        return;
    }

    weightChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Peso (kg)',
                data,
                borderColor: '#c8ff00',
                backgroundColor: 'rgba(200,255,0,0.08)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#c8ff00',
                pointBorderColor: '#1a1a1a',
                pointRadius: 5,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#a0a0a0' } } },
            scales: {
                y: { ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#a0a0a0' }, grid: { display: false } }
            }
        }
    });
}

// ── Gráfico Calorías ─────────────────────────────────────────
async function renderCaloriesChart() {
    const canvas = document.getElementById('caloriesChart');
    if (!canvas) return;
    if (caloriesChartInstance) caloriesChartInstance.destroy();

    const data = [0,0,0,0,0,0,0];
    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=7`);
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
            datasets: [{
                label: 'Calorías quemadas',
                data,
                backgroundColor: 'rgba(200,255,0,0.4)',
                borderColor: '#c8ff00',
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#a0a0a0' } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#a0a0a0' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#a0a0a0' }, grid: { display: false } }
            }
        }
    });
}

// ── Modal nueva métrica ───────────────────────────────────────
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
        showToast('✓ Métrica registrada');
        removeModal('newMetricModal');
        loadProgreso();
    } catch (_) { showToast('Error al guardar la métrica', 'error'); }
}

window.showNewMetricModal = showNewMetricModal;
window.saveMetrica        = saveMetrica;