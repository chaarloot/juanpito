// ============================================================
// ejercicios.js — Vitalia JC
// ============================================================

const EJERCICIOS = [
    { id:1,  name:'Press de Banca',         grupo:'Pecho',    series:'4×8',   peso:'80 kg',    dif:'Intermedio', desc:'Ejercicio principal para pecho. Tumbado en banco, baja la barra hasta el pecho y empuja.' },
    { id:2,  name:'Sentadilla',             grupo:'Piernas',  series:'4×10',  peso:'100 kg',   dif:'Avanzado',   desc:'Rey de los ejercicios. Mantén la espalda recta y rodillas alineadas con los pies.' },
    { id:3,  name:'Peso Muerto',            grupo:'Espalda',  series:'3×5',   peso:'140 kg',   dif:'Avanzado',   desc:'Trabajas cadena posterior completa. Core apretado y espalda neutra en todo momento.' },
    { id:4,  name:'Flexiones',              grupo:'Pecho',    series:'3×12',  peso:'Corporal', dif:'Básico',     desc:'Clásico de peso corporal. Codos a 45° del cuerpo, baja hasta casi tocar el suelo.' },
    { id:5,  name:'Dominadas',              grupo:'Espalda',  series:'3×8',   peso:'Corporal', dif:'Intermedio', desc:'Mejor ejercicio para espalda ancha. Agarre pronado o supinado según objetivo.' },
    { id:6,  name:'Curl de Bíceps',         grupo:'Brazos',   series:'3×12',  peso:'15 kg',    dif:'Básico',     desc:'Aísla el bíceps. Codos pegados al cuerpo, sube controlado y baja lento.' },
    { id:7,  name:'Extensiones Tríceps',    grupo:'Brazos',   series:'3×15',  peso:'12 kg',    dif:'Básico',     desc:'Trabaja la cabeza larga del tríceps. Puedes hacerlo con polea, mancuerna o barra.' },
    { id:8,  name:'Leg Press',              grupo:'Piernas',  series:'4×12',  peso:'200 kg',   dif:'Intermedio', desc:'Complemento a la sentadilla. Permite mayor carga con menos fatiga de core.' },
    { id:9,  name:'Press Militar',          grupo:'Hombros',  series:'4×8',   peso:'60 kg',    dif:'Intermedio', desc:'Desarrolla hombros y tríceps. Puede hacerse sentado o de pie, con barra o mancuernas.' },
    { id:10, name:'Remo con Barra',         grupo:'Espalda',  series:'4×8',   peso:'80 kg',    dif:'Intermedio', desc:'Masa para espalda media. Torso inclinado 45°, tira de la barra hacia el ombligo.' },
    { id:11, name:'Zancadas',               grupo:'Piernas',  series:'3×12',  peso:'20 kg',    dif:'Básico',     desc:'Trabaja cuádriceps y glúteos unilateralmente. Mantén el torso erguido.' },
    { id:12, name:'Plancha',                grupo:'Core',     series:'3×60s', peso:'Corporal', dif:'Básico',     desc:'Fundamental para el core. Cuerpo recto como una tabla, sin hundir las caderas.' },
    { id:13, name:'Hip Thrust',             grupo:'Glúteos',  series:'4×12',  peso:'80 kg',    dif:'Intermedio', desc:'El mejor ejercicio para glúteos. Empuja con los talones y aprieta arriba.' },
    { id:14, name:'Aperturas con Cable',    grupo:'Pecho',    series:'3×15',  peso:'20 kg',    dif:'Básico',     desc:'Aísla pecho con tensión constante. Mantén una leve flexión en los codos.' },
    { id:15, name:'Face Pull',              grupo:'Hombros',  series:'3×15',  peso:'25 kg',    dif:'Básico',     desc:'Salud de hombros y deltoides posteriores. Imprescindible para compensar el press.' },
    { id:16, name:'Fondos en Paralelas',    grupo:'Pecho',    series:'3×10',  peso:'Corporal', dif:'Intermedio', desc:'Pecho inferior y tríceps. Inclínate hacia adelante para enfatizar pecho.' },
    { id:17, name:'Elevaciones Laterales',  grupo:'Hombros',  series:'4×15',  peso:'10 kg',    dif:'Básico',     desc:'Amplitud de hombros. Sube hasta la altura del hombro, no más.' },
    { id:18, name:'Prensa de Pantorrillas', grupo:'Piernas',  series:'4×20',  peso:'80 kg',    dif:'Básico',     desc:'Trabaja gemelos con alto volumen. Rango completo de movimiento.' },
    { id:19, name:'Crunch Abdominal',       grupo:'Core',     series:'3×20',  peso:'Corporal', dif:'Básico',     desc:'Básico para abdominales. No lleves el cuello, contrae el abdomen.' },
    { id:20, name:'Jalón al Pecho',         grupo:'Espalda',  series:'4×10',  peso:'70 kg',    dif:'Básico',     desc:'Alternativa a dominadas. Tira hacia el pecho, no hacia la nuca.' },
];

const GRUPOS = ['Todos','Pecho','Espalda','Piernas','Brazos','Hombros','Glúteos','Core'];
const DIFS   = ['Todas','Básico','Intermedio','Avanzado'];

document.addEventListener('DOMContentLoaded', () => {
    initPage('ejercicios');
    renderFiltros();
    renderEjercicios();
    document.getElementById('exSearch')?.addEventListener('input', renderEjercicios);
});

function renderFiltros() {
    const grupoWrap = document.getElementById('filtroGrupo');
    const difWrap   = document.getElementById('filtroDif');

    if (grupoWrap) {
        grupoWrap.innerHTML = GRUPOS.map(g =>
            `<button class="filter-chip ${g==='Todos'?'active':''}" data-grupo="${g}" onclick="setFiltroGrupo('${g}')">${g}</button>`
        ).join('');
    }
    if (difWrap) {
        difWrap.innerHTML = DIFS.map(d =>
            `<button class="filter-chip ${d==='Todas'?'active':''}" data-dif="${d}" onclick="setFiltroDif('${d}')">${d}</button>`
        ).join('');
    }
}

function setFiltroGrupo(g) {
    document.querySelectorAll('[data-grupo]').forEach(b => b.classList.toggle('active', b.dataset.grupo === g));
    renderEjercicios();
}
function setFiltroDif(d) {
    document.querySelectorAll('[data-dif]').forEach(b => b.classList.toggle('active', b.dataset.dif === d));
    renderEjercicios();
}

function renderEjercicios() {
    const grid    = document.getElementById('ejerciciosGrid');
    if (!grid) return;

    const q     = (document.getElementById('exSearch')?.value || '').toLowerCase();
    const grupo = document.querySelector('[data-grupo].active')?.dataset.grupo || 'Todos';
    const dif   = document.querySelector('[data-dif].active')?.dataset.dif     || 'Todas';

    const filtered = EJERCICIOS.filter(e =>
        (grupo === 'Todos' || e.grupo === grupo) &&
        (dif   === 'Todas' || e.dif   === dif)   &&
        (!q || e.name.toLowerCase().includes(q) || e.grupo.toLowerCase().includes(q))
    );

    setEl('exCount', filtered.length);

    if (!filtered.length) {
        grid.innerHTML = '<p style="color:#888;text-align:center;padding:40px;grid-column:1/-1">No se encontraron ejercicios</p>';
        return;
    }

    const difColor = { Básico: '#4da6ff', Intermedio: '#c8ff00', Avanzado: '#ff4444' };

    grid.innerHTML = filtered.map(e => `
        <div class="ejercicio-card">
            <div class="ejercicio-header">
                <span class="ejercicio-grupo">${e.grupo}</span>
                <span class="ejercicio-dif" style="color:${difColor[e.dif]}">${e.dif}</span>
            </div>
            <div class="ejercicio-name">${e.name}</div>
            <div class="ejercicio-meta">
                <span>📊 ${e.series}</span>
                <span>⚖️ ${e.peso}</span>
            </div>
            <div class="ejercicio-desc">${e.desc}</div>
            <button class="btn-primary" style="width:100%;margin-top:12px;padding:9px" onclick="addToWorkout('${e.name.replace(/'/g,"\\'")}')">
                + Añadir a entrenamiento
            </button>
        </div>`).join('');
}

function addToWorkout(name) {
    showToast(`✓ "${name}" añadido`);
}

window.setFiltroGrupo = setFiltroGrupo;
window.setFiltroDif   = setFiltroDif;
window.addToWorkout   = addToWorkout;