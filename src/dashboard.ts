export function getDashboardHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>devwifi</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3/dist/chartjs-adapter-date-fns.bundle.min.js"><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#09090b;--surface:#111113;--surface2:#18181b;--surface3:#1c1c1f;
  --border:#27272a;--border2:#333;--text:#fafafa;--dim:#71717a;--dim2:#52525b;
  --accent:#3b82f6;--accent2:#2563eb;--green:#22c55e;--yellow:#eab308;--red:#ef4444;
  --purple:#a855f7;--cyan:#06b6d4;
  --radius:10px;--radius-lg:14px;
}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}

/* ── Sidebar ─────────────────────────────────────── */
.sidebar{width:220px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:20}
.sidebar-brand{padding:20px 18px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)}
.sidebar-brand h1{font-size:15px;font-weight:700;letter-spacing:-0.5px}
.sidebar-brand .dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.sidebar-nav{flex:1;padding:12px 10px}
.nav-section{font-size:10px;text-transform:uppercase;letter-spacing:1.2px;color:var(--dim2);padding:10px 8px 6px;font-weight:600}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;font-size:13px;color:var(--dim);transition:all .15s;font-weight:500;margin-bottom:2px}
.nav-item:hover{background:var(--surface2);color:var(--text)}
.nav-item.active{background:var(--surface2);color:var(--text)}
.nav-item svg{width:16px;height:16px;opacity:.6;flex-shrink:0}
.nav-item.active svg{opacity:1}
.sidebar-footer{padding:14px 18px;border-top:1px solid var(--border);font-size:11px;color:#333}

/* ── Main ────────────────────────────────────────── */
.main{margin-left:220px;flex:1;min-height:100vh}
.topbar{display:flex;align-items:center;gap:12px;padding:14px 24px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:10}
.topbar-title{font-size:14px;font-weight:600}
.topbar-live{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--green);font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-left:8px}
.topbar-live .live-dot{width:5px;height:5px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
.topbar-right{margin-left:auto;display:flex;align-items:center;gap:12px}
.topbar-uptime{font-size:12px;color:var(--dim);font-variant-numeric:tabular-nums}
.content{padding:20px 24px;max-width:1400px}

/* ── Page visibility ─────────────────────────────── */
.page{display:none}.page.active{display:block}

/* ── Cards & Stats ───────────────────────────────── */
.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:20px}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 18px;transition:border-color .2s}
.stat:hover{border-color:var(--border2)}
.stat-label{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--dim2);margin-bottom:6px;font-weight:600}
.stat-value{font-size:24px;font-weight:700;letter-spacing:-1px;font-variant-numeric:tabular-nums}
.stat-unit{font-size:12px;font-weight:400;color:var(--dim)}
.stat-sub{font-size:11px;color:var(--dim);margin-top:4px}
.charts-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
@media(max-width:1000px){.charts-row{grid-template-columns:1fr}}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px;transition:border-color .2s}
.card:hover{border-color:var(--border2)}
.card-title{font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--dim2);margin-bottom:14px;font-weight:600}
.chart-wrap{position:relative;height:200px}
.good{color:var(--green)}.warn{color:var(--yellow)}.bad{color:var(--red)}.info{color:var(--accent)}.purple{color:var(--purple)}

/* ── Table ───────────────────────────────────────── */
.table{width:100%;border-collapse:collapse}
.table th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--dim2);padding:8px 12px;border-bottom:1px solid var(--border);font-weight:600}
.table td{padding:10px 12px;border-bottom:1px solid #1a1a1e;font-size:13px;vertical-align:middle}
.table tr:hover td{background:var(--surface2)}
.table .mono{font-family:'SF Mono',Consolas,monospace;font-size:12px;color:var(--dim)}

/* ── Buttons ─────────────────────────────────────── */
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:7px;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s;border:1px solid var(--border)}
.btn-primary{background:var(--accent);border-color:var(--accent);color:#fff}
.btn-primary:hover{background:var(--accent2)}
.btn-ghost{background:transparent;color:var(--dim)}
.btn-ghost:hover{background:var(--surface2);color:var(--text)}
.btn-danger{background:transparent;color:var(--red);border-color:#3a1515}
.btn-danger:hover{background:#1a0a0a}
.btn-sm{padding:5px 10px;font-size:11px}

/* ── Password / Copy ─────────────────────────────── */
.pw-hidden{font-family:monospace;letter-spacing:2px;color:var(--dim)}
.pw-visible{font-family:monospace;color:var(--green);font-weight:600}
.copy-toast{position:fixed;bottom:24px;right:24px;background:var(--surface2);border:1px solid var(--border2);color:var(--green);padding:10px 18px;border-radius:8px;font-size:13px;opacity:0;transition:opacity .3s;pointer-events:none;z-index:50}
.copy-toast.show{opacity:1}

/* ── Forms ────────────────────────────────────────── */
.form-group{margin-bottom:16px}
.form-label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:var(--dim);margin-bottom:6px;font-weight:600}
.form-input{width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:13px;outline:none;transition:border-color .15s}
.form-input:focus{border-color:var(--accent)}
.form-row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:10px;align-items:end}
.form-select{appearance:none;width:100%;padding:8px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:13px;outline:none;cursor:pointer}
.toggle{position:relative;width:36px;height:20px;background:var(--surface3);border-radius:10px;cursor:pointer;transition:background .2s;border:1px solid var(--border)}
.toggle.on{background:var(--accent)}
.toggle::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;background:#fff;border-radius:50%;transition:transform .2s}
.toggle.on::after{transform:translateX(16px)}

/* ── Alerts log ──────────────────────────────────── */
.alert-item{display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--surface2);border:1px solid #2a2000;border-radius:8px;margin-bottom:8px;font-size:13px}
.alert-dot{width:8px;height:8px;border-radius:50%;background:var(--yellow);flex-shrink:0}
.alert-time{color:var(--dim);font-size:11px;margin-left:auto;white-space:nowrap}

/* ── DNS cards ───────────────────────────────────── */
.dns-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px}
.dns-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;cursor:pointer;transition:all .2s;text-align:center}
.dns-card:hover{border-color:var(--accent)}
.dns-card.selected{border-color:var(--accent);background:#0c1629}
.dns-card-name{font-size:14px;font-weight:600;margin-bottom:4px}
.dns-card-ip{font-size:12px;color:var(--dim);font-family:monospace}

/* ── Modal ───────────────────────────────────────── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;display:none;align-items:center;justify-content:center}
.modal-overlay.show{display:flex}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;width:90%;max-width:420px}
.modal-title{font-size:16px;font-weight:600;margin-bottom:16px}
.modal-close{float:right;background:none;border:none;color:var(--dim);cursor:pointer;font-size:18px;line-height:1}

/* ── QR ──────────────────────────────────────────── */
.qr-container{display:flex;justify-content:center;padding:20px;background:#fff;border-radius:8px;margin:16px 0}
.qr-container canvas{max-width:200px}

/* ── Responsive ──────────────────────────────────── */
@media(max-width:768px){
  .sidebar{display:none}
  .main{margin-left:0}
  .stats-row{grid-template-columns:1fr 1fr}
  .form-row{grid-template-columns:1fr}
}
</style>
</head>
<body>

<aside class="sidebar">
  <div class="sidebar-brand">
    <div class="dot"></div>
    <h1>devwifi</h1>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-section">Monitor</div>
    <div class="nav-item active" data-page="dashboard">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      Dashboard
    </div>
    <div class="nav-item" data-page="history">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      History
    </div>

    <div class="nav-section">Manage</div>
    <div class="nav-item" data-page="networks">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>
      Networks
    </div>
    <div class="nav-item" data-page="dns">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      DNS
    </div>
    <div class="nav-item" data-page="devices">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      Devices
    </div>

    <div class="nav-section">Settings</div>
    <div class="nav-item" data-page="alerts">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      Alerts
    </div>
  </nav>
  <div class="sidebar-footer">
    <span id="sidebar-uptime">00:00:00</span> uptime
  </div>
</aside>

<div class="main">
  <div class="topbar">
    <span class="topbar-title" id="page-title">Dashboard</span>
    <div class="topbar-live"><div class="live-dot"></div>LIVE</div>
    <div class="topbar-right">
      <span class="topbar-uptime" id="topbar-uptime">00:00:00</span>
    </div>
  </div>

  <div class="content">

    <!-- ═══ Dashboard ═══ -->
    <div class="page active" id="page-dashboard">
      <div class="stats-row">
        <div class="stat"><div class="stat-label">Download</div><div class="stat-value info" id="s-dl">0 <span class="stat-unit">Mbps</span></div></div>
        <div class="stat"><div class="stat-label">Upload</div><div class="stat-value purple" id="s-ul">0 <span class="stat-unit">Mbps</span></div></div>
        <div class="stat"><div class="stat-label">Latency</div><div class="stat-value" id="s-lat">0 <span class="stat-unit">ms</span></div></div>
        <div class="stat"><div class="stat-label">Downloaded</div><div class="stat-value" id="s-trx" style="font-size:18px;color:var(--dim)">0 B</div></div>
        <div class="stat"><div class="stat-label">Uploaded</div><div class="stat-value" id="s-ttx" style="font-size:18px;color:var(--dim)">0 B</div></div>
        <div class="stat"><div class="stat-label">Peak DL</div><div class="stat-value info" id="s-peak">0 <span class="stat-unit">Mbps</span></div></div>
      </div>
      <div class="charts-row">
        <div class="card"><div class="card-title">Bandwidth</div><div class="chart-wrap"><canvas id="bw-chart"></canvas></div></div>
        <div class="card"><div class="card-title">Latency</div><div class="chart-wrap"><canvas id="lat-chart"></canvas></div></div>
      </div>
      <div class="charts-row">
        <div class="card">
          <div class="card-title">Network Info</div>
          <table class="table">
            <tr><td style="color:var(--dim)">Local IP</td><td id="d-ip" class="mono">—</td></tr>
            <tr><td style="color:var(--dim)">Gateway</td><td id="d-gw" class="mono">—</td></tr>
            <tr><td style="color:var(--dim)">DNS</td><td id="d-dns">—</td></tr>
          </table>
        </div>
        <div class="card">
          <div class="card-title">Recent Alerts</div>
          <div id="dash-alerts" style="max-height:180px;overflow-y:auto"><span style="color:var(--dim);font-size:13px">No alerts</span></div>
        </div>
      </div>
    </div>

    <!-- ═══ History ═══ -->
    <div class="page" id="page-history">
      <div class="stats-row" style="margin-bottom:14px">
        <div class="stat"><div class="stat-label">Time Range</div>
          <select class="form-select" id="hist-range" style="margin-top:6px">
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h" selected>Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
        </div>
        <div class="stat"><div class="stat-label">Avg Download</div><div class="stat-value info" id="h-avg-dl">—</div></div>
        <div class="stat"><div class="stat-label">Avg Latency</div><div class="stat-value" id="h-avg-lat">—</div></div>
        <div class="stat"><div class="stat-label">Total Transfer</div><div class="stat-value" id="h-total" style="font-size:18px;color:var(--dim)">—</div></div>
      </div>
      <div class="charts-row">
        <div class="card"><div class="card-title">Bandwidth History</div><div class="chart-wrap" style="height:280px"><canvas id="hist-bw-chart"></canvas></div></div>
        <div class="card"><div class="card-title">Latency History</div><div class="chart-wrap" style="height:280px"><canvas id="hist-lat-chart"></canvas></div></div>
      </div>
      <div style="text-align:right;margin-top:8px">
        <button class="btn btn-ghost" onclick="exportData('csv')">Export CSV</button>
        <button class="btn btn-ghost" onclick="exportData('json')">Export JSON</button>
      </div>
    </div>

    <!-- ═══ Networks ═══ -->
    <div class="page" id="page-networks">
      <div style="display:flex;align-items:center;margin-bottom:16px">
        <span style="font-size:14px;font-weight:600">Saved Networks</span>
        <button class="btn btn-ghost btn-sm" style="margin-left:auto" onclick="loadNetworks()">Refresh</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="table" id="networks-table">
          <thead><tr><th>#</th><th>Network Name</th><th>Password</th><th>Actions</th></tr></thead>
          <tbody id="networks-body"><tr><td colspan="4" style="color:var(--dim);text-align:center;padding:20px">Loading…</td></tr></tbody>
        </table>
      </div>
    </div>

    <!-- ═══ DNS ═══ -->
    <div class="page" id="page-dns">
      <span style="font-size:14px;font-weight:600;display:block;margin-bottom:16px">DNS Configuration</span>
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">Current DNS Servers</div>
        <div id="dns-current" style="color:var(--dim);font-size:13px">Loading…</div>
      </div>
      <span style="font-size:13px;font-weight:600;color:var(--dim);display:block;margin-bottom:12px">SWITCH TO A PRESET</span>
      <div class="dns-grid">
        <div class="dns-card" onclick="setDnsPreset('1.1.1.1','1.0.0.1')"><div class="dns-card-name">Cloudflare</div><div class="dns-card-ip">1.1.1.1 / 1.0.0.1</div></div>
        <div class="dns-card" onclick="setDnsPreset('8.8.8.8','8.8.4.4')"><div class="dns-card-name">Google</div><div class="dns-card-ip">8.8.8.8 / 8.8.4.4</div></div>
        <div class="dns-card" onclick="setDnsPreset('9.9.9.9','149.112.112.112')"><div class="dns-card-name">Quad9</div><div class="dns-card-ip">9.9.9.9 / 149.112.112.112</div></div>
        <div class="dns-card" onclick="setDnsPreset('208.67.222.222','208.67.220.220')"><div class="dns-card-name">OpenDNS</div><div class="dns-card-ip">208.67.222.222 / 208.67.220.220</div></div>
      </div>
      <div class="card">
        <div class="card-title">Custom DNS</div>
        <div style="display:flex;gap:10px;align-items:end">
          <div class="form-group" style="flex:1;margin:0"><div class="form-label">Primary</div><input class="form-input" id="dns-primary" placeholder="1.1.1.1"></div>
          <div class="form-group" style="flex:1;margin:0"><div class="form-label">Secondary</div><input class="form-input" id="dns-secondary" placeholder="1.0.0.1"></div>
          <button class="btn btn-primary" onclick="setCustomDns()">Apply</button>
        </div>
      </div>
    </div>

    <!-- ═══ Devices ═══ -->
    <div class="page" id="page-devices">
      <div style="display:flex;align-items:center;margin-bottom:16px">
        <span style="font-size:14px;font-weight:600">Network Devices</span>
        <button class="btn btn-primary btn-sm" style="margin-left:auto" id="scan-btn" onclick="scanDevices()">Scan Network</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <table class="table" id="devices-table">
          <thead><tr><th>IP Address</th><th>MAC Address</th><th>Hostname</th><th>Vendor</th></tr></thead>
          <tbody id="devices-body"><tr><td colspan="4" style="color:var(--dim);text-align:center;padding:20px">Click "Scan Network" to discover devices</td></tr></tbody>
        </table>
      </div>
    </div>

    <!-- ═══ Alerts ═══ -->
    <div class="page" id="page-alerts">
      <span style="font-size:14px;font-weight:600;display:block;margin-bottom:16px">Alert Rules</span>
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">Add Rule</div>
        <div class="form-row">
          <div><div class="form-label">Metric</div><select class="form-select" id="alert-metric"><option value="latency">Latency (ms)</option><option value="download">Download (Mbps)</option><option value="upload">Upload (Mbps)</option></select></div>
          <div><div class="form-label">Condition</div><select class="form-select" id="alert-cond"><option value="above">Above</option><option value="below">Below</option></select></div>
          <div><div class="form-label">Threshold</div><input class="form-input" id="alert-thresh" type="number" placeholder="100"></div>
          <button class="btn btn-primary" style="margin-bottom:0" onclick="addAlertRule()">Add</button>
        </div>
        <div style="margin-top:12px">
          <div class="form-label">Webhook URL (optional)</div>
          <input class="form-input" id="alert-webhook" placeholder="https://hooks.slack.com/...">
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;padding:0;overflow:hidden">
        <table class="table">
          <thead><tr><th>Metric</th><th>Condition</th><th>Threshold</th><th>Webhook</th><th>Enabled</th><th></th></tr></thead>
          <tbody id="alert-rules-body"><tr><td colspan="6" style="color:var(--dim);text-align:center;padding:16px">Loading…</td></tr></tbody>
        </table>
      </div>

      <span style="font-size:14px;font-weight:600;display:block;margin-bottom:12px">Alert Log</span>
      <div id="alert-log" style="max-height:400px;overflow-y:auto"><span style="color:var(--dim);font-size:13px">No alerts fired yet</span></div>
    </div>

  </div>
</div>

<!-- QR Modal -->
<div class="modal-overlay" id="qr-modal">
  <div class="modal">
    <button class="modal-close" onclick="closeModal()">&times;</button>
    <div class="modal-title" id="qr-modal-title">Wi-Fi QR Code</div>
    <div class="qr-container" id="qr-container"></div>
    <p style="text-align:center;font-size:12px;color:var(--dim);margin-top:8px">Scan with your phone camera to connect</p>
  </div>
</div>

<!-- Copy toast -->
<div class="copy-toast" id="copy-toast">Copied to clipboard</div>

<script>
// ── State ──────────────────────────────────────────
let peakDl = 0;
let startedAt = Date.now();
const bwData = { dl: [], ul: [] };
const latData = [];

// ── Charts ─────────────────────────────────────────
const chartDefaults = {
  responsive:true, maintainAspectRatio:false,
  animation:{duration:200},
  interaction:{intersect:false,mode:'index'},
  scales:{
    x:{type:'time',time:{unit:'minute',displayFormats:{minute:'HH:mm',hour:'HH:mm'}},grid:{color:'#1a1a1f'},ticks:{color:'#52525b',font:{size:10}},border:{color:'#27272a'}},
    y:{beginAtZero:true,grid:{color:'#1a1a1f'},ticks:{color:'#52525b',font:{size:10}},border:{color:'#27272a'}}
  },
  plugins:{legend:{labels:{color:'#a1a1aa',boxWidth:8,font:{size:11}}}}
};

const bwChart = new Chart(document.getElementById('bw-chart'),{type:'line',data:{datasets:[
  {label:'Download',data:[],borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.08)',fill:true,tension:.3,pointRadius:0,borderWidth:1.5},
  {label:'Upload',data:[],borderColor:'#a855f7',backgroundColor:'rgba(168,85,247,.08)',fill:true,tension:.3,pointRadius:0,borderWidth:1.5},
]},options:{...chartDefaults}});

const latChart = new Chart(document.getElementById('lat-chart'),{type:'line',data:{datasets:[
  {label:'Latency',data:[],borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,.08)',fill:true,tension:.3,pointRadius:0,borderWidth:1.5},
]},options:{...chartDefaults}});

// History charts (initialized later)
let histBwChart, histLatChart;
function initHistCharts(){
  if(histBwChart) return;
  histBwChart = new Chart(document.getElementById('hist-bw-chart'),{type:'line',data:{datasets:[
    {label:'Download',data:[],borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,.08)',fill:true,tension:.3,pointRadius:0,borderWidth:1.5},
    {label:'Upload',data:[],borderColor:'#a855f7',backgroundColor:'rgba(168,85,247,.08)',fill:true,tension:.3,pointRadius:0,borderWidth:1.5},
  ]},options:{...chartDefaults}});
  histLatChart = new Chart(document.getElementById('hist-lat-chart'),{type:'line',data:{datasets:[
    {label:'Latency',data:[],borderColor:'#22c55e',backgroundColor:'rgba(34,197,94,.08)',fill:true,tension:.3,pointRadius:0,borderWidth:1.5},
  ]},options:{...chartDefaults}});
}

// ── Navigation ─────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item=>{
  item.addEventListener('click',()=>{
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    item.classList.add('active');
    const page = item.dataset.page;
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.getElementById('page-'+page).classList.add('active');
    document.getElementById('page-title').textContent = item.textContent.trim();
    if(page==='networks') loadNetworks();
    if(page==='dns') loadDns();
    if(page==='alerts') loadAlertRules();
    if(page==='history'){initHistCharts();loadHistory();}
  });
});

// ── SSE ────────────────────────────────────────────
const sse = new EventSource('/events');

sse.addEventListener('tick',e=>{
  const d = JSON.parse(e.data);
  document.getElementById('s-dl').innerHTML = d.bw.downloadMbps+' <span class="stat-unit">Mbps</span>';
  document.getElementById('s-ul').innerHTML = d.bw.uploadMbps+' <span class="stat-unit">Mbps</span>';
  const latEl = document.getElementById('s-lat');
  latEl.innerHTML = (d.lat.ms>=0?d.lat.ms:'—')+' <span class="stat-unit">ms</span>';
  latEl.className = 'stat-value '+(d.lat.ms<=20?'good':d.lat.ms<=50?'warn':'bad');
  document.getElementById('s-trx').textContent = d.totalRx;
  document.getElementById('s-ttx').textContent = d.totalTx;
  if(d.bw.downloadMbps>peakDl) peakDl=d.bw.downloadMbps;
  document.getElementById('s-peak').innerHTML = peakDl+' <span class="stat-unit">Mbps</span>';
  const t = new Date(d.bw.timestamp);
  bwChart.data.datasets[0].data.push({x:t,y:d.bw.downloadMbps});
  bwChart.data.datasets[1].data.push({x:t,y:d.bw.uploadMbps});
  latChart.data.datasets[0].data.push({x:t,y:d.lat.ms>=0?d.lat.ms:null});
  const max=720;
  bwChart.data.datasets.forEach(ds=>{if(ds.data.length>max)ds.data.shift()});
  if(latChart.data.datasets[0].data.length>max) latChart.data.datasets[0].data.shift();
  bwChart.update('none'); latChart.update('none');
});

sse.addEventListener('info',e=>{
  const d=JSON.parse(e.data);
  document.getElementById('d-ip').textContent=d.localIP||'—';
  document.getElementById('d-gw').textContent=d.gateway||'—';
  document.getElementById('d-dns').textContent=d.dns.map(s=>s.address+(s.provider?' ('+s.provider+')':'')).join(', ')||'—';
  startedAt=d.startedAt;
});

sse.addEventListener('alert',e=>{
  const d=JSON.parse(e.data);
  renderAlertLog(d.log);
});

// ── Uptime ─────────────────────────────────────────
setInterval(()=>{
  const diff=Math.floor((Date.now()-startedAt)/1000);
  const h=String(Math.floor(diff/3600)).padStart(2,'0');
  const m=String(Math.floor((diff%3600)/60)).padStart(2,'0');
  const s=String(diff%60).padStart(2,'0');
  const t=h+':'+m+':'+s;
  document.getElementById('topbar-uptime').textContent=t;
  document.getElementById('sidebar-uptime').textContent=t;
},1000);

// ── Networks ───────────────────────────────────────
async function loadNetworks(){
  const res = await fetch('/api/networks');
  const data = await res.json();
  const body = document.getElementById('networks-body');
  if(!data.length){body.innerHTML='<tr><td colspan="4" style="color:var(--dim);text-align:center;padding:20px">No saved networks</td></tr>';return;}
  body.innerHTML = data.map((n,i)=>'<tr>'
    +'<td style="color:var(--dim)">'+(i+1)+'</td>'
    +'<td style="font-weight:500">'+n.name+'</td>'
    +'<td><span class="pw-hidden" id="pw-'+i+'">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span></td>'
    +'<td><button class="btn btn-ghost btn-sm" onclick="showPw('+i+',\\''+esc(n.name)+'\\')">Show</button> '
    +'<button class="btn btn-ghost btn-sm" onclick="copyPw(\\''+esc(n.name)+'\\')">Copy</button> '
    +'<button class="btn btn-ghost btn-sm" onclick="showQr(\\''+esc(n.name)+'\\')">QR</button></td>'
    +'</tr>').join('');
}
function esc(s){return s.replace(/'/g,"\\\\'").replace(/"/g,'&quot;')}

async function showPw(idx,name){
  const el=document.getElementById('pw-'+idx);
  if(el.classList.contains('pw-visible')){el.textContent='\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022\\u2022';el.className='pw-hidden';return;}
  el.textContent='loading…';
  const res=await fetch('/api/password/'+encodeURIComponent(name));
  const d=await res.json();
  el.textContent=d.password||'(not found)';
  el.className=d.password?'pw-visible':'pw-hidden';
}

async function copyPw(name){
  const res=await fetch('/api/password/'+encodeURIComponent(name));
  const d=await res.json();
  if(d.password){
    await navigator.clipboard.writeText(d.password);
    showToast('Password copied!');
  }
}

async function showQr(name){
  const res=await fetch('/api/qr/'+encodeURIComponent(name));
  const d=await res.json();
  document.getElementById('qr-modal-title').textContent=name;
  document.getElementById('qr-container').innerHTML = '<img src="'+d.dataUrl+'" style="max-width:200px;image-rendering:pixelated" />';
  document.getElementById('qr-modal').classList.add('show');
}
function closeModal(){document.querySelectorAll('.modal-overlay').forEach(m=>m.classList.remove('show'))}

// ── DNS ────────────────────────────────────────────
async function loadDns(){
  const res=await fetch('/api/dns');
  const d=await res.json();
  document.getElementById('dns-current').innerHTML=d.servers.map(s=>'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:6px;height:6px;border-radius:50%;background:var(--accent)"></div><span class="mono">'+s.address+'</span>'+(s.provider?'<span style="color:var(--dim);font-size:12px">('+s.provider+')</span>':'')+'</div>').join('')||'<span>Not detected</span>';
}

async function setDnsPreset(primary,secondary){
  if(!confirm('Set DNS to '+primary+' / '+secondary+'?\\nRequires admin privileges.')) return;
  const res=await fetch('/api/dns',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({primary,secondary})});
  const d=await res.json();
  showToast(d.ok?'DNS updated!':'Failed: '+d.error);
  loadDns();
}

async function setCustomDns(){
  const p=document.getElementById('dns-primary').value;
  const s=document.getElementById('dns-secondary').value;
  if(!p){showToast('Enter primary DNS');return;}
  await setDnsPreset(p,s||p);
}

// ── Devices ────────────────────────────────────────
async function scanDevices(){
  const btn=document.getElementById('scan-btn');
  btn.textContent='Scanning…';btn.disabled=true;
  const res=await fetch('/api/devices');
  const d=await res.json();
  btn.textContent='Scan Network';btn.disabled=false;
  const body=document.getElementById('devices-body');
  if(!d.length){body.innerHTML='<tr><td colspan="4" style="color:var(--dim);text-align:center;padding:16px">No devices found</td></tr>';return;}
  body.innerHTML=d.map(dev=>'<tr>'
    +'<td class="mono">'+dev.ip+'</td>'
    +'<td class="mono">'+dev.mac+'</td>'
    +'<td>'+(dev.hostname||'<span style="color:var(--dim)">—</span>')+'</td>'
    +'<td>'+(dev.type!=='Unknown'?dev.type:'<span style="color:var(--dim)">'+dev.type+'</span>')+'</td>'
    +'</tr>').join('');
}

// ── Alerts ─────────────────────────────────────────
async function loadAlertRules(){
  const res=await fetch('/api/alerts');
  const d=await res.json();
  const body=document.getElementById('alert-rules-body');
  body.innerHTML=d.rules.map(r=>'<tr>'
    +'<td>'+r.metric+'</td><td>'+r.condition+'</td><td>'+r.threshold+'</td>'
    +'<td class="mono" style="max-width:120px;overflow:hidden;text-overflow:ellipsis">'+(r.webhookUrl||'—')+'</td>'
    +'<td><div class="toggle '+(r.enabled?'on':'')+'" onclick="toggleAlert(\\''+r.id+'\\','+!r.enabled+')"></div></td>'
    +'<td><button class="btn btn-danger btn-sm" onclick="deleteAlert(\\''+r.id+'\\')">Remove</button></td>'
    +'</tr>').join('');
  const logRes=await fetch('/api/alerts/log');
  const logData=await logRes.json();
  renderAlertLog(logData);
}

async function addAlertRule(){
  const metric=document.getElementById('alert-metric').value;
  const condition=document.getElementById('alert-cond').value;
  const threshold=parseFloat(document.getElementById('alert-thresh').value);
  const webhookUrl=document.getElementById('alert-webhook').value||undefined;
  if(isNaN(threshold)){showToast('Enter a valid threshold');return;}
  await fetch('/api/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add',rule:{metric,condition,threshold,webhookUrl}})});
  document.getElementById('alert-thresh').value='';
  loadAlertRules();
}

async function toggleAlert(id,enabled){
  await fetch('/api/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'toggle',id,enabled})});
  loadAlertRules();
}

async function deleteAlert(id){
  await fetch('/api/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',id})});
  loadAlertRules();
}

function renderAlertLog(log){
  const el=document.getElementById('alert-log');
  const dashEl=document.getElementById('dash-alerts');
  if(!log||!log.length){
    el.innerHTML='<span style="color:var(--dim);font-size:13px">No alerts fired yet</span>';
    dashEl.innerHTML='<span style="color:var(--dim);font-size:13px">No alerts</span>';
    return;
  }
  const html=log.slice(0,50).map(a=>'<div class="alert-item"><div class="alert-dot"></div>'+a.message+'<span class="alert-time">'+new Date(a.timestamp).toLocaleTimeString()+'</span></div>').join('');
  el.innerHTML=html;
  dashEl.innerHTML=log.slice(0,5).map(a=>'<div class="alert-item"><div class="alert-dot"></div>'+a.message+'<span class="alert-time">'+new Date(a.timestamp).toLocaleTimeString()+'</span></div>').join('');
}

// ── History ────────────────────────────────────────
async function loadHistory(){
  const range=document.getElementById('hist-range').value;
  const res=await fetch('/api/history?range='+range);
  const d=await res.json();
  histBwChart.data.datasets[0].data=d.bandwidth.map(p=>({x:new Date(p.timestamp),y:p.downloadMbps}));
  histBwChart.data.datasets[1].data=d.bandwidth.map(p=>({x:new Date(p.timestamp),y:p.uploadMbps}));
  histLatChart.data.datasets[0].data=d.latency.filter(p=>p.ms>=0).map(p=>({x:new Date(p.timestamp),y:p.ms}));
  histBwChart.update();histLatChart.update();
  if(d.bandwidth.length){
    const avgDl=(d.bandwidth.reduce((s,p)=>s+p.downloadMbps,0)/d.bandwidth.length).toFixed(1);
    document.getElementById('h-avg-dl').innerHTML=avgDl+' <span class="stat-unit">Mbps</span>';
  }
  if(d.latency.length){
    const valid=d.latency.filter(p=>p.ms>=0);
    const avgLat=valid.length?Math.round(valid.reduce((s,p)=>s+p.ms,0)/valid.length):'—';
    document.getElementById('h-avg-lat').innerHTML=avgLat+' <span class="stat-unit">ms</span>';
  }
  document.getElementById('h-total').textContent=d.totalTransfer;
}
document.getElementById('hist-range')?.addEventListener('change',loadHistory);

// ── Export ──────────────────────────────────────────
async function exportData(format){
  const range=document.getElementById('hist-range').value;
  const res=await fetch('/api/history?range='+range);
  const d=await res.json();
  let content,type,ext;
  if(format==='json'){
    content=JSON.stringify(d,null,2);type='application/json';ext='json';
  } else {
    const rows=['timestamp,downloadMbps,uploadMbps,latencyMs'];
    d.bandwidth.forEach((p,i)=>{
      const lat=d.latency[i];
      rows.push(new Date(p.timestamp).toISOString()+','+p.downloadMbps+','+p.uploadMbps+','+(lat?lat.ms:''));
    });
    content=rows.join('\\n');type='text/csv';ext='csv';
  }
  const blob=new Blob([content],{type});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='devwifi-export-'+new Date().toISOString().slice(0,10)+'.'+ext;
  a.click();
}

// ── Utils ──────────────────────────────────────────
function showToast(msg){
  const el=document.getElementById('copy-toast');
  el.textContent=msg;el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'),2000);
}
<\/script>
</body>
</html>`;
}
