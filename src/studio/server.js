/**
 * EOTC Media Studio — Web Studio Server
 * ════════════════════════════════════════════════════════
 * Local real-time visual dashboard for content preview,
 * batch generation, and one-click publishing.
 *
 * Run: node src/studio/server.js
 * Opens:  http://localhost:3333
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..', '..');
const OUTPUT_DIR = path.join(ROOT, 'output');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const PORT = process.env.STUDIO_PORT || 3333;

// ─── MIME types ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4':  'video/mp4',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon'
};

function getMime(ext) {
  return MIME[ext] || 'application/octet-stream';
}

// ─── Scan output directory ────────────────────────────────────────────────────
function getOutputFiles() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];
  return fs.readdirSync(OUTPUT_DIR)
    .filter(f => /\.(png|jpg|jpeg|mp4)$/i.test(f))
    .map(f => {
      const fullPath = path.join(OUTPUT_DIR, f);
      const stat = fs.statSync(fullPath);
      return {
        name: f,
        size: stat.size,
        sizeMB: (stat.size / 1024 / 1024).toFixed(1),
        modified: stat.mtime.toISOString(),
        type: f.endsWith('.mp4') ? 'video' : 'image',
        url: `/output/${f}`
      };
    })
    .sort((a, b) => new Date(b.modified) - new Date(a.modified));
}

// ─── Trigger content generation ───────────────────────────────────────────────
function triggerGenerate(contentType, useLiturgical = true) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      CONTENT_TYPE: contentType,
      USE_LITURGICAL: useLiturgical ? 'true' : 'false'
    };
    const child = execFile('node', ['src/index.js'], { cwd: ROOT, env, timeout: 120000 });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('close', (code) => {
      if (code === 0) resolve({ success: true, log: stdout });
      else reject(new Error(stderr || `Exit code ${code}`));
    });
  });
}

// ─── HTML Studio UI ──────────────────────────────────────────────────────────
function buildStudioHTML(files) {
  const fileCards = files.map(f => {
    if (f.type === 'video') {
      return `
        <div class="media-card" data-name="${f.name}">
          <video src="${f.url}" controls preload="metadata" class="media-preview"></video>
          <div class="card-info">
            <span class="card-name">${f.name}</span>
            <span class="card-size">${f.sizeMB} MB</span>
            <span class="card-date">${new Date(f.modified).toLocaleString()}</span>
          </div>
          <div class="card-actions">
            <a href="${f.url}" download class="btn btn-dl">⬇ Download</a>
          </div>
        </div>`;
    }
    return `
      <div class="media-card" data-name="${f.name}">
        <img src="${f.url}" alt="${f.name}" class="media-preview" loading="lazy">
        <div class="card-info">
          <span class="card-name">${f.name}</span>
          <span class="card-size">${f.sizeMB} MB</span>
          <span class="card-date">${new Date(f.modified).toLocaleString()}</span>
        </div>
        <div class="card-actions">
          <a href="${f.url}" download class="btn btn-dl">⬇ Download</a>
          <button class="btn btn-preview" onclick="openPreview('${f.url}')">🔍 Preview</button>
        </div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="am">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>✝️ EOTC Media Studio — Web GUI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Ethiopic:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg:        #050810;
      --surface:   #0c1220;
      --surface2:  #121a2e;
      --gold:      #d4af37;
      --gold-dim:  #8a7122;
      --gold-glow: rgba(212,175,55,0.18);
      --text:      #e8e0d0;
      --text-dim:  rgba(232,224,208,0.55);
      --green:     #3ecf8e;
      --red:       #e05252;
      --blue:      #5b9bd5;
      --radius:    12px;
      --border:    1px solid rgba(212,175,55,0.12);
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    html { font-size:15px; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
    }

    /* ── Header ── */
    .header {
      background: var(--surface);
      border-bottom: var(--border);
      padding: 18px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky; top: 0; z-index: 100;
    }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-cross { font-size: 28px; filter: drop-shadow(0 0 12px var(--gold)); }
    .logo-text { font-size: 18px; font-weight: 700; color: var(--gold); letter-spacing: 0.03em; }
    .logo-sub  { font-size: 11px; color: var(--text-dim); letter-spacing: 0.06em; text-transform: uppercase; }
    .status-bar { display:flex; gap:12px; align-items:center; font-size:12px; }
    .badge { padding:4px 12px; border-radius:99px; font-weight:600; font-size:11px; letter-spacing:0.04em; }
    .badge-gold { background: rgba(212,175,55,0.15); color: var(--gold); border: 1px solid rgba(212,175,55,0.3); }
    .badge-green { background: rgba(62,207,142,0.12); color: var(--green); border: 1px solid rgba(62,207,142,0.25); }

    /* ── Layout ── */
    .app { display:grid; grid-template-columns: 300px 1fr; min-height: calc(100vh - 72px); }

    /* ── Sidebar ── */
    .sidebar {
      background: var(--surface);
      border-right: var(--border);
      padding: 24px 20px;
      display: flex; flex-direction: column; gap: 20px;
    }
    .section-label {
      font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--text-dim);
      margin-bottom: 8px;
    }
    .gen-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    }
    .gen-btn {
      background: var(--surface2);
      border: var(--border);
      border-radius: var(--radius);
      padding: 12px 8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      font-size: 12px;
      color: var(--text);
      font-weight: 500;
    }
    .gen-btn:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-glow); transform: translateY(-1px); }
    .gen-btn .icon { font-size: 20px; display: block; margin-bottom: 4px; }
    .gen-btn.loading { opacity: 0.6; cursor: wait; animation: pulse 1.2s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }

    /* Liturgical toggle */
    .toggle-row { display:flex; align-items:center; justify-content:space-between; margin-top:4px; }
    .toggle-label { font-size:13px; color:var(--text-dim); }
    .toggle { position:relative; width:44px; height:24px; }
    .toggle input { opacity:0; width:0; height:0; }
    .toggle-slider {
      position:absolute; inset:0; border-radius:99px;
      background: var(--surface2); cursor:pointer; transition:0.3s;
      border: 1px solid rgba(212,175,55,0.2);
    }
    .toggle-slider:before {
      content:''; position:absolute; width:18px; height:18px;
      left:3px; top:2px; border-radius:50%;
      background: var(--text-dim); transition:0.3s;
    }
    input:checked + .toggle-slider { background: rgba(212,175,55,0.3); border-color: var(--gold); }
    input:checked + .toggle-slider:before { transform:translateX(20px); background:var(--gold); }

    /* Log output */
    .log-box {
      background: #060910; border: var(--border); border-radius: var(--radius);
      padding: 12px; font-family: monospace; font-size: 11px;
      color: #7ecf7e; height: 180px; overflow-y: auto; white-space: pre-wrap;
      word-break: break-all;
    }
    .log-box .error { color: var(--red); }
    .log-box .info  { color: var(--blue); }

    /* ── Main ── */
    .main { padding: 28px 32px; overflow-y: auto; }
    .main-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
    .main-title { font-size:20px; font-weight:700; color:var(--gold); }
    .file-count { font-size:13px; color:var(--text-dim); }
    .btn-refresh {
      background: var(--surface2); border: var(--border); border-radius:8px;
      padding:8px 16px; color:var(--text-dim); cursor:pointer; font-size:13px;
      font-family:inherit; transition:0.2s;
    }
    .btn-refresh:hover { color:var(--gold); border-color:var(--gold); }

    /* Media grid */
    .media-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px; }
    .media-card {
      background: var(--surface); border: var(--border); border-radius: var(--radius);
      overflow: hidden; transition: 0.25s; position:relative;
    }
    .media-card:hover { border-color: var(--gold); box-shadow: 0 0 24px var(--gold-glow); transform: translateY(-3px); }
    .media-preview {
      width:100%; display:block; aspect-ratio:1; object-fit:cover;
      background:#060910;
    }
    .media-card video.media-preview { aspect-ratio:9/16; }
    .card-info {
      padding:12px 14px 8px;
      display:flex; flex-direction:column; gap:2px;
    }
    .card-name { font-size:13px; font-weight:600; color:var(--text); word-break:break-all; }
    .card-size { font-size:11px; color:var(--gold); }
    .card-date { font-size:10px; color:var(--text-dim); }
    .card-actions { padding:0 14px 14px; display:flex; gap:8px; }
    .btn { padding:7px 14px; border-radius:8px; font-size:12px; font-weight:600;
           cursor:pointer; border:none; text-decoration:none; display:inline-flex;
           align-items:center; gap:4px; font-family:inherit; transition:0.2s; }
    .btn-dl { background:rgba(212,175,55,0.12); color:var(--gold); border:1px solid rgba(212,175,55,0.25); }
    .btn-dl:hover { background:rgba(212,175,55,0.25); }
    .btn-preview { background:var(--surface2); color:var(--text-dim); border:var(--border); }
    .btn-preview:hover { color:var(--text); }

    /* Empty state */
    .empty { text-align:center; padding:80px 20px; color:var(--text-dim); }
    .empty-icon { font-size:56px; display:block; margin-bottom:16px; opacity:0.5; }

    /* Lightbox */
    #lightbox {
      display:none; position:fixed; inset:0; z-index:999;
      background:rgba(0,0,0,0.9); align-items:center; justify-content:center;
      cursor:zoom-out;
    }
    #lightbox.open { display:flex; }
    #lightbox img { max-width:90vw; max-height:90vh; border-radius:8px; object-fit:contain; }
    #lightbox-close {
      position:fixed; top:20px; right:28px; font-size:28px; color:#fff;
      cursor:pointer; line-height:1; z-index:1000;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width:6px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.25); border-radius:3px; }
  </style>
</head>
<body>
  <header class="header">
    <div class="logo">
      <span class="logo-cross">✝</span>
      <div>
        <div class="logo-text">EOTC Media Studio</div>
        <div class="logo-sub">Web Studio — Content Control Room</div>
      </div>
    </div>
    <div class="status-bar">
      <span class="badge badge-gold">v7.0</span>
      <span class="badge badge-green" id="status-badge">● Ready</span>
    </div>
  </header>

  <div class="app">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div>
        <div class="section-label">⚡ Generate Content</div>
        <div class="gen-grid">
          <button class="gen-btn" onclick="generate('quote')"><span class="icon">💬</span>Power Quote</button>
          <button class="gen-btn" onclick="generate('verse')"><span class="icon">📖</span>Daily Verse</button>
          <button class="gen-btn" onclick="generate('carousel')"><span class="icon">🎠</span>Carousel</button>
          <button class="gen-btn" onclick="generate('reflection')"><span class="icon">🕊️</span>Reflection</button>
          <button class="gen-btn" onclick="generate('saint')"><span class="icon">📿</span>Saint Day</button>
          <button class="gen-btn" onclick="generate('fasting')"><span class="icon">🍽️</span>Fasting</button>
          <button class="gen-btn" onclick="generate('holyweek')"><span class="icon">✝️</span>Holy Week</button>
          <button class="gen-btn" onclick="generate('history')"><span class="icon">📜</span>History</button>
          <button class="gen-btn" onclick="generate('calendar')"><span class="icon">📅</span>Calendar</button>
        </div>

        <div class="toggle-row" style="margin-top:16px;">
          <span class="toggle-label">📅 Liturgical Context</span>
          <label class="toggle">
            <input type="checkbox" id="liturgicalToggle" checked>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div>
        <div class="section-label">📋 Generation Log</div>
        <div class="log-box" id="logBox">Awaiting generation...</div>
        <button class="btn-refresh" onclick="clearLog()" style="margin-top:8px;width:100%">🗑 Clear Log</button>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="main">
      <div class="main-header">
        <div>
          <div class="main-title">🖼 Generated Media</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <span class="file-count" id="fileCount">${files.length} files</span>
          <button class="btn-refresh" onclick="location.reload()">↻ Refresh</button>
        </div>
      </div>

      ${files.length === 0
        ? `<div class="empty"><span class="empty-icon">🎨</span><p>No generated files yet.<br>Use the sidebar to generate your first piece of content!</p></div>`
        : `<div class="media-grid" id="mediaGrid">${fileCards}</div>`}
    </main>
  </div>

  <!-- Lightbox -->
  <div id="lightbox" onclick="closeLightbox()">
    <span id="lightbox-close" onclick="closeLightbox()">✕</span>
    <img id="lightbox-img" src="" alt="Preview">
  </div>

  <script>
    const statusBadge = document.getElementById('status-badge');
    const logBox = document.getElementById('logBox');
    let generating = false;

    function log(msg, cls = '') {
      const line = document.createElement('div');
      if (cls) line.className = cls;
      line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
      logBox.appendChild(line);
      logBox.scrollTop = logBox.scrollHeight;
    }

    function clearLog() {
      logBox.innerHTML = '';
    }

    async function generate(type) {
      if (generating) { log('⚠ Already generating, please wait...', 'error'); return; }
      generating = true;
      const liturgical = document.getElementById('liturgicalToggle').checked;

      document.querySelectorAll('.gen-btn').forEach(b => b.classList.add('loading'));
      statusBadge.textContent = '⏳ Generating...';
      statusBadge.style.color = '#d4af37';
      log('▶ Starting: ' + type + (liturgical ? ' (liturgical)' : ''), 'info');

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: type, useLiturgical: liturgical })
        });
        const data = await res.json();

        if (data.success) {
          log('✅ ' + type + ' generated successfully!', '');
          statusBadge.textContent = '● Ready';
          statusBadge.style.color = '#3ecf8e';
          // Refresh media grid
          setTimeout(() => loadMediaGrid(), 1200);
        } else {
          log('❌ Error: ' + (data.error || 'Unknown'), 'error');
          statusBadge.textContent = '● Error';
          statusBadge.style.color = '#e05252';
        }
      } catch (err) {
        log('❌ Network error: ' + err.message, 'error');
        statusBadge.textContent = '● Error';
        statusBadge.style.color = '#e05252';
      } finally {
        generating = false;
        document.querySelectorAll('.gen-btn').forEach(b => b.classList.remove('loading'));
      }
    }

    async function loadMediaGrid() {
      try {
        const res = await fetch('/api/files');
        const { files } = await res.json();
        document.getElementById('fileCount').textContent = files.length + ' files';

        const grid = document.getElementById('mediaGrid');
        if (!grid) { location.reload(); return; }

        grid.innerHTML = files.map(f => {
          if (f.type === 'video') {
            return \`<div class="media-card">
              <video src="\${f.url}" controls preload="metadata" class="media-preview"></video>
              <div class="card-info">
                <span class="card-name">\${f.name}</span>
                <span class="card-size">\${f.sizeMB} MB</span>
                <span class="card-date">\${new Date(f.modified).toLocaleString()}</span>
              </div>
              <div class="card-actions">
                <a href="\${f.url}" download class="btn btn-dl">⬇ Download</a>
              </div>
            </div>\`;
          }
          return \`<div class="media-card">
            <img src="\${f.url}" alt="\${f.name}" class="media-preview" loading="lazy">
            <div class="card-info">
              <span class="card-name">\${f.name}</span>
              <span class="card-size">\${f.sizeMB} MB</span>
              <span class="card-date">\${new Date(f.modified).toLocaleString()}</span>
            </div>
            <div class="card-actions">
              <a href="\${f.url}" download class="btn btn-dl">⬇ Download</a>
              <button class="btn btn-preview" onclick="openPreview('\${f.url}')">🔍 Preview</button>
            </div>
          </div>\`;
        }).join('');
      } catch {}
    }

    function openPreview(url) {
      document.getElementById('lightbox-img').src = url;
      document.getElementById('lightbox').classList.add('open');
    }
    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('open');
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

    // Auto-refresh every 30s
    setInterval(loadMediaGrid, 30000);
  </script>
</body>
</html>`;
}

// ─── HTTP Router ──────────────────────────────────────────────────────────────
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // ── API: GET /api/files ──────────────────────────────────────────────────
  if (req.method === 'GET' && pathname === '/api/files') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ files: getOutputFiles() }));
    return;
  }

  // ── API: POST /api/generate ──────────────────────────────────────────────
  if (req.method === 'POST' && pathname === '/api/generate') {
    let body = '';
    req.on('data', d => { body += d.toString(); });
    req.on('end', async () => {
      try {
        const { contentType, useLiturgical } = JSON.parse(body);
        console.log(`🖥️  Studio trigger: ${contentType}`);
        await triggerGenerate(contentType, useLiturgical !== false);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ── Serve output files ───────────────────────────────────────────────────
  if (pathname.startsWith('/output/')) {
    const fileName = decodeURIComponent(pathname.replace('/output/', ''));
    const filePath = path.join(OUTPUT_DIR, fileName);
    if (fs.existsSync(filePath) && path.relative(OUTPUT_DIR, filePath).startsWith('') && !filePath.includes('..')) {
      const ext = path.extname(filePath).toLowerCase();
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': getMime(ext),
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    res.writeHead(404); res.end('Not found'); return;
  }

  // ── Serve assets (SVG vectors etc.) ────────────────────────────────────
  if (pathname.startsWith('/assets/')) {
    const assetPath = path.join(ROOT, pathname);
    if (fs.existsSync(assetPath)) {
      const ext = path.extname(assetPath).toLowerCase();
      res.writeHead(200, { 'Content-Type': getMime(ext) });
      fs.createReadStream(assetPath).pipe(res);
      return;
    }
    res.writeHead(404); res.end('Not found'); return;
  }

  // ── Main Studio UI ───────────────────────────────────────────────────────
  if (pathname === '/' || pathname === '/index.html') {
    const files = getOutputFiles();
    const html = buildStudioHTML(files);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end('Not found');
}

// ─── Start Server ─────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║  ✝️  EOTC Media Studio — Web Studio         ║`);
  console.log(`╠════════════════════════════════════════════╣`);
  console.log(`║  🌐 http://localhost:${PORT}                  ║`);
  console.log(`║  📁 Output: ${OUTPUT_DIR.replace(ROOT, '')}                  ║`);
  console.log(`╚════════════════════════════════════════════╝\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Set STUDIO_PORT= to change.`);
  } else {
    console.error('❌ Server error:', err.message);
  }
  process.exit(1);
});
