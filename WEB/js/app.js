// API CONFIG
const API_URL = 'http://localhost:8000';
const authToken = localStorage.getItem('token') || '';

// Chart instances
let weeklyChartInstance = null;
let weightChartInstance = null;
let caloriesChartInstance = null;
let streakChartInstance = null;

// MOCK DATA (fallback)
const mockRoutines = [
    { id: 1, name: 'Push Day', description: 'Pecho, hombros y tríceps', exercises: 8, days: 'Lun/Jue', intensity: 'Alto' },
    { id: 2, name: 'Pull Day', description: 'Espalda y bíceps', exercises: 7, days: 'Mar/Vie', intensity: 'Alto' },
    { id: 3, name: 'Leg Day', description: 'Piernas y glúteos', exercises: 8, days: 'Mié/Sáb', intensity: 'Muy Alto' },
    { id: 4, name: 'Full Body', description: 'Cuerpo completo', exercises: 10, days: 'Lun-Vie', intensity: 'Medio' }
];

const mockExercises = [
    { id: 1, name: 'Press de Banca', series: '4x8', weight: '80kg', difficulty: 'Intermedio', muscle: 'Pecho' },
    { id: 2, name: 'Sentadillas', series: '4x10', weight: '100kg', difficulty: 'Avanzado', muscle: 'Piernas' },
    { id: 3, name: 'Peso Muerto', series: '3x5', weight: '140kg', difficulty: 'Avanzado', muscle: 'Espalda' },
    { id: 4, name: 'Flexiones', series: '3x12', weight: 'Bodyweight', difficulty: 'Básico', muscle: 'Pecho' },
    { id: 5, name: 'Dominadas', series: '3x8', weight: 'Bodyweight', difficulty: 'Intermedio', muscle: 'Espalda' },
    { id: 6, name: 'Curl de Bíceps', series: '3x12', weight: '15kg', difficulty: 'Básico', muscle: 'Brazos' },
    { id: 7, name: 'Extensiones de Tríceps', series: '3x15', weight: '12kg', difficulty: 'Básico', muscle: 'Brazos' },
    { id: 8, name: 'Leg Press', series: '4x12', weight: '200kg', difficulty: 'Intermedio', muscle: 'Piernas' }
];

const mockHistory = [
    { id: 1, date: '2024-01-15', activity: 'Push Day', details: 'Completado', duration: '65 min', calories: 450, status: 'completed' },
    { id: 2, date: '2024-01-14', activity: 'Cardio', details: 'Completado', duration: '30 min', calories: 280, status: 'completed' },
    { id: 3, date: '2024-01-13', activity: 'Pull Day', details: 'Completado', duration: '70 min', calories: 520, status: 'completed' },
    { id: 4, date: '2024-01-12', activity: 'Yoga', details: 'Completado', duration: '45 min', calories: 200, status: 'completed' },
    { id: 5, date: '2024-01-11', activity: 'Leg Day', details: 'Completado', duration: '75 min', calories: 580, status: 'completed' },
    { id: 6, date: '2024-01-10', activity: 'Full Body', details: 'Completado', duration: '55 min', calories: 420, status: 'completed' }
];

// ============ NAVEGACIÓN - INICIALIZAR EN DOMContentLoaded ============
function initializeNavigation() {
    console.log('✅ initializeNavigation - Inicializando navegación...');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    
    console.log('📍 navLinks encontrados:', navLinks.length);
    console.log('📍 pages encontrados:', pages.length);
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remover clase active de todos los links
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Obtener página a mostrar
            const pageName = link.getAttribute('data-page');
            const page = document.getElementById(pageName + 'Page');
            
            console.log('🔄 Navegando a:', pageName);
            console.log('📄 Página encontrada:', !!page, page?.id);
            
            // Ocultar todas las páginas
            pages.forEach(p => p.classList.remove('active'));
            
            // Mostrar página seleccionada
            if (page) {
                page.classList.add('active');
                console.log('✅ Página mostrada:', page.id);
            } else {
                console.error('❌ Página no encontrada:', pageName + 'Page');
            }
            
            // Cargar datos según la página
            switch(pageName) {
                case 'dashboard':
                    loadDashboard();
                    break;
                case 'routines':
                    loadRoutines();
                    break;
                case 'progress':
                    loadProgress();
                    break;
                case 'calendar':
                    loadCalendar();
                    break;
                case 'exercises':
                    loadExercises();
                    break;
                case 'stats':
                    loadStats();
                    break;
                case 'history':
                    loadHistory();
                    break;
            }
        });
    });
}

// ============ DASHBOARD ============
async function loadDashboard() {
    try {
        const now = new Date();
        const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        const options = { month: 'long', day: 'numeric' };
        const weekText = `Semana del ${weekStart.toLocaleDateString('es-ES', options)} al ${weekEnd.toLocaleDateString('es-ES', options)}`;
        const weekInfo = document.getElementById('weekInfo');
        if (weekInfo) weekInfo.textContent = weekText;
        
        // Obtener estadísticas reales de la API
        let stats = {
            trainingSessions: 18,
            caloriesBurned: '9.4K',
            activeMinutes: 312,
            personalRecords: 7,
            streakDays: 23
        };
        
        try {
            const response = await fetch(`${API_URL}/sesiones/stats/resumen?dias_atras=30`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (response.ok) {
                const apiStats = await response.json();
                stats = {
                    trainingSessions: apiStats.total_entrenamientos || 0,
                    caloriesBurned: (apiStats.total_calorias / 1000).toFixed(1) + 'K',
                    activeMinutes: apiStats.total_minutos || 0,
                    personalRecords: 7,
                    streakDays: 23
                };
            }
        } catch (apiError) {
            console.warn('Using fallback stats:', apiError);
        }
        
        // Actualizar UI
        if (document.getElementById('trainingSessions')) document.getElementById('trainingSessions').textContent = stats.trainingSessions;
        if (document.getElementById('caloriesBurned')) document.getElementById('caloriesBurned').textContent = stats.caloriesBurned;
        if (document.getElementById('activeMinutes')) document.getElementById('activeMinutes').textContent = stats.activeMinutes;
        if (document.getElementById('personalRecords')) document.getElementById('personalRecords').textContent = stats.personalRecords;
        if (document.getElementById('streakDays')) document.getElementById('streakDays').textContent = stats.streakDays;
        
        // Renderizar gráfico
        renderWeeklyChart();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    
    // Destruir gráfico anterior si existe
    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }
    
    const ctx = canvas.getContext('2d');
    
    weeklyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Minutos de Ejercicio',
                data: [45, 62, 0, 75, 58, 90, 0],
                backgroundColor: [
                    'rgba(200, 255, 0, 0.3)',
                    'rgba(200, 255, 0, 0.3)',
                    'rgba(100, 100, 100, 0.2)',
                    'rgba(200, 255, 0, 0.3)',
                    'rgba(200, 255, 0, 0.3)',
                    'rgba(200, 255, 0, 0.5)',
                    'rgba(100, 100, 100, 0.2)'
                ],
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
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#a0a0a0', font: { size: 12 } },
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false }
                },
                x: {
                    ticks: { color: '#a0a0a0', font: { size: 12 } },
                    grid: { display: false }
                }
            }
        }
    });
}

// ============ MIS RUTINAS ============
function loadRoutines() {
    const grid = document.querySelector('.routines-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    mockRoutines.forEach(routine => {
        const card = document.createElement('div');
        card.className = 'routine-card';
        card.innerHTML = `
            <h3>${routine.name}</h3>
            <p>${routine.description}</p>
            <div style="font-size: 0.9em; color: #a0a0a0; margin: 10px 0;">
                <div>Ejercicios: ${routine.exercises}</div>
                <div>Días: ${routine.days}</div>
                <div>Intensidad: ${routine.intensity}</div>
            </div>
            <button class="routine-btn" onclick="startRoutine(${routine.id})">Iniciar Rutina</button>
        `;
        grid.appendChild(card);
    });
}

function startRoutine(id) {
    const routine = mockRoutines.find(r => r.id === id);
    alert(`Iniciando: ${routine.name}`);
}

// ============ PROGRESO ============
function loadProgress() {
    renderWeightChart();
    renderCaloriesChart();
}

function renderWeightChart() {
    const canvas = document.getElementById('weightChart');
    if (!canvas) return;
    
    // Destruir gráfico anterior si existe
    if (weightChartInstance) {
        weightChartInstance.destroy();
    }
    
    weightChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8'],
            datasets: [{
                label: 'Peso (kg)',
                data: [78, 77.5, 77.2, 76.8, 76.5, 76.2, 75.8, 75.5],
                borderColor: '#c8ff00',
                backgroundColor: 'rgba(200, 255, 0, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#c8ff00',
                pointBorderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: '#a0a0a0' } } },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#a0a0a0' },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderCaloriesChart() {
    const canvas = document.getElementById('caloriesChart');
    if (!canvas) return;
    
    // Destruir gráfico anterior si existe
    if (caloriesChartInstance) {
        caloriesChartInstance.destroy();
    }
    
    caloriesChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Calorías Quemadas',
                data: [450, 520, 380, 580, 520, 650, 420],
                backgroundColor: 'rgba(200, 255, 0, 0.4)',
                borderColor: '#c8ff00',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: true, labels: { color: '#a0a0a0' } } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#a0a0a0' },
                    grid: { display: false }
                }
            }
        }
    });
}

// ============ CALENDARIO ============
function loadCalendar() {
    const grid = document.querySelector('.calendar-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Encabezados de días
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Calcular primeros dias vacios
    const firstDay = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    
    // Días del mes
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.innerHTML = `<span>${day}</span>`;
        
        if (Math.random() > 0.6) {
            dayElement.innerHTML += '<div class="workout-indicator">✓</div>';
        }
        
        dayElement.addEventListener('click', () => selectDay(day));
        grid.appendChild(dayElement);
    }
}

function selectDay(day) {
    alert(`Día seleccionado: ${day} de enero`);
}

// ============ EJERCICIOS ============
function loadExercises() {
    const list = document.querySelector('.exercises-list');
    if (!list) return;
    
    list.innerHTML = '';
    mockExercises.forEach(exercise => {
        const card = document.createElement('div');
        card.className = 'exercise-card';
        card.innerHTML = `
            <h4>${exercise.name}</h4>
            <p>${exercise.series}</p>
            <p style="font-size: 0.9em; color: #a0a0a0;">${exercise.weight} • ${exercise.difficulty}</p>
            <button onclick="addExerciseToWorkout(${exercise.id})">Agregar</button>
        `;
        list.appendChild(card);
    });
    
    // Search input
    const searchInput = document.getElementById('exerciseSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterExercises(e.target.value);
        });
    }
}

function filterExercises(query) {
    const cards = document.querySelectorAll('.exercise-card');
    cards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        card.style.display = title.includes(query.toLowerCase()) ? 'block' : 'none';
    });
}

function addExerciseToWorkout(id) {
    const exercise = mockExercises.find(e => e.id === id);
    alert(`${exercise.name} agregado al entrenamiento`);
}

// ============ ESTADÍSTICAS ============
function loadStats() {
    const stats = [
        { label: 'Total Entrenamientos', value: '42' },
        { label: 'Total Calorías', value: '18,450' },
        { label: 'Total Minutos', value: '2,340' },
        { label: 'Promedio Semanal', value: '6' }
    ];
    
    const container = document.querySelector('.stats-container');
    if (!container) return;
    
    container.innerHTML = '';
    stats.forEach(stat => {
        const box = document.createElement('div');
        box.className = 'stat-box';
        box.innerHTML = `<h3>${stat.value}</h3><p>${stat.label}</p>`;
        container.appendChild(box);
    });
}

// ============ HISTORIAL ============
async function loadHistory() {
    const list = document.querySelector('.history-list');
    if (!list) return;
    
    list.innerHTML = '<p style="text-align: center; color: #a0a0a0;">Cargando...</p>';
    
    try {
        const response = await fetch(`${API_URL}/sesiones/?dias_atras=90`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        let historyData = mockHistory;
        
        if (response.ok) {
            const apiData = await response.json();
            // Convertir datos API a formato de visualización
            historyData = apiData.map(s => ({
                id: s.sesion_id,
                date: new Date(s.inicio).toISOString().split('T')[0],
                activity: s.tipo_entrenamiento,
                details: 'Completado',
                duration: `${s.duracion_minutos || 0} min`,
                calories: s.calorias_quemadas || 0,
                status: 'completed'
            }));
        }
        
        list.innerHTML = '';
        if (historyData.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #a0a0a0;">Sin entrenamientos registrados</p>';
            return;
        }
        
        historyData.forEach(item => {
            const element = document.createElement('div');
            element.className = 'history-item';
            element.innerHTML = `
                <div class="history-date">${new Date(item.date).toLocaleDateString('es-ES')}</div>
                <div class="history-content">
                    <h4>${item.activity}</h4>
                    <p>${item.duration} • ${item.calories} calorías</p>
                </div>
            `;
            list.appendChild(element);
        });
    } catch (error) {
        console.error('Error loading history:', error);
        list.innerHTML = '<p style="text-align: center; color: #ff4444;">Error al cargar el historial</p>';
    }
}

// ============ NUEVO ENTRENAMIENTO ============
document.querySelector('.btn-new-training')?.addEventListener('click', showNewWorkoutModal);

function showNewWorkoutModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Nuevo Entrenamiento</h2>
                <button onclick="this.closest('.modal-backdrop').remove()" style="background: none; border: none; color: #c8ff00; cursor: pointer; font-size: 24px;">×</button>
            </div>
            <form onsubmit="saveWorkout(event)">
                <div class="form-group">
                    <label>Nombre del Entrenamiento</label>
                    <input type="text" required placeholder="Ej: Push Day">
                </div>
                <div class="form-group">
                    <label>Duración (minutos)</label>
                    <input type="number" required placeholder="60">
                </div>
                <div class="form-group">
                    <label>Calorías Estimadas</label>
                    <input type="number" required placeholder="450">
                </div>
                <div class="form-group">
                    <label>Intensidad</label>
                    <input type="range" min="1" max="10" value="5">
                    <span id="intensityValue">5</span>/10
                </div>
                <div class="form-group">
                    <label>Notas</label>
                    <textarea placeholder="Notas del entrenamiento..."></textarea>
                </div>
                <button type="submit" class="btn-primary">Guardar Entrenamiento</button>
                <button type="button" onclick="this.closest('.modal-backdrop').remove()" class="btn-secondary">Cancelar</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const intensityInput = modal.querySelector('input[type="range"]');
    intensityInput.addEventListener('input', (e) => {
        modal.querySelector('#intensityValue').textContent = e.target.value;
    });
}

function saveWorkout(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('input[type="text"]').value;
    const duration = parseInt(form.querySelector('input[type="number"]').value) || 60;
    const calories = parseInt(form.querySelectorAll('input[type="number"]')[1].value) || 450;
    const intensity = parseInt(form.querySelector('input[type="range"]').value) || 5;
    const notes = form.querySelector('textarea').value;
    
    // Enviar a la API
    fetch(`${API_URL}/sesiones/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tipo_entrenamiento: name,
            duracion_minutos: duration,
            calorias_quemadas: calories,
            nivel_intensidad: intensity,
            notas: notes
        })
    })
    .then(res => res.json())
    .then(data => {
        alert(`Entrenamiento "${name}" guardado exitosamente!`);
        form.closest('.modal-backdrop').remove();
        // Recargar historial si está visible
        if (document.getElementById('historyPage')?.classList.contains('active')) {
            loadHistory();
        }
    })
    .catch(error => {
        console.error('Error saving workout:', error);
        alert('Error al guardar el entrenamiento');
    });
}

// ============ INICIALIZACIÓN ============
window.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    if (loginModal && loginModal.classList.contains('hidden')) {
        loadDashboard();
    }
    
    // Inicializar navegación
    initializeNavigation();
    
    // Inicializar tabs para ejercicios hoy/entrenamientos
    initializeTabs();
});

// Initializar tabs
function initializeTabs() {
    const tabButtons = document.querySelectorAll('[data-tab]');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            const tabContainer = button.closest('[data-tab-container]');
            
            if (!tabContainer) return;
            
            // Remover active de todos los botones en este contenedor
            tabContainer.querySelectorAll('[data-tab]').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Agregar active al botón clickeado
            button.classList.add('active');
            
            // Filtrar contenido según el tab
            filterTableByStatus(tabName);
        });
    });
}

function filterTableByStatus(status) {
    const rows = document.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const statusCell = row.querySelector('td:last-child');
        if (status === 'todos') {
            row.style.display = '';
        } else if (status === 'completados') {
            row.style.display = statusCell?.textContent.includes('✓') ? '' : 'none';
        } else if (status === 'favoritos') {
            row.style.display = statusCell?.textContent.includes('⭐') ? '' : 'none';
        }
    });
}

// Re-renderizar gráficos al redimensionar
window.addEventListener('resize', () => {
    if (document.getElementById('dashboardPage')?.classList.contains('active')) {
        setTimeout(renderWeeklyChart, 100);
    }
});
