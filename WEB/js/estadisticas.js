// ============================================================
// estadisticas.js — Vitalia JC
// ============================================================

let typeChartInstance      = null;
let weeklyStatsInstance    = null;
let intensityChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initPage('estadisticas');
    loadEstadisticas();
    document.getElementById('filtroDias')?.addEventListener('change', loadEstadisticas);
});

async function loadEstadisticas() {
    const dias = parseInt(document.getElementById('filtroDias')?.value) || 30;
    await loadStatCards(dias);
    await renderTipoChart(dias);
    await renderIntensidadChart(dias);
    await renderSemanalChart(dias);
}

async function loadStatCards(dias) {
    try {
        const res = await authFetch(`${API_URL}/sesiones/stats/resumen?dias_atras=${dias}`);
        if (!res.ok) throw new Error();
        const d = await res.json();
        const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
        const extraCal = local.reduce((a, w) => a + (Number(w.calories)||0), 0);
        const extraMin = local.reduce((a, w) => a + parseWorkoutMinutes(w.duration), 0);

        setEl('statTotal',    (d.total_entrenamientos || 0) + local.length);
        setEl('statCalorias', formatCalories((d.total_calorias || 0) + extraCal));
        setEl('statMinutos',  (d.total_minutos || 0) + extraMin);
        setEl('statSemanal',  d.promedio_semanal ? d.promedio_semanal.toFixed(1) : '0');
        setEl('statIntensidad', d.intensidad_promedio ? d.intensidad_promedio + '/10' : '—');
    } catch (_) {
        ['statTotal','statCalorias','statMinutos','statSemanal','statIntensidad'].forEach(id => setEl(id, '—'));
    }
}

async function renderTipoChart(dias) {
    const canvas = document.getElementById('tipoChart');
    if (!canvas) return;
    if (typeChartInstance) typeChartInstance.destroy();

    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=${dias}`);
        if (!res.ok) return;
        const sesiones = await res.json();
        if (!sesiones.length) { canvas.parentElement.innerHTML = '<p style="color:#888;text-align:center;padding:20px">Sin datos</p>'; return; }

        const byType = {};
        sesiones.forEach(s => { const t = s.tipo_entrenamiento || 'Otro'; byType[t] = (byType[t]||0)+1; });
        const labels = Object.keys(byType);
        const data   = Object.values(byType);
        const colors = ['#c8ff00','#ff4444','#4da6ff','#ffdd44','#ff88cc','#88ffcc','#aa88ff','#ffaa44'];

        typeChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }] },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#a0a0a0', padding: 12, font: { size: 12 } } } }
            }
        });
    } catch (_) {}
}

async function renderIntensidadChart(dias) {
    const canvas = document.getElementById('intensidadChart');
    if (!canvas) return;
    if (intensityChartInstance) intensityChartInstance.destroy();

    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=${dias}`);
        if (!res.ok) return;
        const sesiones = await res.json();
        if (!sesiones.length) return;

        const bins = [0,0,0,0,0,0,0,0,0,0]; // 1-10
        sesiones.forEach(s => { const i = (s.nivel_intensidad || 5) - 1; if (i >= 0 && i < 10) bins[i]++; });

        intensityChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['1','2','3','4','5','6','7','8','9','10'],
                datasets: [{
                    label: 'Sesiones',
                    data: bins,
                    backgroundColor: bins.map((_, i) => `hsl(${80 - i*8}, 100%, ${60 - i*2}%)`),
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { color: '#a0a0a0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#a0a0a0' }, grid: { display: false } }
                }
            }
        });
    } catch (_) {}
}

async function renderSemanalChart(dias) {
    const canvas = document.getElementById('semanalChart');
    if (!canvas) return;
    if (weeklyStatsInstance) weeklyStatsInstance.destroy();

    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=${dias}`);
        if (!res.ok) return;
        const sesiones = await res.json();

        // Agrupar por semana
        const semanas = {};
        sesiones.forEach(s => {
            const d    = new Date(s.inicio);
            const lunes = new Date(d); lunes.setDate(d.getDate() - ((d.getDay()+6)%7));
            const key  = lunes.toISOString().split('T')[0];
            if (!semanas[key]) semanas[key] = { sesiones: 0, minutos: 0 };
            semanas[key].sesiones++;
            semanas[key].minutos += s.duracion_minutos || 0;
        });

        const sorted  = Object.keys(semanas).sort();
        const labels  = sorted.map(k => new Date(k).toLocaleDateString('es-ES', { day:'numeric', month:'short' }));
        const dataSes = sorted.map(k => semanas[k].sesiones);
        const dataMin = sorted.map(k => semanas[k].minutos);

        weeklyStatsInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Sesiones',  data: dataSes, backgroundColor: 'rgba(200,255,0,0.5)', borderRadius: 4, yAxisID: 'y' },
                    { label: 'Minutos',   data: dataMin, backgroundColor: 'rgba(77,166,255,0.4)', type: 'line', borderColor: '#4da6ff', tension: 0.4, yAxisID: 'y1' },
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#a0a0a0' } } },
                scales: {
                    y:  { beginAtZero: true, ticks: { color: '#a0a0a0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' }, position: 'left' },
                    y1: { beginAtZero: true, ticks: { color: '#4da6ff' }, grid: { display: false }, position: 'right' },
                    x:  { ticks: { color: '#a0a0a0' }, grid: { display: false } }
                }
            }
        });
    } catch (_) {}
}