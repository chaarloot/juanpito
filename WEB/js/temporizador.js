// ============================================================
// temporizador.js — Vitalia JC
// ============================================================

// Estado global del timer
let timerState = {
    mode:        'libre',   // libre | tabata | hiit | descanso
    running:     false,
    interval:    null,
    elapsed:     0,         // segundos transcurridos (modo libre)
    countdown:   0,         // segundos restantes (modos intervalos)
    phase:       'work',    // work | rest
    round:       1,
    totalRounds: 8,
    workTime:    20,
    restTime:    10,
    totalTime:   60,        // modo descanso
    log:         [],
};

const MODES = {
    libre:    { workTime: 0,  restTime: 0,  rounds: 0,  totalTime: 0  },
    tabata:   { workTime: 20, restTime: 10, rounds: 8,  totalTime: 0  },
    hiit:     { workTime: 40, restTime: 20, rounds: 5,  totalTime: 0  },
    descanso: { workTime: 0,  restTime: 0,  rounds: 0,  totalTime: 90 },
};

// Sonidos con Web Audio API
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    return audioCtx;
}

function beep(freq = 880, duration = 0.15, type = 'sine') {
    try {
        const ctx = getAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (_) {}
}

function beepStart()  { beep(660, 0.1); setTimeout(() => beep(880, 0.2), 120); }
function beepEnd()    { beep(440, 0.1); setTimeout(() => beep(330, 0.3), 120); }
function beepFinish() {
    [0, 150, 300, 450].forEach((d, i) =>
        setTimeout(() => beep(880 + i * 110, 0.2), d)
    );
}

// ── Inicializar ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initPage('temporizador');
    setMode('libre');
});

function setMode(mode) {
    resetTimer();
    timerState.mode = mode;

    // Actualizar botones
    document.querySelectorAll('.timer-mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });

    // Aplicar preset
    const preset = MODES[mode];
    timerState.workTime    = preset.workTime;
    timerState.restTime    = preset.restTime;
    timerState.totalRounds = preset.rounds;
    timerState.totalTime   = preset.totalTime;
    timerState.round       = 1;
    timerState.phase       = 'work';

    // Renderizar configuración
    renderConfig(mode);
    updateDisplay();
}

function renderConfig(mode) {
    const cfg = document.getElementById('timerConfig');
    if (!cfg) return;

    if (mode === 'libre') {
        cfg.innerHTML = '';
        return;
    }

    if (mode === 'descanso') {
        cfg.innerHTML = `
            <div class="timer-cfg-grid">
                <div class="timer-cfg-item">
                    <label>Tiempo de descanso (seg)</label>
                    <div class="timer-cfg-controls">
                        <button onclick="adjustTime('totalTime',-15)">−15</button>
                        <span id="cfgTotal">${timerState.totalTime}s</span>
                        <button onclick="adjustTime('totalTime',15)">+15</button>
                    </div>
                </div>
            </div>`;
        return;
    }

    // tabata / hiit
    cfg.innerHTML = `
        <div class="timer-cfg-grid">
            <div class="timer-cfg-item">
                <label>⚡ Trabajo (seg)</label>
                <div class="timer-cfg-controls">
                    <button onclick="adjustTime('workTime',-5)">−5</button>
                    <span id="cfgWork">${timerState.workTime}s</span>
                    <button onclick="adjustTime('workTime',5)">+5</button>
                </div>
            </div>
            <div class="timer-cfg-item">
                <label>😮‍💨 Descanso (seg)</label>
                <div class="timer-cfg-controls">
                    <button onclick="adjustTime('restTime',-5)">−5</button>
                    <span id="cfgRest">${timerState.restTime}s</span>
                    <button onclick="adjustTime('restTime',5)">+5</button>
                </div>
            </div>
            <div class="timer-cfg-item">
                <label>🔄 Rondas</label>
                <div class="timer-cfg-controls">
                    <button onclick="adjustTime('totalRounds',-1)">−1</button>
                    <span id="cfgRounds">${timerState.totalRounds}</span>
                    <button onclick="adjustTime('totalRounds',1)">+1</button>
                </div>
            </div>
        </div>`;
}

function adjustTime(key, delta) {
    const min = key === 'totalRounds' ? 1 : 5;
    timerState[key] = Math.max(min, timerState[key] + delta);
    const map = { workTime: 'cfgWork', restTime: 'cfgRest', totalRounds: 'cfgRounds', totalTime: 'cfgTotal' };
    const el = document.getElementById(map[key]);
    if (el) el.textContent = key === 'totalRounds' ? timerState[key] : timerState[key] + 's';
    updateDisplay();
}

// ── Controles ─────────────────────────────────────────────────
function toggleTimer() {
    if (timerState.running) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    timerState.running = true;
    document.getElementById('btnStart').textContent = '⏸ Pausar';

    // Inicializar countdown si no está corriendo
    if (timerState.mode === 'libre') {
        // Modo libre: contar hacia arriba
        timerState.interval = setInterval(() => {
            timerState.elapsed++;
            updateDisplay();
        }, 1000);
    } else if (timerState.mode === 'descanso') {
        if (timerState.countdown === 0) timerState.countdown = timerState.totalTime;
        timerState.interval = setInterval(tickCountdown, 1000);
    } else {
        // tabata / hiit
        if (timerState.countdown === 0) {
            timerState.phase = 'work';
            timerState.countdown = timerState.workTime;
            beepStart();
        }
        timerState.interval = setInterval(tickInterval, 1000);
    }
}

function pauseTimer() {
    timerState.running = false;
    clearInterval(timerState.interval);
    document.getElementById('btnStart').textContent = '▶ Continuar';
}

function resetTimer() {
    timerState.running   = false;
    timerState.elapsed   = 0;
    timerState.countdown = 0;
    timerState.round     = 1;
    timerState.phase     = 'work';
    clearInterval(timerState.interval);
    document.getElementById('btnStart').textContent = '▶ Iniciar';
    updateDisplay();
}

function skipPhase() {
    if (timerState.mode === 'libre' || timerState.mode === 'descanso') return;
    nextPhase();
}

function tickCountdown() {
    timerState.countdown--;
    updateDisplay();
    if (timerState.countdown <= 3 && timerState.countdown > 0) beep(660, 0.1);
    if (timerState.countdown <= 0) {
        beepFinish();
        addLog('Descanso completado', timerState.totalTime);
        pauseTimer();
        resetTimer();
    }
}

function tickInterval() {
    timerState.countdown--;
    updateDisplay();

    // Pitidos de cuenta atrás
    if (timerState.countdown <= 3 && timerState.countdown > 0) beep(660, 0.08);

    if (timerState.countdown <= 0) {
        nextPhase();
    }
}

function nextPhase() {
    if (timerState.phase === 'work') {
        // Pasar a descanso
        addLog(`Ronda ${timerState.round} — Trabajo`, timerState.workTime);
        timerState.phase = 'rest';
        timerState.countdown = timerState.restTime;
        beepEnd();
    } else {
        // Fin de ronda
        timerState.round++;
        if (timerState.round > timerState.totalRounds) {
            // Serie completa
            beepFinish();
            addLog('🏆 Serie completa', timerState.totalRounds * (timerState.workTime + timerState.restTime));
            pauseTimer();
            resetTimer();
            showToast('🏆 ¡Serie completada!');
            return;
        }
        timerState.phase = 'work';
        timerState.countdown = timerState.workTime;
        beepStart();
    }
    updateDisplay();
}

// ── Display ───────────────────────────────────────────────────
function updateDisplay() {
    const phaseEl = document.getElementById('timerPhase');
    const timeEl  = document.getElementById('timerTime');
    const roundEl = document.getElementById('timerRound');
    const ring    = document.getElementById('timerRingFill');

    const CIRCUMFERENCE = 628; // 2 * PI * 100

    if (timerState.mode === 'libre') {
        if (phaseEl) phaseEl.textContent = timerState.running ? 'ENTRENANDO' : 'LISTO';
        if (timeEl)  timeEl.textContent  = formatSecs(timerState.elapsed);
        if (roundEl) roundEl.textContent = '';
        if (ring)    ring.style.strokeDashoffset = '0';
        setRingColor('work');
        return;
    }

    if (timerState.mode === 'descanso') {
        const total = timerState.totalTime || 1;
        const pct   = timerState.countdown / total;
        if (phaseEl) phaseEl.textContent = 'DESCANSO';
        if (timeEl)  timeEl.textContent  = formatSecs(timerState.countdown || total);
        if (roundEl) roundEl.textContent = '';
        if (ring)    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - pct);
        setRingColor('rest');
        return;
    }

    // tabata / hiit
    const isWork  = timerState.phase === 'work';
    const total   = isWork ? timerState.workTime : timerState.restTime;
    const current = timerState.countdown || total;
    const pct     = current / (total || 1);

    if (phaseEl) phaseEl.textContent = isWork ? '⚡ TRABAJO' : '😮‍💨 DESCANSO';
    if (timeEl)  timeEl.textContent  = formatSecs(current);
    if (roundEl) roundEl.textContent = `Ronda ${timerState.round} / ${timerState.totalRounds}`;
    if (ring)    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - pct);
    setRingColor(timerState.phase);
}

function setRingColor(phase) {
    const ring = document.getElementById('timerRingFill');
    if (!ring) return;
    ring.style.stroke = phase === 'work' ? '#c8ff00' : phase === 'rest' ? '#4da6ff' : '#888';
}

function formatSecs(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

// ── Log ───────────────────────────────────────────────────────
function addLog(label, secs) {
    const now = new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    timerState.log.unshift({ label, secs, time: now });
    renderLog();
}

function renderLog() {
    const log = document.getElementById('timerLog');
    if (!log) return;
    if (!timerState.log.length) {
        log.innerHTML = '<p style="color:#888;text-align:center;padding:20px">Las rondas completadas aparecerán aquí</p>';
        return;
    }
    log.innerHTML = timerState.log.map(e => `
        <div class="timer-log-item">
            <span class="log-label">${e.label}</span>
            <span class="log-dur">${formatSecs(e.secs)}</span>
            <span class="log-time">${e.time}</span>
        </div>`).join('');
}

function clearLog() {
    timerState.log = [];
    renderLog();
}

window.setMode     = setMode;
window.adjustTime  = adjustTime;
window.toggleTimer = toggleTimer;
window.resetTimer  = resetTimer;
window.skipPhase   = skipPhase;
window.clearLog    = clearLog;