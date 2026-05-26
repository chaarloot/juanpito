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

    try { console.debug('setAuthMessage called', { targetId: target.id || null, type: typeof message, message }); } catch (e) {}

    let textoLimpio = '';

    // Si nos llega una cadena que contiene HTML + JSON (p. ej. DevTools copiado), intentar extraer JSON
    if (typeof message === 'string' && /<[^>]+>/.test(message)) {
        // buscar un objeto JSON o array JSON dentro del texto
        const startObj = message.indexOf('{');
        const endObj = message.lastIndexOf('}');
        const startArr = message.indexOf('[');
        const endArr = message.lastIndexOf(']');

        if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
            const jsonPart = message.slice(startObj, endObj + 1);
            try { message = JSON.parse(jsonPart); } catch (e) { message = message.replace(/<[^>]*>/g, '').trim(); }
        } else if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
            const jsonPart = message.slice(startArr, endArr + 1);
            try { message = JSON.parse(jsonPart); } catch (e) { message = message.replace(/<[^>]*>/g, '').trim(); }
        } else {
            // eliminar etiquetas HTML y dejar sólo texto
            message = message.replace(/<[^>]*>/g, '').trim();
        }
    }

    // 1. Si el mensaje está vacío o es nulo
    if (!message) {
        textoLimpio = '';
    }
    // 2. Si lo que llega es un Array de errores (múltiples campos)
    else if (Array.isArray(message)) {
        textoLimpio = message.map(err => {
            // cadenas simples
            if (typeof err === 'string') return err;

            // arrays dentro del array
            if (Array.isArray(err)) return err.map(String).join(' | ');

            // objetos: intentar extraer keys útiles
            if (typeof err === 'object' && err !== null) {
                // FastAPI-style: {loc: [...], msg: '...', type: '...'} -> prefijar campo
                const campo = err.loc && err.loc[1] ? err.loc[1] : null;
                if (campo && err.msg) {
                    const campoEsp = campo === 'password' ? 'Contraseña' : campo === 'nombre' ? 'Nombre' : campo === 'apellidos' ? 'Apellido' : campo === 'email' ? 'Correo' : campo;
                    const localized = localizeMessage(err.msg, campo);
                    const lower = (localized || '').toLowerCase();
                    if (lower.startsWith(campoEsp.toLowerCase()) || lower.startsWith('correo') || lower.startsWith('contraseña') || lower.startsWith('nombre') || lower.startsWith('apellido')) return localized;
                    return `${campoEsp}: ${localized}`;
                }

                if (err.msg) return localizeMessage(err.msg, (err.loc && err.loc[1]) ? err.loc[1] : null);
                if (err.message) return String(err.message);
                if (err.detail) {
                    if (typeof err.detail === 'string') return err.detail;
                    if (Array.isArray(err.detail)) return err.detail.map(d => formatDetailItem(d)).join(' | ');
                    return JSON.stringify(err.detail);
                }

                // Fallback: serializar el objeto para no mostrar [object Object]
                try { return JSON.stringify(err); } catch (e) { return String(err); }
            }

            return String(err);
        }).join(' | ');
    }
    // 3. Si lo que llega es un objeto
    else if (typeof message === 'object' && message !== null) {
        if (message.message) {
            textoLimpio = String(message.message);
        } else if (message.detail) {
            if (typeof message.detail === 'string') textoLimpio = message.detail;
            else if (Array.isArray(message.detail)) textoLimpio = message.detail.map(d => formatDetailItem(d)).join(' | ');
            else textoLimpio = JSON.stringify(message.detail);
        } else {
            textoLimpio = JSON.stringify(message);
        }
    }
    // 4. Si ya es una cadena de texto estándar
    else {
        textoLimpio = String(message);
    }

    // Tu lógica visual original para pintar el recuadro rojo
    target.textContent = textoLimpio;
    target.classList.remove('error', 'success');
    if (textoLimpio) {
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

// Evento: Enviar formulario de registro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('regName').value.trim();
    const apellidos = document.getElementById('regLastname').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const submitButton = registerForm.querySelector('button[type=\"submit\"]');

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
                
                // Si es un error 422 de FastAPI (Validación de esquemas Pydantic)
                if (response.status === 422 && errorData.detail && Array.isArray(errorData.detail)) {
                    errorMessage = errorData.detail.map(err => {
                        const campo = err.loc && err.loc[1] ? err.loc[1] : 'dato';
                        const campoEsp = campo === 'password' ? 'Contraseña' : 
                                         campo === 'nombre' ? 'Nombre' :
                                         campo === 'apellidos' ? 'Apellido' :
                                         campo === 'email' ? 'Correo' : campo;
                        const localized = localizeMessage(err.msg, campo);
                        const lower = (localized || '').toLowerCase();
                        if (lower.startsWith(campoEsp.toLowerCase()) || lower.startsWith('correo') || lower.startsWith('contraseña') || lower.startsWith('nombre') || lower.startsWith('apellido')) return localized;
                        return `${campoEsp}: ${localized}`;
                    }).join(' | ');
                } 
                // Si es un error controlado tuyo (como el HTTP 409 "Ya existe un usuario...")
                else if (errorData && errorData.detail) {
                    if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map(d => formatDetailItem(d)).join(' | ');
                    } else {
                        errorMessage = JSON.stringify(errorData.detail);
                    }
                }
            } catch (_) {
                const fallbackText = await response.text();
                if (fallbackText) errorMessage = fallbackText;
            }
            
            // PINTAMOS EL ERROR EXACTO DE FASTAPI DE MANERA INMEDIATA
            setAuthMessage(registerMessage, errorMessage, 'error');
            setFormLoading(registerForm, false, 'Registrarse');
            return; // Cortamos el flujo limpiamente aquí
        }
        
        await response.json();
        setAuthMessage(registerMessage, 'Cuenta creada. Ahora puedes iniciar sesión.', 'success');
        registerForm.reset();
        
        setTimeout(() => {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        }, 1500);

    } catch (error) {
        console.error('Register error original:', error);
        setAuthMessage(registerMessage, 'No se pudo conectar con el servidor backend.', 'error');
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

// Normaliza/traduce mensajes comunes de validación Pydantic/FastAPI
function localizeMessage(message, field) {
    if (!message) return '';
    const msg = String(message);
    const lower = msg.toLowerCase();

    // Email errors
    if (lower.includes('email') && (lower.includes('valid') || lower.includes('@') || lower.includes('correo') || lower.includes('address'))) {
        if (lower.includes('exactly one @') || lower.includes("must have exactly one @") || lower.includes('one @')) {
            return 'Correo electrónico no válido: debe contener una única @.';
        }
        return 'Correo electrónico no válido.';
    }

    // Password errors (mayúscula/minúscula/largo)
    if (field === 'password' || lower.includes('password') || lower.includes('contraseña')) {
        if (lower.includes('mayúscula') || lower.includes('uppercase') || lower.includes('mayus')) return 'debe contener al menos una letra mayúscula.';
        // detecta número mínimo en el mensaje (p. ej. 'ensure this value has at least 8 characters')
        const mmin = lower.match(/(at least|al menos) (\d+)|(?<!\d)(\d+) (characters|caracteres)/);
        if (mmin) {
            const n = (mmin[2] || mmin[3]);
            return `debe tener al menos ${n} caracteres.`;
        }
        // Fallback para casos que mencionan "8 characters"
        if (lower.includes('8') && lower.includes('characters')) return 'debe tener al menos 8 caracteres.';
        return msg.replace(/value error,?/i, '').trim();
    }

    // Name/surname
    if (field === 'nombre' || field === 'apellidos' || lower.includes('nombre') || lower.includes('apellidos') || lower.includes('name')) {
        if (lower.includes('at least') || lower.includes('al menos') || lower.includes('least')) {
            const m = lower.match(/(\d+)/);
            if (m) return `Nombre/Apellido: debe tener al menos ${m[1]} caracteres.`;
        }
        return msg;
    }

    // Default: devolver original, pero limpio
    return msg;
}

// Formatea un elemento del array `detail` de FastAPI (objeto o string)
function formatDetailItem(item) {
    if (!item) return '';
    if (typeof item === 'string') return item;
    if (typeof item === 'object') {
        const campo = item.loc && item.loc[1] ? item.loc[1] : null;
        if (campo && item.msg) {
            const campoEsp = campo === 'password' ? 'Contraseña' : campo === 'nombre' ? 'Nombre' : campo === 'apellidos' ? 'Apellido' : campo === 'email' ? 'Correo' : campo;
            const localized = localizeMessage(item.msg, campo);
            // evitar duplicar el prefijo si localizeMessage ya lo contiene
            const lower = (localized || '').toLowerCase();
            if (lower.startsWith(campoEsp.toLowerCase()) || lower.startsWith('correo') || lower.startsWith('contraseña') || lower.startsWith('nombre') || lower.startsWith('apellido')) return localized;
            return `${campoEsp}: ${localized}`;
        }
        if (item.msg) return localizeMessage(item.msg, campo || '');
        if (item.message) return String(item.message);
        if (item.detail) return Array.isArray(item.detail) ? item.detail.map(d => formatDetailItem(d)).join(' | ') : String(item.detail);
        return JSON.stringify(item);
    }
    return String(item);
}