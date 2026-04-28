function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'registro'));
  });
  document.getElementById('form-login').classList.toggle('active', tab === 'login');
  document.getElementById('form-registro').classList.toggle('active', tab === 'registro');
}

function togglePw(id, el) {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  el.style.color = inp.type === 'text' ? 'var(--accent)' : 'var(--muted)';
}

function selectNivel(el) {
  document.querySelectorAll('.nivel-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
}

function checkStrength(val) {
  const bars = [
    document.getElementById('sb1'),
    document.getElementById('sb2'),
    document.getElementById('sb3'),
    document.getElementById('sb4')
  ];
  const lbl = document.getElementById('strength-label');
  let score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const colors = ['#ff4f4f', '#ff9a3c', '#e8ff47', '#4caf7d'];
  const labels = ['Muy débil', 'Débil', 'Buena', 'Fuerte'];
  bars.forEach((b, i) => {
    b.style.background = i < score ? colors[score - 1] : 'var(--surface3)';
  });
  lbl.textContent = val.length === 0 ? 'Introduce una contraseña' : labels[score - 1] || 'Muy débil';
  lbl.style.color = score > 0 ? colors[score - 1] : 'var(--muted)';
}

function goToDashboard() {
  window.location.href = '../pages/VitaliaJC.html';
}