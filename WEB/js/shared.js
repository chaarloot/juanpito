// ============================================================
// shared.js  —  Vitalia JC
// Funciones comunes a todas las páginas
// ============================================================

const API_URL = 'http://127.0.0.1:8000';

// ── Auth helpers ─────────────────────────────────────────────
function getToken()        { return localStorage.getItem('token'); }
function getRefreshToken() { return localStorage.getItem('refreshToken'); }

function clearAuthSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'login.html';
    }
}

async function refreshAuthSession() {
    const rt = getRefreshToken();
    if (!rt) return false;
    try {
        const res = await fetch(`${API_URL}/auth/refresh?refresh_token=${encodeURIComponent(rt)}`, { method: 'POST' });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token || data.access_token);
        return true;
    } catch (_) { return false; }
}

async function authFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const token   = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        const ok = await refreshAuthSession();
        if (ok) {
            headers.set('Authorization', `Bearer ${getToken()}`);
            res = await fetch(url, { ...options, headers });
        } else {
            clearAuthSession();
            window.location.href = 'login.html';
        }
    }
    return res;
}

// Exponer globalmente
window.authFetch = authFetch;
window.API_URL   = API_URL;

// ── Page name → path mapping ─────────────────────────────────
const PAGE_MAP = {
    dashboard:   'dashboard.html',
    habitos:     'habitos.html',
    progreso:    'progreso.html',
    calendario:  'calendario.html',
    metricas:    'metricas.html',
    medicacion:  'medicacion.html',
    ejercicios:  'ejercicios.html',
    historial:   'historial.html',
    perfil:      'perfil.html',
    temporizador: 'temporizador.html',
    prediccion:          'prediccion.html',
    'rutina-aleatoria': 'rutina-aleatoria.html',
};

// ── Sidebar ──────────────────────────────────────────────────
const SIDEBAR_LINKS = [
    { section: 'PRINCIPAL', links: [
        { key: 'dashboard',    icon: '🏠', label: 'Dashboard'   },
        { key: 'habitos',      icon: '📋', label: 'Mis Hábitos' },
        { key: 'progreso',     icon: '📊', label: 'Progreso'    },
        { key: 'metricas',     icon: '📏', label: 'Métricas'    },
        { key: 'calendario',   icon: '📅', label: 'Calendario'  },
        { key: 'medicacion',   icon: '💊', label: 'Medicación'  },
    ]},
    { section: 'ENTRENAMIENTO', links: [
        { key: 'ejercicios',       icon: '💪', label: 'Ejercicios'       },
        { key: 'historial',        icon: '📜', label: 'Historial'        },
        { key: 'temporizador',     icon: '⏱', label: 'Temporizador'     },
        { key: 'prediccion',       icon: '📉', label: 'Predicción'       },
        { key: 'rutina-aleatoria', icon: '🔀', label: 'Rutina Aleatoria' },
        { key: 'perfil',           icon: '👤', label: 'Mi Perfil'        },
    ]},
];

function renderSidebar(activePage) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    const sectionsHtml = SIDEBAR_LINKS.map(({ section, links }) => `
        <div class="nav-section">
            <h3>${section}</h3>
            ${links.map(({ key, icon, label }) => `
                <a href="${PAGE_MAP[key]}"
                   class="nav-link ${key === activePage ? 'active' : ''}"
                   data-page="${key}">
                    ${icon} ${label}
                    ${key === 'medicacion' ? '<span id="alertsBadge" class="alerts-badge" style="display:none"></span>' : ''}
                </a>`).join('')}
        </div>`).join('');

    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="logo">
                <span class="logo-text">VITALIA<strong>JC</strong></span>
                <span class="logo-subtitle">TRAINING TRACKER</span>
            </div>
        </div>
        <nav class="sidebar-nav">${sectionsHtml}</nav>
        <div class="sidebar-footer">
            <div class="user-card">
                <div class="user-avatar" id="userAvatar">JC</div>
                <div class="user-info">
                    <p id="userName" class="user-name">Cargando…</p>
                    <p id="userPlan" class="user-plan">Plan Pro</p>
                </div>
            </div>
            <button id="logoutBtn" class="btn-logout">🚪 Salir</button>
        </div>`;

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        clearAuthSession();
        window.location.href = 'login.html';
    });

    // Cargar datos usuario
    loadSidebarUser();
    loadAlertsBadge();

    // Hacer avatar/nombre clicables: ir a perfil; logo lleva al dashboard
    setTimeout(() => {
        const userCard = document.querySelector('.user-card');
        const avatarEl = document.getElementById('userAvatar');
        const nameEl = document.getElementById('userName');
        const logoEl = document.querySelector('.logo');

        [userCard, avatarEl, nameEl].forEach(el => {
            if (!el) return;
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => { window.location.href = 'perfil.html'; });
        });

        if (logoEl) {
            logoEl.style.cursor = 'pointer';
            logoEl.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
        }
    }, 50);
}

async function loadSidebarUser() {
    try {
        const res = await authFetch(`${API_URL}/usuarios/me`);
        if (!res.ok) return;
        const u = await res.json();
        const name   = document.getElementById('userName');
        const avatar = document.getElementById('userAvatar');
        if (name)   name.textContent = `${u.nombre} ${u.apellidos}`;
        if (avatar) avatar.textContent = (u.nombre[0] + u.apellidos[0]).toUpperCase();
    } catch (_) {}
}

async function loadAlertsBadge() {
    try {
        const res = await authFetch(`${API_URL}/alertas/?solo_no_leidas=true&limit=99`);
        if (!res.ok) return;
        const alertas = await res.json();
        const badge   = document.getElementById('alertsBadge');
        if (!badge) return;
        badge.textContent   = alertas.length || '';
        badge.style.display = alertas.length > 0 ? 'inline-flex' : 'none';
    } catch (_) {}
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    let t = document.getElementById('vitaliaToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'vitaliaToast';
        t.style.cssText = 'position:fixed;bottom:30px;right:30px;z-index:9999;padding:14px 22px;border-radius:10px;font-size:14px;font-weight:600;transition:opacity .3s;max-width:320px;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.4)';
        document.body.appendChild(t);
    }
    t.textContent       = msg;
    t.style.background  = type === 'error' ? 'rgba(255,68,68,.93)' : 'rgba(200,255,0,.93)';
    t.style.color       = type === 'error' ? '#fff' : '#000';
    t.style.opacity     = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => { t.style.opacity = '0'; }, 3200);
}
window.showToast = showToast;

// ── Modal helpers ─────────────────────────────────────────────
function removeModal(id) { document.getElementById(id)?.remove(); }
window.removeModal = removeModal;

function showInfoModal(title, bodyHtml) {
    removeModal('infoModal');
    const m = document.createElement('div');
    m.className = 'modal-backdrop'; m.id = 'infoModal';
    m.innerHTML = `
        <div class="modal-content" style="max-width:420px">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close" onclick="removeModal('infoModal')">×</button>
            </div>
            <div style="margin-top:10px">${bodyHtml}</div>
            <button class="btn-secondary" style="width:100%;margin-top:20px" onclick="removeModal('infoModal')">Cerrar</button>
        </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) removeModal('infoModal'); });
}
window.showInfoModal = showInfoModal;

// ── General utils ─────────────────────────────────────────────
function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }
function formatCalories(n) { n = Number(n)||0; return n >= 1000 ? (n/1000).toFixed(1)+'K' : String(n); }
function parseWorkoutMinutes(dur) { const n=parseInt(String(dur||'').replace(/[^0-9]/g,''),10); return isFinite(n)?n:0; }
function parseFloatOrNull(id) { const v=parseFloat(document.getElementById(id)?.value); return isNaN(v)?null:v; }
function parseIntOrNull(id)   { const v=parseInt(document.getElementById(id)?.value);   return isNaN(v)?null:v; }
function formatFrecuencia(f) {
    return { una_vez_dia:'1×/día', dos_veces_dia:'2×/día', tres_veces_dia:'3×/día',
             semanal:'Semanal', segun_necesidad:'Según necesidad', personalizado:'Personalizado',
             diario:'Diario', mensual:'Mensual' }[f] || f;
}
function setEl(id, val) { const e=document.getElementById(id); if(e) e.textContent=val; }
function parseDisplayedCalories(text) {
    text = String(text||'').trim();
    if (text.toUpperCase().endsWith('K')) return Math.round(parseFloat(text)*1000)||0;
    return parseInt(text.replace(/[^0-9]/g,''),10)||0;
}

window.capitalize          = capitalize;
window.formatCalories      = formatCalories;
window.parseWorkoutMinutes = parseWorkoutMinutes;
window.parseFloatOrNull    = parseFloatOrNull;
window.parseIntOrNull      = parseIntOrNull;
window.formatFrecuencia    = formatFrecuencia;
window.setEl               = setEl;
window.parseDisplayedCalories = parseDisplayedCalories;

// ── Page shell builder ────────────────────────────────────────
// Cada página llama a initPage(activePage) en su DOMContentLoaded
function initPage(activePage) {
    requireAuth();
    renderSidebar(activePage);
}
window.initPage = initPage;