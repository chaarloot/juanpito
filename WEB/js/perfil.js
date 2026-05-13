// ============================================================
// perfil.js — Vitalia JC
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    initPage('perfil');
    loadPerfil();
    document.getElementById('profileForm')?.addEventListener('submit', savePerfil);
    document.getElementById('passwordForm')?.addEventListener('submit', changePassword);
});

async function loadPerfil() {
    try {
        const res = await authFetch(`${API_URL}/usuarios/me`);
        if (!res.ok) throw new Error();
        const u = await res.json();

        // Rellenar formulario
        setInput('pNombre',   u.nombre);
        setInput('pApellidos', u.apellidos);
        setInput('pEmail',    u.email);
        setInput('pFechaNac', u.fecha_nacimiento || '');
        setInput('pAltura',   u.altura_cm || '');
        setInput('pPeso',     u.peso_kg   || '');
        setInput('pZona',     u.zona_horaria || 'UTC');

        // Género
        const generoEl = document.getElementById('pGenero');
        if (generoEl && u.genero) generoEl.value = u.genero;

        // Avatar
        const avatar = document.getElementById('profileAvatar');
        if (avatar) {
            avatar.textContent = (u.nombre[0] + u.apellidos[0]).toUpperCase();
        }

        // Info sidebar
        setEl('profileName',  `${u.nombre} ${u.apellidos}`);
        setEl('profileEmail', u.email);
        setEl('profileRol',   capitalize(u.rol));
        setEl('profileSince', new Date(u.fecha_creacion).toLocaleDateString('es-ES', { month:'long', year:'numeric' }));

    } catch (_) { showToast('Error al cargar el perfil', 'error'); }

    // Estadísticas del usuario
    loadProfileStats();
}

async function loadProfileStats() {
    try {
        const [resSesiones, resHabitos, resMetricas] = await Promise.all([
            authFetch(`${API_URL}/sesiones/stats/resumen?dias_atras=365`),
            authFetch(`${API_URL}/habitos/resumen/todos`),
            authFetch(`${API_URL}/metricas/?limit=1`),
        ]);

        if (resSesiones.ok) {
            const d = await resSesiones.json();
            setEl('profileTotalSessions', d.total_entrenamientos || 0);
            setEl('profileTotalCal',      formatCalories(d.total_calorias || 0));
            setEl('profileTotalMin',      d.total_minutos || 0);
        }
        if (resHabitos.ok) {
            const h = await resHabitos.json();
            setEl('profileHabitos', h.length);
            setEl('profileHabitosActivos', h.filter(x => x.estado === 'activo').length);
        }
    } catch (_) {}
}

async function savePerfil(e) {
    e.preventDefault();
    const body = {
        nombre:           document.getElementById('pNombre')?.value.trim(),
        apellidos:        document.getElementById('pApellidos')?.value.trim(),
        fecha_nacimiento: document.getElementById('pFechaNac')?.value || null,
        genero:           document.getElementById('pGenero')?.value   || null,
        altura_cm:        parseFloatOrNull('pAltura'),
        peso_kg:          parseFloatOrNull('pPeso'),
        zona_horaria:     document.getElementById('pZona')?.value || 'UTC',
    };
    try {
        const res = await authFetch(`${API_URL}/usuarios/me`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error();
        showToast('✓ Perfil actualizado');
        loadPerfil();
    } catch (_) { showToast('Error al guardar el perfil', 'error'); }
}

async function changePassword(e) {
    e.preventDefault();
    const current  = document.getElementById('pwActual')?.value;
    const newPw    = document.getElementById('pwNueva')?.value;
    const confirm  = document.getElementById('pwConfirm')?.value;

    if (!current || !newPw) { showToast('Rellena todos los campos', 'error'); return; }
    if (newPw !== confirm)  { showToast('Las contraseñas no coinciden', 'error'); return; }
    if (newPw.length < 6)   { showToast('Mínimo 6 caracteres', 'error'); return; }

    // El backend no tiene endpoint de cambio de contraseña con verificación,
    // usamos el PUT /usuarios/me con password_hash (si el schema lo permite)
    // Por ahora mostramos aviso informativo
    showToast('Función disponible próximamente', 'error');
}

function confirmDeleteAccount() {
    removeModal('deleteModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop'; modal.id = 'deleteModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;text-align:center">
            <div style="font-size:48px;margin-bottom:16px">⚠️</div>
            <h2 style="color:#ff4444;margin-bottom:12px">Eliminar cuenta</h2>
            <p style="color:#a0a0a0;margin-bottom:24px">Esta acción es <strong style="color:#ff4444">irreversible</strong>. Se eliminarán todos tus datos, sesiones, hábitos y métricas.</p>
            <p style="color:#a0a0a0;margin-bottom:20px">Escribe <strong style="color:#fff">ELIMINAR</strong> para confirmar:</p>
            <input id="deleteConfirmInput" type="text" placeholder="ELIMINAR" style="width:100%;margin-bottom:16px">
            <div style="display:flex;gap:10px">
                <button class="btn-secondary" style="flex:1" onclick="removeModal('deleteModal')">Cancelar</button>
                <button class="btn-primary" style="flex:1;background:#ff4444;border-color:#ff4444;color:#fff" onclick="deleteAccount()">Eliminar cuenta</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) removeModal('deleteModal'); });
}

function deleteAccount() {
    const val = document.getElementById('deleteConfirmInput')?.value;
    if (val !== 'ELIMINAR') { showToast('Escribe ELIMINAR para confirmar', 'error'); return; }
    showToast('Función no disponible en esta versión', 'error');
    removeModal('deleteModal');
}

function setInput(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
}

window.savePerfil           = savePerfil;
window.changePassword       = changePassword;
window.confirmDeleteAccount = confirmDeleteAccount;
window.deleteAccount        = deleteAccount;