from pathlib import Path

path = Path("index.html")
html = path.read_text(encoding="utf-8")

if 'src/app.js' not in html:
    script_start = html.rfind("<script>")
    script_end = html.rfind("</script>")
    if script_start == -1 or script_end == -1:
        raise RuntimeError("Legacy inline application script was not found")
    html = html[:script_start] + '<script type="module" src="src/app.js"></script>' + html[script_end + len("</script>"):]

html = html.replace(
    "Tool ID QMSP-CAPA-001 · Version 1.0.0",
    "Tool ID QMSP-CAPA-001 · Version 1.1.0"
)

css_marker = "    @media(max-width:1150px)"
css = """
    .dashboard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .metric{background:#071a2c;border:1px solid #294660;border-radius:13px;padding:12px}
    .metric-value{font-size:1.3rem;font-weight:850;margin-top:4px}
    .workforce-status{margin-top:12px;padding-top:10px;border-top:1px solid var(--line)}
    .workforce-line{display:grid;grid-template-columns:58px 1fr;gap:8px;padding:6px 0;font-size:.76rem}
    .workforce-line strong{color:var(--cyan)}
    .demo-float{position:fixed;right:24px;bottom:24px;width:min(360px,calc(100vw - 32px));z-index:80;background:linear-gradient(160deg,#102b48,#071626);border:1px solid #3d6b91;border-radius:18px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.45)}
    .demo-float h3{margin:5px 28px 8px 0}.demo-float p{color:var(--muted);font-size:.85rem;line-height:1.45}.demo-float small{display:block;color:var(--muted);margin-top:10px}.demo-close{position:absolute;right:10px;top:8px;border:0;background:transparent;color:white;font-size:1.35rem}
"""
if ".dashboard-grid" not in html:
    html = html.replace(css_marker, css + css_marker)

workforce_marker = '''      <div class="card">
        <h3>Northstar Workforce</h3>'''
dashboard = '''      <div class="card" id="workforceDashboard">
        <div class="sectionhead"><div><div class="kicker">Live</div><h3>Workforce Dashboard</h3></div><span class="pill good">Northstar</span></div>
        <div class="dashboard-grid">
          <div class="metric"><div class="small">Readiness</div><div class="metric-value" id="dashboardReadiness">0%</div></div>
          <div class="metric"><div class="small">Open Actions</div><div class="metric-value" id="dashboardOpenActions">0</div></div>
          <div class="metric"><div class="small">Overdue</div><div class="metric-value" id="dashboardOverdue">0</div></div>
          <div class="metric"><div class="small">Total COPQ</div><div class="metric-value" id="dashboardCopq">$0.00</div></div>
        </div>
        <div class="workforce-status">
          <div class="workforce-line"><strong>Pilot</strong><span id="pilotStatus">Building CAPA record and workflow</span></div>
          <div class="workforce-line"><strong>Atlas</strong><span id="atlasStatus">No open accountable actions</span></div>
          <div class="workforce-line"><strong>Forge</strong><span id="forgeStatus">Problem and RCA review pending</span></div>
          <div class="workforce-line"><strong>Sentinel</strong><span id="sentinelStatus">Evidence and closure review pending</span></div>
          <div class="workforce-line"><strong>Vector</strong><span id="vectorStatus">Systemic prevention review pending</span></div>
        </div>
      </div>
      <div class="card">
        <h3>Northstar Workforce</h3>'''
if 'id="workforceDashboard"' not in html:
    html = html.replace(workforce_marker, dashboard)

path.write_text(html, encoding="utf-8")
print("index.html refactored and wired to production modules")
