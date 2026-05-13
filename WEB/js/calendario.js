// ============================================================
// calendario.js — Vitalia JC
// ============================================================

let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth();

document.addEventListener('DOMContentLoaded', () => {
    initPage('calendario');
    renderCalendar();
    document.getElementById('btnPrevMonth')?.addEventListener('click', () => { changeMonth(-1); });
    document.getElementById('btnNextMonth')?.addEventListener('click', () => { changeMonth(1);  });
});

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
    if (currentMonth > 11) { currentMonth = 0;  currentYear++; }
    renderCalendar();
}

async function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const title = document.getElementById('calendarTitle');
    if (!grid) return;

    const monthName = new Date(currentYear, currentMonth, 1)
        .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    if (title) title.textContent = capitalize(monthName);

    grid.innerHTML = '<p class="loading-text">Cargando…</p>';

    // Sesiones del mes
    const diasSesion = new Map(); // day → [sesiones]
    try {
        const res = await authFetch(`${API_URL}/sesiones/?dias_atras=60`);
        if (res.ok) {
            const sesiones = await res.json();
            sesiones.forEach(s => {
                const d = new Date(s.inicio);
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    const day = d.getDate();
                    if (!diasSesion.has(day)) diasSesion.set(day, []);
                    diasSesion.get(day).push(s);
                }
            });
        }
    } catch (_) {}

    // Locales
    const local = JSON.parse(localStorage.getItem('vitaliaLocalWorkouts') || '[]');
    local.forEach(w => {
        const d = new Date(w.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const day = d.getDate();
            if (!diasSesion.has(day)) diasSesion.set(day, []);
            diasSesion.get(day).push({ tipo_entrenamiento: w.activity, duracion_minutos: parseWorkoutMinutes(w.duration), calorias_quemadas: w.calories });
        }
    });

    grid.innerHTML = '';

    // Cabeceras
    ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(d => {
        const h = document.createElement('div');
        h.className = 'calendar-day-header';
        h.textContent = d;
        grid.appendChild(h);
    });

    // Días vacíos
    const firstDow = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
    for (let i = 0; i < firstDow; i++) {
        const e = document.createElement('div');
        e.className = 'calendar-day empty';
        grid.appendChild(e);
    }

    const today       = new Date();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const el        = document.createElement('div');
        const isToday   = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
        const sessions  = diasSesion.get(day) || [];
        const hasSess   = sessions.length > 0;

        el.className = `calendar-day${hasSess ? ' has-session' : ''}${isToday ? ' today' : ''}`;
        el.innerHTML  = `
            <span class="cal-day-num">${day}</span>
            ${hasSess ? `<span class="cal-session-dot" title="${sessions.length} sesión(es)">💪</span>` : ''}`;

        if (hasSess) {
            el.addEventListener('click', () => showDayModal(day, sessions));
        }
        grid.appendChild(el);
    }

    // Resumen del mes
    setEl('monthSessions', diasSesion.size);
    let totalCal = 0, totalMin = 0;
    diasSesion.forEach(ss => {
        ss.forEach(s => { totalCal += s.calorias_quemadas || 0; totalMin += s.duracion_minutos || 0; });
    });
    setEl('monthCalories', formatCalories(totalCal));
    setEl('monthMinutes',  totalMin);
}

function showDayModal(day, sessions) {
    const fecha = new Date(currentYear, currentMonth, day)
        .toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });

    const rows = sessions.map(s => `
        <div class="session-row">
            <span class="session-type">${s.tipo_entrenamiento || 'Entrenamiento'}</span>
            <span class="session-dur">${s.duracion_minutos || 0} min</span>
            <span class="session-cal">${s.calorias_quemadas || 0} kcal</span>
        </div>`).join('');

    showInfoModal(`📅 ${capitalize(fecha)}`,
        `<div class="session-list">${rows}</div>`);
}

window.changeMonth = changeMonth;