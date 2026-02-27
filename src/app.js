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
