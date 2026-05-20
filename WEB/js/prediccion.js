// ============================================================
// prediccion.js — Vitalia JC
// Predicción IA con regresión lineal simple sobre datos reales
// ============================================================

let trendChartInstance = null;
let currentObjetivo    = 'peso';
let sesionesData       = [];
let metricasData       = [];

document.addEventListener('DOMContentLoaded', () => {
    initPage('prediccion');
    loadData();
});

async function loadData() {
    const result = document.getElementById('predResult');
    result.innerHTML = '<p class="loading-text">Cargando datos…</p>';

    try {
        const [resSesiones, resMetricas] = await Promise.all([
            authFetch(`${API_URL}/sesiones/?dias_atras=90`),
            authFetch(`${API_URL}/metricas/?limit=50`),
        ]);

        sesionesData = resSesiones.ok ? await resSesiones.json() : [];
        metricasData = resMetricas.ok ? await resMetricas.json() : [];

        runAnalysis();
    } catch (_) {
        result.innerHTML = '<p style="color:#ff4444;text-align:center;padding:40px">Error al cargar datos</p>';
    }
}

function setObjetivo(obj) {
    currentObjetivo = obj;
    document.querySelectorAll('[data-obj]').forEach(b =>
        b.classList.toggle('active', b.dataset.obj === obj)
    );
    runAnalysis();
}

function runAnalysis() {
    switch (currentObjetivo) {
        case 'peso':        analizarPeso();        break;
        case 'musculo':     analizarMusculo();     break;
        case 'resistencia': analizarResistencia(); break;
        case 'habito':      analizarHabito();      break;
    }
    renderTrendChart();
    renderInsights();
}

// ── Regresión lineal simple ───────────────────────────────────
// Devuelve { pendiente, intercepto, r2 }
function regresionLineal(puntos) {
    const n = puntos.length;
    if (n < 2) return { pendiente: 0, intercepto: puntos[0]?.y || 0, r2: 0 };

    const sumX  = puntos.reduce((a, p) => a + p.x, 0);
    const sumY  = puntos.reduce((a, p) => a + p.y, 0);
    const sumXY = puntos.reduce((a, p) => a + p.x * p.y, 0);
    const sumX2 = puntos.reduce((a, p) => a + p.x * p.x, 0);

    const pendiente   = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercepto  = (sumY - pendiente * sumX) / n;

    // R²
    const mediaY = sumY / n;
    const ssTot  = puntos.reduce((a, p) => a + (p.y - mediaY) ** 2, 0);
    const ssRes  = puntos.reduce((a, p) => a + (p.y - (pendiente * p.x + intercepto)) ** 2, 0);
    const r2     = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

    return { pendiente, intercepto, r2 };
}

function diasHastaObjetivo(actual, objetivo, pendienteDiaria) {
    if (pendienteDiaria === 0) return null;
    const dias = (objetivo - actual) / pendienteDiaria;
    return dias > 0 ? Math.round(dias) : null;
}

// ── Análisis: Peso ────────────────────────────────────────────
function analizarPeso() {
    const result = document.getElementById('predResult');
    const conPeso = metricasData.filter(m => m.peso_kg).reverse();

    if (conPeso.length < 2) {
        result.innerHTML = renderNoData('Necesitas al menos 2 registros de peso en Métricas para analizar la tendencia.');
        return;
    }

    const inicio = new Date(conPeso[0].fecha_metrica).getTime();
    const puntos = conPeso.map(m => ({
        x: (new Date(m.fecha_metrica).getTime() - inicio) / 86400000,
        y: parseFloat(m.peso_kg)
    }));

    const { pendiente, intercepto, r2 } = regresionLineal(puntos);
    const pesoActual   = puntos[puntos.length - 1].y;
    const pesoInicial  = puntos[0].y;
    const cambioTotal  = pesoActual - pesoInicial;
    const tendencia    = pendiente < -0.02 ? 'bajando' : pendiente > 0.02 ? 'subiendo' : 'estable';

    // Proyección a 30 y 90 días
    const xActual  = puntos[puntos.length - 1].x;
    const peso30   = (pendiente * (xActual + 30) + intercepto).toFixed(1);
    const peso90   = (pendiente * (xActual + 90) + intercepto).toFixed(1);

    // Objetivo: bajar 5kg del peso actual
    const pesoObj  = (pesoActual - 5).toFixed(1);
    const diasObj  = pendiente < 0 ? diasHastaObjetivo(pesoActual, parseFloat(pesoObj), pendiente) : null;

    result.innerHTML = renderPredCard({
        emoji: '⚖️',
        titulo: 'Evolución del Peso',
        actual: `${pesoActual} kg`,
        tendencia,
        items: [
            { label: 'Cambio total registrado', value: `${cambioTotal >= 0 ? '+' : ''}${cambioTotal.toFixed(1)} kg` },
            { label: 'Ritmo actual',             value: `${(pendiente * 7).toFixed(2)} kg/semana` },
            { label: 'Proyección a 30 días',     value: `${peso30} kg` },
            { label: 'Proyección a 90 días',     value: `${peso90} kg` },
            { label: 'Fiabilidad del modelo',    value: `${(r2 * 100).toFixed(0)}%` },
        ],
        prediccion: diasObj
            ? `A tu ritmo actual, alcanzarías <strong>${pesoObj} kg</strong> en aproximadamente <strong>${diasObj} días</strong>.`
            : pendiente >= 0
            ? 'Tu peso está estable o en ligero aumento. Aumenta el déficit calórico para bajar peso.'
            : 'Con muy pocos datos no es posible proyectar. Sigue registrando tu peso.',
        color: pendiente < 0 ? '#c8ff00' : '#ffaa00',
    });
}

// ── Análisis: Músculo ─────────────────────────────────────────
function analizarMusculo() {
    const result = document.getElementById('predResult');
    if (sesionesData.length < 3) {
        result.innerHTML = renderNoData('Necesitas al menos 3 sesiones de entrenamiento registradas.');
        return;
    }

    const inicio  = new Date(sesionesData[sesionesData.length - 1].inicio).getTime();
    const puntos  = [...sesionesData].reverse().map((s, i) => ({
        x: (new Date(s.inicio).getTime() - inicio) / 86400000,
        y: s.calorias_quemadas || 0
    }));

    const { pendiente, r2 } = regresionLineal(puntos);
    const totalSesiones   = sesionesData.length;
    const totalMinutos    = sesionesData.reduce((a, s) => a + (s.duracion_minutos || 0), 0);
    const promedioMinutos = Math.round(totalMinutos / totalSesiones);
    const sesXSemana      = (totalSesiones / 13).toFixed(1); // 90 días = ~13 semanas

    // Proyección de sesiones
    const sesionesMes = Math.round(parseFloat(sesXSemana) * 4);
    const objetivo    = 4; // sesiones/semana para ganancia muscular óptima
    const diasObjetivo = parseFloat(sesXSemana) < objetivo
        ? Math.round(((objetivo - parseFloat(sesXSemana)) / 0.05) * 7)
        : 0;

    result.innerHTML = renderPredCard({
        emoji: '💪',
        titulo: 'Progreso de Entrenamiento',
        actual: `${sesXSemana} sesiones/semana`,
        tendencia: pendiente > 0 ? 'subiendo' : pendiente < 0 ? 'bajando' : 'estable',
        items: [
            { label: 'Total sesiones (90 días)',  value: totalSesiones },
            { label: 'Duración media',            value: `${promedioMinutos} min` },
            { label: 'Proyección próximo mes',    value: `${sesionesMes} sesiones` },
            { label: 'Fiabilidad del modelo',     value: `${(r2 * 100).toFixed(0)}%` },
        ],
        prediccion: diasObjetivo > 0
            ? `Para optimizar la ganancia muscular necesitas <strong>${objetivo} sesiones/semana</strong>. A tu ritmo actual lo alcanzarías en <strong>~${diasObjetivo} días</strong>.`
            : `¡Excelente frecuencia! Manteniendo <strong>${sesXSemana} sesiones/semana</strong> verás resultados significativos en 8-12 semanas.`,
        color: '#c8ff00',
    });
}

// ── Análisis: Resistencia ─────────────────────────────────────
function analizarResistencia() {
    const result = document.getElementById('predResult');
    if (sesionesData.length < 3) {
        result.innerHTML = renderNoData('Necesitas al menos 3 sesiones registradas.');
        return;
    }

    const inicio = new Date(sesionesData[sesionesData.length - 1].inicio).getTime();
    const puntos = [...sesionesData].reverse().map(s => ({
        x: (new Date(s.inicio).getTime() - inicio) / 86400000,
        y: s.duracion_minutos || 0
    })).filter(p => p.y > 0);

    const { pendiente, intercepto, r2 } = regresionLineal(puntos);
    const duracionActual = puntos[puntos.length - 1]?.y || 0;
    const xActual        = puntos[puntos.length - 1]?.x || 0;

    const dur30 = Math.max(0, pendiente * (xActual + 30) + intercepto).toFixed(0);
    const dur60 = Math.max(0, pendiente * (xActual + 60) + intercepto).toFixed(0);

    // Días para alcanzar 60 min de media
    const objetivo   = 60;
    const diasObj    = duracionActual < objetivo && pendiente > 0
        ? diasHastaObjetivo(duracionActual, objetivo, pendiente)
        : null;

    result.innerHTML = renderPredCard({
        emoji: '🏃',
        titulo: 'Resistencia y Duración',
        actual: `${duracionActual} min/sesión`,
        tendencia: pendiente > 0.1 ? 'subiendo' : pendiente < -0.1 ? 'bajando' : 'estable',
        items: [
            { label: 'Ritmo de mejora',        value: `${(pendiente * 7).toFixed(1)} min/semana` },
            { label: 'Proyección a 30 días',   value: `${dur30} min/sesión` },
            { label: 'Proyección a 60 días',   value: `${dur60} min/sesión` },
            { label: 'Fiabilidad del modelo',  value: `${(r2 * 100).toFixed(0)}%` },
        ],
        prediccion: diasObj
            ? `Alcanzarás sesiones de <strong>60 minutos</strong> de media en aproximadamente <strong>${diasObj} días</strong>.`
            : duracionActual >= objetivo
            ? `¡Ya superas los 60 min por sesión! Tu resistencia está en muy buen nivel.`
            : `Aumenta gradualmente la duración de tus sesiones para mejorar la resistencia.`,
        color: '#4da6ff',
    });
}

// ── Análisis: Hábito / Consistencia ──────────────────────────
function analizarHabito() {
    const result = document.getElementById('predResult');
    if (sesionesData.length < 2) {
        result.innerHTML = renderNoData('Necesitas más sesiones registradas para analizar tu consistencia.');
        return;
    }

    // Calcular días activos por semana en las últimas 4 y 8 semanas
    const hoy      = new Date(); hoy.setHours(0,0,0,0);
    const dias4    = new Set();
    const dias8    = new Set();

    sesionesData.forEach(s => {
        const d    = new Date(s.inicio);
        const diff = (hoy - d) / 86400000;
        const key  = d.toISOString().split('T')[0];
        if (diff <= 28) dias4.add(key);
        if (diff <= 56) dias8.add(key);
    });

    const diasSem4  = (dias4.size / 4).toFixed(1);
    const diasSem8  = (dias8.size / 8).toFixed(1);
    const mejora    = parseFloat(diasSem4) - parseFloat(diasSem8);
    const objetivo  = 5; // días/semana

    // Racha actual
    const diasConSesion = new Set(sesionesData.map(s => new Date(s.inicio).toISOString().split('T')[0]));
    let racha = 0;
    for (let i = 0; i < 60; i++) {
        const d = new Date(hoy); d.setDate(hoy.getDate() - i);
        if (diasConSesion.has(d.toISOString().split('T')[0])) racha++;
        else if (i > 0) break;
    }

    const diasParaObj = parseFloat(diasSem4) < objetivo && mejora > 0
        ? Math.round((objetivo - parseFloat(diasSem4)) / (mejora / 28) )
        : null;

    result.innerHTML = renderPredCard({
        emoji: '📋',
        titulo: 'Consistencia y Hábito',
        actual: `${diasSem4} días activos/semana`,
        tendencia: mejora > 0.2 ? 'subiendo' : mejora < -0.2 ? 'bajando' : 'estable',
        items: [
            { label: 'Últimas 4 semanas',        value: `${diasSem4} días/sem` },
            { label: 'Últimas 8 semanas',        value: `${diasSem8} días/sem` },
            { label: 'Tendencia',                value: `${mejora >= 0 ? '+' : ''}${mejora.toFixed(1)} días/sem` },
            { label: 'Racha actual',             value: `${racha} días` },
        ],
        prediccion: diasParaObj
            ? `A tu ritmo de mejora, alcanzarás <strong>${objetivo} días activos/semana</strong> en aproximadamente <strong>${diasParaObj} días</strong>.`
            : parseFloat(diasSem4) >= objetivo
            ? `¡Consistencia excelente! Manteniendo ${diasSem4} días/semana estás optimizando tu progreso.`
            : `Intenta añadir 1 día más de actividad por semana para mejorar tu consistencia.`,
        color: '#c8ff00',
    });
}

// ── Render helpers ────────────────────────────────────────────
function renderNoData(msg) {
    return `<div class="empty-state">
        <div class="empty-icon">📊</div>
        <p>${msg}</p>
    </div>`;
}

function renderPredCard({ emoji, titulo, actual, tendencia, items, prediccion, color }) {
    const tendIcon = tendencia === 'subiendo' ? '↑' : tendencia === 'bajando' ? '↓' : '→';
    const tendColor = tendencia === 'subiendo' ? '#c8ff00' : tendencia === 'bajando' ? '#4da6ff' : '#ffaa00';

    return `
        <div class="pred-card">
            <div class="pred-card-header">
                <div>
                    <div class="pred-card-title">${emoji} ${titulo}</div>
                    <div class="pred-card-actual">Valor actual: <strong style="color:${color}">${actual}</strong>
                        <span style="color:${tendColor};margin-left:8px;font-weight:700">${tendIcon} ${capitalize(tendencia)}</span>
                    </div>
                </div>
            </div>
            <div class="pred-items-grid">
                ${items.map(i => `
                    <div class="pred-item">
                        <span class="pred-item-label">${i.label}</span>
                        <span class="pred-item-value" style="color:${color}">${i.value}</span>
                    </div>`).join('')}
            </div>
            <div class="pred-prediccion">
                <span class="pred-ia-badge">🤖 IA</span>
                <p>${prediccion}</p>
            </div>
        </div>`;
}

// ── Gráfico de tendencia ──────────────────────────────────────
function renderTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas || !sesionesData.length) return;
    if (trendChartInstance) trendChartInstance.destroy();

    // Agrupar por semana
    const semanas = {};
    [...sesionesData].reverse().forEach(s => {
        const d    = new Date(s.inicio);
        const lun  = new Date(d); lun.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        const key  = lun.toISOString().split('T')[0];
        if (!semanas[key]) semanas[key] = 0;
        semanas[key]++;
    });

    const keys   = Object.keys(semanas).sort();
    const labels = keys.map(k => new Date(k).toLocaleDateString('es-ES', { day:'numeric', month:'short' }));
    const data   = keys.map(k => semanas[k]);

    // Línea de regresión
    const puntos = data.map((y, x) => ({ x, y }));
    const { pendiente, intercepto } = regresionLineal(puntos);
    const regData = data.map((_, x) => parseFloat((pendiente * x + intercepto).toFixed(2)));

    trendChartInstance = new Chart(canvas.getContext('2d'), {
        data: {
            labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Sesiones por semana',
                    data,
                    backgroundColor: 'rgba(200,255,0,0.35)',
                    borderRadius: 6,
                    order: 2,
                },
                {
                    type: 'line',
                    label: 'Tendencia (regresión lineal)',
                    data: regData,
                    borderColor: '#ff4da6',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    tension: 0,
                    order: 1,
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#a0a0a0' } } },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#a0a0a0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#a0a0a0' }, grid: { display: false } }
            }
        }
    });
}

// ── Insights automáticos ──────────────────────────────────────
function renderInsights() {
    const wrap = document.getElementById('insightsWrap');
    if (!wrap) return;

    const insights = [];

    // Insight: frecuencia
    if (sesionesData.length > 0) {
        const semanas = sesionesData.length / 13;
        if (semanas < 2) insights.push({ icon: '⚠️', text: 'Entrenas menos de 2 veces por semana. Para ver resultados reales necesitas al menos 3.', color: '#ffaa00' });
        else if (semanas >= 4) insights.push({ icon: '✅', text: `Excelente frecuencia de ${semanas.toFixed(1)} sesiones/semana. Estás en la zona óptima.`, color: '#c8ff00' });
    }

    // Insight: peso
    const conPeso = metricasData.filter(m => m.peso_kg);
    if (conPeso.length >= 2) {
        const diff = parseFloat(conPeso[0].peso_kg) - parseFloat(conPeso[conPeso.length - 1].peso_kg);
        if (diff > 1) insights.push({ icon: '📉', text: `Has perdido ${diff.toFixed(1)} kg desde tu primer registro. ¡Buen trabajo!`, color: '#c8ff00' });
        else if (diff < -1) insights.push({ icon: '📈', text: `Tu peso ha aumentado ${Math.abs(diff).toFixed(1)} kg. Revisa tu alimentación si tu objetivo es bajar peso.`, color: '#ffaa00' });
    }

    // Insight: estrés
    const conEstres = metricasData.filter(m => m.nivel_estres);
    if (conEstres.length > 0) {
        const mediaEstres = conEstres.reduce((a, m) => a + m.nivel_estres, 0) / conEstres.length;
        if (mediaEstres > 7) insights.push({ icon: '😰', text: `Nivel de estrés medio alto (${mediaEstres.toFixed(1)}/10). El estrés crónico dificulta la recuperación muscular.`, color: '#ff4444' });
    }

    // Insight: sueño
    const conSueno = metricasData.filter(m => m.horas_sueno != null);
    if (conSueno.length > 0) {
        const mediaSueno = conSueno.reduce((a, m) => a + m.horas_sueno, 0) / conSueno.length;
        if (mediaSueno < 7) insights.push({ icon: '😴', text: `Duermes una media de ${mediaSueno.toFixed(1)}h. Lo recomendado para recuperación es 7-9h.`, color: '#ffaa00' });
        else insights.push({ icon: '✅', text: `Tu media de sueño (${mediaSueno.toFixed(1)}h) es óptima para la recuperación.`, color: '#c8ff00' });
    }

    if (!insights.length) {
        wrap.innerHTML = '';
        return;
    }

    wrap.innerHTML = `
        <div class="chart-header" style="margin-bottom:16px"><h3>💡 INSIGHTS AUTOMÁTICOS</h3></div>
        <div class="insights-grid">
            ${insights.map(i => `
                <div class="insight-card" style="border-color:${i.color}22">
                    <span class="insight-icon">${i.icon}</span>
                    <p style="color:#e0e0e0;font-size:13px;line-height:1.6">${i.text}</p>
                </div>`).join('')}
        </div>`;
}

window.setObjetivo = setObjetivo;
window.runAnalysis = runAnalysis;