// CONFIGURACIÓN
const API_URL = 'http://127.0.0.1:8000';
let authToken = localStorage.getItem('token');
let refreshToken = localStorage.getItem('refreshToken');

// Elementos del DOM
const loginModal = document.getElementById('loginModal');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// Evento: Enviar formulario de login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });
        
        if (!response.ok) {
            throw new Error('Email o contraseña incorrectos');
        }
        
        const data = await response.json();
        authToken = data.access_token;
        refreshToken = data.refresh_token || data.access_token;
        
        localStorage.setItem('token', authToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        loginModal.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        loadUserData();
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Login error:', error);
    }
});

// Evento: Enviar formulario de registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('regName').value;
    const apellidos = document.getElementById('regLastname').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre,
                apellidos,
                email,
                password_hash: password,
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error en el registro');
        }
        
        const data = await response.json();
        alert('¡Cuenta creada exitosamente! Inicia sesión con tus credenciales.');
        
        // Limpiar formulario y volver a login
        registerForm.reset();
        toggleRegister({ preventDefault: () => {} });
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Register error:', error);
    }
});

// Cambiar entre login y registro
function toggleRegister(event) {
    event.preventDefault();
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    loginForm.reset();
    registerForm.reset();
}

// Cargar datos del usuario
async function loadUserData() {
    try {
        const response = await fetch(`${API_URL}/usuarios/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('No se pudo cargar los datos del usuario');
        }
        
        const user = await response.json();
        
        // Actualizar UI con datos del usuario
        const userName = document.getElementById('userName');
        const userPlan = document.getElementById('userPlan');
        const userAvatar = document.querySelector('.user-avatar');
        
        if (userName) userName.textContent = `${user.nombre} ${user.apellidos}`;
        if (userPlan) userPlan.textContent = 'Plan Pro • 3 meses';
        if (userAvatar) {
            const initials = (user.nombre.charAt(0) + user.apellidos.charAt(0)).toUpperCase();
            userAvatar.textContent = initials;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Botón logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    authToken = null;
    refreshToken = null;
    
    loginModal.classList.remove('hidden');
    mainApp.classList.add('hidden');
    
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    
    loginForm.reset();
    registerForm.reset();
});

// Verificar autenticación al cargar
if (authToken) {
    loginModal.classList.add('hidden');
    mainApp.classList.remove('hidden');
    loadUserData();
} else {
    loginModal.classList.remove('hidden');
    mainApp.classList.add('hidden');
}
