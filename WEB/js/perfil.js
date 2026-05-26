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

        setInput('pNombre',   u.nombre);
        setInput('pApellidos', u.apellidos);
        setInput('pEmail',    u.email);
        setInput('pFechaNac', u.fecha_nacimiento || '');
        setInput('pAltura',   u.altura_cm || '');
        setInput('pPeso',     u.peso_kg   || '');
        setInput('pZona',     u.zona_horaria || 'UTC');

        const generoEl = document.getElementById('pGenero');
        if (generoEl && u.genero) generoEl.value = u.genero;

        const avatar = document.getElementById('profileAvatar');
        if (avatar) avatar.textContent = (u.nombre[0] + u.apellidos[0]).toUpperCase();

        setEl('profileName',  `${u.nombre} ${u.apellidos}`);
        setEl('profileEmail', u.email);
        // El rol ya no es relevante en la UI — mostrar "Usuario" fijo
        setEl('profileRol',   'Usuario');
        setEl('profileSince', new Date(u.fecha_creacion).toLocaleDateString('es-ES', { month:'long', year:'numeric' }));

    } catch (_) { showToast('Error al cargar el perfil', 'error'); }

    loadProfileStats();
}

async function loadProfileStats() {
    try {
        const [resSesiones, resHabitos] = await Promise.all([
            authFetch(`${API_URL}/sesiones/stats/resumen?dias_atras=365`),
            authFetch(`${API_URL}/habitos/resumen/todos`),
        ]);
        if (resSesiones.ok) {
            const d = await resSesiones.json();
            setEl('profileTotalSessions', d.total_entrenamientos || 0);
            setEl('profileTotalCal',      formatCalories(d.total_calorias || 0));
            setEl('profileTotalMin',      d.total_minutos || 0);
        }
        if (resHabitos.ok) {
            const h = await resHabitos.json();
            setEl('profileHabitos',        h.length);
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
    const current = document.getElementById('pwActual')?.value;
    const newPw   = document.getElementById('pwNueva')?.value;
    const confirm = document.getElementById('pwConfirm')?.value;

    if (!current || !newPw || !confirm) {
        showToast('Rellena todos los campos', 'error'); return;
    }
    if (newPw !== confirm) {
        showToast('Las contraseñas no coinciden', 'error'); return;
    }
    if (newPw.length < 8) {
        showToast('Mínimo 8 caracteres', 'error'); return;
    }

    // Verificar contraseña actual haciendo login
    try {
        const email = document.getElementById('pEmail')?.value;
        const checkRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(current)}`
        });

        if (!checkRes.ok) {
            showToast('La contraseña actual es incorrecta', 'error');
            return;
        }

        // Contraseña actual correcta → actualizar con la nueva
        // El endpoint PUT /usuarios/me acepta password en el body
        const updateRes = await authFetch(`${API_URL}/usuarios/me`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPw })
        });

        if (updateRes.ok) {
            showToast('✓ Contraseña cambiada correctamente');
            document.getElementById('passwordForm')?.reset();
        } else {
            const d = await updateRes.json().catch(() => ({}));
            showToast(d.detail || 'Error al cambiar la contraseña', 'error');
        }

    } catch (_) {
        showToast('Error de conexión', 'error');
    }
}

function confirmDeleteAccount() {
    removeModal('deleteModal');
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop'; modal.id = 'deleteModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;text-align:center">
            <div style="font-size:48px;margin-bottom:16px">⚠️</div>
            <h2 style="color:#ff4444;margin-bottom:12px">Eliminar cuenta</h2>
            <p style="color:#a0a0a0;margin-bottom:24px">Esta acción es <strong style="color:#ff4444">irreversible</strong>. Se eliminarán todos tus datos.</p>
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
    (async () => {
        try {
            const res = await authFetch(`${API_URL}/usuarios/me`, { method: 'DELETE' });
            if (!res.ok && res.status !== 204) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'No se pudo eliminar la cuenta');
            }

            clearAuthSession();
            removeModal('deleteModal');
            showToast('Cuenta eliminada correctamente');
            window.location.href = 'login.html';
        } catch (error) {
            removeModal('deleteModal');
            showToast(error.message || 'No se pudo eliminar la cuenta', 'error');
        }
    })();
}

function setInput(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
}

window.savePerfil           = savePerfil;
window.changePassword       = changePassword;
window.confirmDeleteAccount = confirmDeleteAccount;
window.deleteAccount        = deleteAccount;