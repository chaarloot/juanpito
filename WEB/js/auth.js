// CONFIGURACIÓN
const API_URL = 'http://127.0.0.1:8000';
let authToken = localStorage.getItem('token');
let refreshToken = localStorage.getItem('refreshToken');

// Elementos del DOM
const loginModal = document.getElementById('loginModal');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');

function saveAuthSession(data) {
    authToken = data.access_token;
    refreshToken = data.refresh_token || data.access_token;

    localStorage.setItem('token', authToken);
    localStorage.setItem('refreshToken', refreshToken);
}

function setAuthMessage(target, message, type = 'error') {
    if (!target) return;
    target.textContent = message;
    target.classList.remove('error', 'success');
    if (message) {
        target.classList.add(type);
    }
}

function setFormLoading(form, isLoading, loadingText) {
    const submitButton = form?.querySelector('button[type="submit"]');
    if (!submitButton) return;

    submitButton.disabled = isLoading;
    submitButton.classList.toggle('is-loading', isLoading);
    submitButton.textContent = isLoading ? loadingText : submitButton.dataset.defaultText;
}

function clearAuthSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    authToken = null;
    refreshToken = null;
}

function showLoginScreen() {
    loginModal.classList.remove('hidden');
    mainApp.classList.add('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    setAuthMessage(loginMessage, '');
    setAuthMessage(registerMessage, '');
}

function showMainApp() {
    loginModal.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

async function refreshAuthSession() {
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_URL}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
            method: 'POST',
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        saveAuthSession(data);
        return true;
    } catch (error) {
        console.error('Error refreshing session:', error);
        return false;
    }
}

async function authFetch(url, options = {}) {
    const requestOptions = {
        ...options,
        headers: new Headers(options.headers || {}),
    };

    if (authToken) {
        requestOptions.headers.set('Authorization', `Bearer ${authToken}`);
    }

    let response = await fetch(url, requestOptions);

    if (response.status === 401 && refreshToken) {
        const refreshed = await refreshAuthSession();

        if (refreshed) {
            requestOptions.headers.set('Authorization', `Bearer ${authToken}`);
            response = await fetch(url, requestOptions);
        } else {
            clearAuthSession();
            showLoginScreen();
        }
    }

    return response;
}

window.authFetch = authFetch;
window.refreshAuthSession = refreshAuthSession;
window.clearAuthSession = clearAuthSession;
window.saveAuthSession = saveAuthSession;
window.showLoginScreen = showLoginScreen;
window.showMainApp = showMainApp;

// Evento: Enviar formulario de login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const submitButton = loginForm.querySelector('button[type="submit"]');

    setAuthMessage(loginMessage, '');
    setFormLoading(loginForm, true, 'Entrando...');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        });

        if (!response.ok) {
            let errorMessage = 'Email o contraseña incorrectos';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (_) {
                const fallbackText = await response.text();
                if (fallbackText) errorMessage = fallbackText;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        saveAuthSession(data);
        showMainApp();
        setAuthMessage(loginMessage, 'Sesión iniciada correctamente', 'success');
        
        await loadUserData();
    } catch (error) {
        setAuthMessage(loginMessage, error.message || 'No se pudo iniciar sesión');
        console.error('Login error:', error);
    } finally {
        setFormLoading(loginForm, false, 'Iniciar Sesión');
        if (submitButton) submitButton.dataset.defaultText = 'Iniciar Sesión';
    }
});

// Evento: Enviar formulario de registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('regName').value.trim();
    const apellidos = document.getElementById('regLastname').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const submitButton = registerForm.querySelector('button[type="submit"]');

    setAuthMessage(registerMessage, '');
    setFormLoading(registerForm, true, 'Creando...');
    
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
                password: password,
                fecha_nacimiento: null,
                genero: null,
                altura_cm: null,
                peso_kg: null,
                zona_horaria: 'UTC'
            })
        });
        
        if (!response.ok) {
            let errorMessage = 'Error en el registro';
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } catch (_) {
                const fallbackText = await response.text();
                if (fallbackText) errorMessage = fallbackText;
            }
            throw new Error(errorMessage);
        }
        
        await response.json();
        setAuthMessage(registerMessage, 'Cuenta creada. Ahora puedes iniciar sesión.', 'success');
        registerForm.reset();
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } catch (error) {
        setAuthMessage(registerMessage, error.message || 'No se pudo completar el registro');
        console.error('Register error:', error);
    } finally {
        setFormLoading(registerForm, false, 'Registrarse');
        if (submitButton) submitButton.dataset.defaultText = 'Registrarse';
    }
});

// Cambiar entre login y registro
function toggleRegister(event) {
    event.preventDefault();
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    loginForm.reset();
    registerForm.reset();
    setAuthMessage(loginMessage, '');
    setAuthMessage(registerMessage, '');
}

// Cargar datos del usuario
async function loadUserData() {
    try {
        const response = await authFetch(`${API_URL}/usuarios/me`);
        
        if (!response.ok) {
            if (response.status === 401) {
                clearAuthSession();
                showLoginScreen();
            }
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
    clearAuthSession();
    showLoginScreen();
    
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    setAuthMessage(loginMessage, '');
    setAuthMessage(registerMessage, '');
    
    loginForm.reset();
    registerForm.reset();
});

// Verificar autenticación al cargar
if (loginForm) {
    const loginButton = loginForm.querySelector('button[type="submit"]');
    if (loginButton) loginButton.dataset.defaultText = loginButton.textContent.trim();
}

if (registerForm) {
    const registerButton = registerForm.querySelector('button[type="submit"]');
    if (registerButton) registerButton.dataset.defaultText = registerButton.textContent.trim();
}

if (authToken) {
    showMainApp();
    loadUserData();
} else {
    showLoginScreen();
}
