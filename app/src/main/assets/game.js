(() => {
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);

const S = { menu: 0, play: 1, over: 2 };
let state = S.menu;
let ship, rocks, cores, stars, particles, score, lives, speed, spawnT, coreT, shake, best;
best = +(localStorage.getItem('neon_best') || 0);

const rnd = (a, b) => a + Math.random() * (b - a);

function reset() {
  ship = { x: W / 2, y: H * 0.78, tx: W / 2, ty: H * 0.78, r: Math.min(W, H) * 0.035, inv: 0 };
  rocks = []; cores = []; particles = [];
  stars = Array.from({ length: 70 }, () => ({ x: rnd(0, W), y: rnd(0, H), z: rnd(.3, 1) }));
  score = 0; lives = 3; speed = 1; spawnT = 0; coreT = 0; shake = 0;
}

function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = rnd(0, Math.PI * 2), s = rnd(.5, 4);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color });
  }
}

// input
let dragging = false;
function pos(e) {
  const t = e.touches ? e.touches[0] : e;
  const r = cv.getBoundingClientRect();
  return { x: t.clientX - r.left, y: t.clientY - r.top };
}
function down(e) { dragging = true; move(e); }
function move(e) {
  if (!dragging || state !== S.play) return;
  const p = pos(e);
  ship.tx = Math.max(ship.r, Math.min(W - ship.r, p.x));
  ship.ty = Math.max(H * 0.25, Math.min(H - ship.r, p.y));
  e.preventDefault();
}
function up() { dragging = false; }
cv.addEventListener('touchstart', down, { passive: false });
cv.addEventListener('touchmove', move, { passive: false });
cv.addEventListener('touchend', up);
cv.addEventListener('mousedown', down);
window.addEventListener('mousemove', move);
window.addEventListener('mouseup', up);

function spawnRock() {
  const r = rnd(Math.min(W, H) * 0.03, Math.min(W, H) * 0.075);
  rocks.push({ x: rnd(r, W - r), y: -r, r, vy: rnd(2.2, 3.8) * speed, vx: rnd(-.7, .7), rot: 0, vr: rnd(-.05, .05) });
}
function spawnCore() {
  const r = Math.min(W, H) * 0.025;
  cores.push({ x: rnd(r * 2, W - r * 2), y: -r, r, vy: rnd(2, 3) * speed, t: 0 });
}

function hit(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy < (a.r + b.r) * (a.r + b.r);
}

function update(dt) {
  stars.forEach(s => { s.y += s.z * 2.2 * speed; if (s.y > H) { s.y = 0; s.x = rnd(0, W); } });
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .05; p.life -= .025; });
  particles = particles.filter(p => p.life > 0);
  if (state !== S.play) return;

  ship.x += (ship.tx - ship.x) * .25;
  ship.y += (ship.ty - ship.y) * .25;
  if (ship.inv > 0) ship.inv -= dt;
  if (shake > 0) shake -= dt * 2;

  spawnT -= dt; coreT -= dt;
  if (spawnT <= 0) { spawnRock(); spawnT = Math.max(.25, .85 - speed * .09); }
  if (coreT <= 0) { spawnCore(); coreT = rnd(1.1, 2.4); }

  rocks.forEach(r => { r.y += r.vy; r.x += r.vx; r.rot += r.vr; });
  cores.forEach(c => { c.y += c.vy; c.t += dt; });

  for (const r of rocks) {
    if (ship.inv <= 0 && hit(ship, r)) {
      r.y = H + 999; lives--; ship.inv = 1.6; shake = 1;
      burst(ship.x, ship.y, '255,90,120', 26);
      if (lives <= 0) gameOver();
    }
  }
  for (const c of cores) {
    if (hit(ship, c)) {
      c.y = H + 999; score++;
      burst(c.x, c.y, '90,220,255', 14);
      speed = 1 + Math.floor(score / 10) * 0.18;
    }
  }
  rocks = rocks.filter(r => r.y < H + r.r * 2);
  cores = cores.filter(c => c.y < H + c.r * 2);
}

function drawShip() {
  if (ship.inv > 0 && Math.floor(ship.inv * 12) % 2) return;
  ctx.save(); ctx.translate(ship.x, ship.y);
  const r = ship.r;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.6);
  g.addColorStop(0, 'rgba(90,240,255,.45)'); g.addColorStop(1, 'rgba(90,240,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 2.6, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff9b3d';
  ctx.beginPath(); ctx.moveTo(-r * .4, r * .7); ctx.lineTo(r * .4, r * .7);
  ctx.lineTo(0, r * (1.3 + Math.random() * .6)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#eafcff'; ctx.strokeStyle = '#4df3ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -r * 1.2); ctx.lineTo(r, r * .9); ctx.lineTo(0, r * .45);
  ctx.lineTo(-r, r * .9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function render() {
  ctx.save();
  if (shake > 0) ctx.translate(rnd(-6, 6) * shake, rnd(-6, 6) * shake);
  ctx.fillStyle = '#05060f'; ctx.fillRect(-20, -20, W + 40, H + 40);
  stars.forEach(s => { ctx.fillStyle = `rgba(160,200,255,${.2 + s.z * .6})`; ctx.fillRect(s.x, s.y, 2, 2 + s.z * 3); });

  rocks.forEach(r => {
    ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
    ctx.fillStyle = '#ff456e'; ctx.shadowColor = '#ff456e'; ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2, rr = r.r * (i % 2 ? .78 : 1);
      ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  });

  cores.forEach(c => {
    const p = 1 + Math.sin(c.t * 8) * .15;
    ctx.save(); ctx.translate(c.x, c.y);
    ctx.fillStyle = '#5ae0ff'; ctx.shadowColor = '#5ae0ff'; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.arc(0, 0, c.r * p, 0, 7); ctx.fill(); ctx.restore();
  });

  particles.forEach(p => { ctx.fillStyle = `rgba(${p.color},${p.life})`; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); });

  if (state === S.play || state === S.over) drawShip();
  ctx.restore();

  if (state === S.play) {
    ctx.fillStyle = '#eaf6ff'; ctx.font = `bold ${Math.round(Math.min(W, H) * 0.06)}px sans-serif`;
    ctx.textAlign = 'left'; ctx.fillText(score, 18, 46);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff6b8a'; ctx.fillText('♥'.repeat(Math.max(lives, 0)), W - 18, 46);
  }
}

let last = performance.now();
function loop(t) {
  const dt = Math.min((t - last) / 1000, .05); last = t;
  update(dt); render(); requestAnimationFrame(loop);
}

const startScreen = document.getElementById('startScreen'),
      overScreen = document.getElementById('overScreen');

function startGame() {
  resize(); reset(); state = S.play;
  startScreen.classList.add('hidden'); overScreen.classList.add('hidden');
}
function gameOver() {
  state = S.over;
  if (score > best) { best = score; localStorage.setItem('neon_best', best); }
  document.getElementById('finalScore').textContent = 'Очки: ' + score;
  document.getElementById('bestScore').textContent = 'Рекорд: ' + best;
  overScreen.classList.remove('hidden');
}
document.getElementById('startBtn').onclick = startGame;
document.getElementById('againBtn').onclick = startGame;

resize(); reset(); requestAnimationFrame(loop);
})();
