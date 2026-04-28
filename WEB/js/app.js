// NAVEGACIÓN
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remover clase active de todos los links
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Obtener página a mostrar
        const pageName = link.getAttribute('data-page');
        const page = document.getElementById(pageName + 'Page');
        
        // Ocultar todas las páginas
        pages.forEach(p => p.classList.remove('active'));
        
        // Mostrar página seleccionada
        page?.classList.add('active');
        
        // Cargar datos según la página
        if (pageName === 'dashboard') {
            loadDashboard();
        }
    });
});

// CARGAR DASHBOARD CON DATOS REALES
async function loadDashboard() {
    try {
        // Simular datos - En producción, obtendrías esto de la API
        const metrics = await fetchDashboardData();
        renderDashboard(metrics);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Obtener datos del dashboard de la API
async function fetchDashboardData() {
    try {
        // Obtener todas las métricas
        const metricsRes = await fetch(`${API_URL}/metricas/`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const metrics = await metricsRes.json();
        return metrics;
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return [];
    }
}

// Renderizar datos del dashboard
function renderDashboard(metrics) {
    // Calcular estadísticas
    const now = new Date();
    const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    // Formatear texto de semana
    const options = { month: 'long', day: 'numeric' };
    const weekText = `Semana del ${weekStart.toLocaleDateString('es-ES', options)} al ${weekEnd.toLocaleDateString('es-ES', options)}`;
    document.getElementById('weekInfo').textContent = weekText;
    
    // Datos simulados
    const trainingSessions = 18;
    const caloriesBurned = '9.4K';
    const activeMinutes = 312;
    const personalRecords = 7;
    const streakDays = 23;
    
    // Actualizar UI
    document.getElementById('trainingSessions').textContent = trainingSessions;
    document.getElementById('caloriesBurned').textContent = caloriesBurned;
    document.getElementById('activeMinutes').textContent = activeMinutes;
    document.getElementById('personalRecords').textContent = personalRecords;
    document.getElementById('streakDays').textContent = streakDays;
    
    // Renderizar gráfico semanal
    renderWeeklyChart();
}

// Gráfico semanal
function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const chart = new Chart(ctx, {
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
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: '#a0a0a0',
                        font: { size: 12 }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#a0a0a0',
                        font: { size: 12 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// EVENTOS
document.querySelector('.btn-new-training').addEventListener('click', () => {
    alert('Funcionalidad: Crear nuevo entrenamiento');
});

// Cargar datos al iniciar
if (!loginModal.classList.contains('hidden')) {
    loadDashboard();
}

// Re-cargar gráfico cuando se redimensiona la ventana
window.addEventListener('resize', () => {
    if (document.getElementById('dashboardPage').classList.contains('active')) {
        setTimeout(renderWeeklyChart, 100);
    }
});
