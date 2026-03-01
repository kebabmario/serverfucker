let edition = 'java';

function setEdition(ed) {
  edition = ed;
  document.getElementById('javaBtn').classList.toggle('active', ed === 'java');
  document.getElementById('bedrockBtn').classList.toggle('active', ed === 'bedrock');
}

document.getElementById('serverInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') checkServer();
});

async function checkServer() {
  const input = document.getElementById('serverInput').value.trim();
  const resultEl = document.getElementById('result');
  const errorEl = document.getElementById('error');
  const loaderEl = document.getElementById('loader');
  const btn = document.querySelector('.check-btn');

  resultEl.classList.add('hidden');
  errorEl.classList.add('hidden');

  if (!input) {
    // Shake the input if empty
    const inputEl = document.getElementById('serverInput');
    inputEl.classList.remove('shake');
    void inputEl.offsetWidth; // reflow to restart animation
    inputEl.classList.add('shake');
    showError('you entered nothing');
    return;
  }

  // Button launch animation
  btn.classList.remove('launching');
  void btn.offsetWidth;
  btn.classList.add('launching');
  btn.disabled = true;

  // Cycle through funny loading texts
  const funnyTexts = [
    'pinging ur server hold on...',
    'knocking on the server door...',
    'bribing the server to respond...',
    'asking nicely...',
    'yelling at ur server...',
    'throwing packets at it...',
  ];
  const loaderSpan = loaderEl.querySelector('span');
  loaderSpan.textContent = funnyTexts[Math.floor(Math.random() * funnyTexts.length)];

  loaderEl.classList.remove('hidden');

  const apiBase = edition === 'bedrock'
    ? `https://api.mcsrvstat.us/bedrock/3/${encodeURIComponent(input)}`
    : `https://api.mcsrvstat.us/3/${encodeURIComponent(input)}`;

  try {
    const res = await fetch(apiBase);
    if (!res.ok) throw new Error('API request failed.');
    const data = await res.json();
    loaderEl.classList.add('hidden');
    btn.disabled = false;
    renderResult(input, data);
  } catch (err) {
    loaderEl.classList.add('hidden');
    btn.disabled = false;
    showError('Could not reach the API. Check your connection and try again.');
  }
}

function renderResult(address, data) {
  const resultEl = document.getElementById('result');
  const isOnline = data.online === true;

  // MOTD
  let motd = 'no description either lol';
  if (isOnline && data.motd && data.motd.clean && data.motd.clean.length > 0) {
    motd = data.motd.clean.join('\n');
  }

  // Players
  let players = '—';
  if (isOnline && data.players !== undefined) {
    players = `${data.players.online ?? 0} / ${data.players.max ?? 0}`;
  }

  // Version
  let version = '—';
  if (isOnline && data.version) {
    version = data.version;
  }

  // Logo
  const logoHTML = (isOnline && data.icon)
    ? `<img class="server-logo" src="${data.icon}" alt="server logo" />`
    : `<div class="no-logo">no logo btw</div>`;

  resultEl.innerHTML = `
    <div class="logo-row">
      ${logoHTML}
      <div class="logo-info">
        <div class="result-header">
          <span class="server-name">${escapeHTML(address)}</span>
          <span class="status-badge ${isOnline ? 'online' : 'offline'}">
            <span class="dot"></span>
            ${isOnline ? 'yo its working' : 'ur shit isnt working'}
          </span>
        </div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">players on rn</span>
        <span class="info-value">${escapeHTML(players)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">version</span>
        <span class="info-value">${escapeHTML(version)}</span>
      </div>
    </div>
    <div class="info-item">
      <span class="info-label">description</span>
      <div class="motd-box">${escapeHTML(motd)}</div>
    </div>
  `;

  resultEl.classList.remove('hidden');
}

function showError(msg) {
  const errorEl = document.getElementById('error');
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

(() => {
  const canvas = document.getElementById("galaxyCanvas");
  if (!canvas) throw new Error('Missing <canvas id="galaxyCanvas"></canvas>');
  const ctx = canvas.getContext("2d", { alpha: true });

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let W = 0, H = 0, CX = 0, CY = 0, GALAXY_RADIUS = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    CX = W / 2;
    CY = H / 2;
    GALAXY_RADIUS = Math.min(W, H) * 0.55;

    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  const STAR_COUNT = 900;
  const DUST_COUNT = 2800;
  const ARM_COUNT = 4;

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function spiralPoint(t, arm, radiusScale = 1) {
    const r = Math.pow(t, 0.7) * GALAXY_RADIUS * radiusScale;
    const twist = 8.0;
    const baseAngle = (arm / ARM_COUNT) * Math.PI * 2;
    const angle = baseAngle + t * twist + rand(-0.25, 0.25);
    return { x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r };
  }

  function makeStar() {
    const t = Math.random();
    const arm = Math.floor(Math.random() * ARM_COUNT);
    const p = spiralPoint(t, arm, 1);

    const spread = (0.6 + t * 2.2);
    const nx = rand(-spread, spread);
    const ny = rand(-spread, spread);

    const size = rand(0.6, 1.8) * (1 - t * 0.5);
    const alpha = rand(0.25, 0.95) * (1 - t * 0.25);

    const cool = clamp(1 - t * 0.9, 0, 1);
    const col = {
      r: Math.floor(200 + 45 * (1 - cool) + rand(-10, 10)),
      g: Math.floor(215 + 30 * (1 - cool) + rand(-10, 10)),
      b: Math.floor(255 - 30 * (1 - cool) + rand(-10, 10)),
    };

    const x = p.x + nx * 10;
    const y = p.y + ny * 10;

    return {
      x, y,
      size,
      alpha,
      tw: rand(0.001, 0.006),
      twDir: Math.random() < 0.5 ? -1 : 1,
      col,
      ang: Math.atan2(y - CY, x - CX),
      rad: Math.hypot(x - CX, y - CY),
      rotSpd: rand(0.00008, 0.00022) * (0.35 + (1 - t))
    };
  }

  function makeDust() {
    const t = Math.random();
    const arm = Math.floor(Math.random() * ARM_COUNT);
    const p = spiralPoint(t, arm, 1);

    const spread = (1.2 + t * 4.0);
    const nx = rand(-spread, spread);
    const ny = rand(-spread, spread);

    const palette = [
      { r: 120, g: 70,  b: 200 },
      { r: 80,  g: 120, b: 230 },
      { r: 160, g: 90,  b: 210 },
    ];
    const c = palette[Math.floor(Math.random() * palette.length)];

    const x = p.x + nx * 14;
    const y = p.y + ny * 14;

    return {
      x, y,
      size: rand(0.4, 1.4) * (1 - t * 0.2),
      alpha: rand(0.02, 0.08) * (1 - t * 0.2),
      col: c,
      ang: Math.atan2(y - CY, x - CX),
      rad: Math.hypot(x - CX, y - CY),
      rotSpd: rand(0.00005, 0.00016) * (0.4 + (1 - t))
    };
  }

  const stars = Array.from({ length: STAR_COUNT }, () => makeStar());
  const dust  = Array.from({ length: DUST_COUNT }, () => makeDust());

  function drawBackground() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#060610";
    ctx.fillRect(0, 0, W, H);

    const neb = ctx.createRadialGradient(CX, CY, 0, CX, CY, GALAXY_RADIUS * 1.05);
    neb.addColorStop(0, "rgba(120,120,255,0.10)");
    neb.addColorStop(0.35, "rgba(140,70,220,0.06)");
    neb.addColorStop(0.7, "rgba(20,40,120,0.03)");
    neb.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = neb;
    ctx.beginPath();
    ctx.arc(CX, CY, GALAXY_RADIUS * 1.05, 0, Math.PI * 2);
    ctx.fill();

    const vig = ctx.createRadialGradient(CX, CY, GALAXY_RADIUS * 0.2, CX, CY, Math.max(W, H) * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  function drawDust() {
    for (const d of dust) {
      ctx.fillStyle = `rgba(${d.col.r},${d.col.g},${d.col.b},${d.alpha})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawStars() {
    for (const s of stars) {
      ctx.fillStyle = `rgba(${s.col.r},${s.col.g},${s.col.b},${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let last = performance.now();
  function step(now) {
    const dt = Math.min(32, now - last);
    last = now;

    for (const d of dust) {
      d.ang += d.rotSpd * dt;
      d.x = CX + Math.cos(d.ang) * d.rad;
      d.y = CY + Math.sin(d.ang) * d.rad;
    }

    for (const s of stars) {
      s.ang += s.rotSpd * dt;
      s.x = CX + Math.cos(s.ang) * s.rad;
      s.y = CY + Math.sin(s.ang) * s.rad;

      s.alpha += s.tw * s.twDir * dt;
      if (s.alpha > 0.98) { s.alpha = 0.98; s.twDir *= -1; }
      if (s.alpha < 0.18) { s.alpha = 0.18; s.twDir *= -1; }
    }

    drawBackground();
    drawDust();
    drawStars();
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();
