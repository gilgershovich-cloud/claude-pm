export default function ApiDocsPage() {
  const BASE = 'https://claude-9jz8ta0lf-gilgershovich-clouds-projects.vercel.app'

  const endpoints = [
    {
      group: 'Board',
      color: '#0073EA',
      routes: [
        { method: 'GET', path: '/api/board', auth: false, desc: 'קבל את כל הבורד — Groups + Items + Sub-items', body: null, example: `curl ${BASE}/api/board` },
      ],
    },
    {
      group: 'הודעות',
      color: '#9D50DD',
      routes: [
        { method: 'GET', path: '/api/agent-messages?to=gil', auth: false, desc: 'קרא הודעות (to=gil | to=vp_eng | ...)', body: null, example: `curl "${BASE}/api/agent-messages?to=gil&unread=true"` },
        { method: 'POST', path: '/api/agent-messages', auth: true, desc: 'שלח הודעה לסוכן אחר או לגיל', body: '{ "from_agent": "vp_eng", "to_agent": "gil", "subject": "...", "body": "...", "priority": "high" }', example: null },
      ],
    },
    {
      group: 'דוחות',
      color: '#00CA72',
      routes: [
        { method: 'GET', path: '/api/agent-reports?agent_id=vp_eng', auth: false, desc: 'קבל דוחות (אופציונלי: agent_id, limit)', body: null, example: `curl "${BASE}/api/agent-reports?limit=5"` },
        { method: 'POST', path: '/api/agent-reports', auth: true, desc: 'שלח דוח תקופתי', body: '{ "agent_id": "vp_eng", "title": "...", "body": "...", "report_type": "daily" }', example: null },
      ],
    },
    {
      group: 'אירועים',
      color: '#E2445C',
      routes: [
        { method: 'GET', path: '/api/incidents?status=open', auth: false, desc: 'קבל אירועים (status: open | in_progress | resolved)', body: null, example: `curl "${BASE}/api/incidents?status=open"` },
        { method: 'POST', path: '/api/incidents', auth: true, desc: 'דווח אירוע חדש', body: '{ "agent_id": "vp_it", "title": "...", "description": "...", "severity": "high", "project": "social-ai" }', example: null },
        { method: 'PATCH', path: '/api/incidents/{id}', auth: true, desc: 'עדכן סטטוס אירוע', body: '{ "status": "resolved" }', example: null },
      ],
    },
    {
      group: 'החלטות',
      color: '#FDAB3D',
      routes: [
        { method: 'GET', path: '/api/decisions?status=pending', auth: false, desc: 'קבל החלטות ממתינות', body: null, example: `curl "${BASE}/api/decisions"` },
        { method: 'POST', path: '/api/decisions', auth: true, desc: 'בקש החלטה מגיל', body: '{ "agent_id": "ceo", "title": "...", "description": "...", "risk_tier": "high" }', example: null },
        { method: 'PATCH', path: '/api/decisions/{id}', auth: true, desc: 'עדכן תשובת גיל', body: '{ "status": "approved" }', example: null },
      ],
    },
    {
      group: 'זיכרון',
      color: '#00C875',
      routes: [
        { method: 'GET', path: '/api/agent-memory?agent_id=vp_eng', auth: false, desc: 'קרא זיכרון של סוכן (אופציונלי: key)', body: null, example: `curl "${BASE}/api/agent-memory?agent_id=vp_eng"` },
        { method: 'POST', path: '/api/agent-memory', auth: true, desc: 'כתוב/עדכן ערך בזיכרון', body: '{ "agent_id": "vp_eng", "key": "last_deploy", "value": { "sha": "abc123", "time": "2026-05-01T22:00:00Z" } }', example: null },
      ],
    },
    {
      group: 'כספים',
      color: '#FF7575',
      routes: [
        { method: 'GET', path: '/api/finance', auth: false, desc: 'קבל כל הכנסות/הוצאות + סיכום P&L', body: null, example: `curl "${BASE}/api/finance?type=expense"` },
        { method: 'POST', path: '/api/finance', auth: true, desc: 'הוסף רשומת כסף', body: '{ "agent_id": "vp_finance", "type": "expense", "amount_ils": 150, "description": "Anthropic API", "category": "api_usage" }', example: null },
      ],
    },
  ]

  const METHOD_COLOR: Record<string, string> = {
    GET: '#0073EA', POST: '#00CA72', PATCH: '#FDAB3D', DELETE: '#E2445C',
  }

  return (
    <div style={{ padding: 32, background: '#f6f7fb', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#323338', margin: 0 }}>API לסוכנים</h1>
        <p style={{ color: '#676879', fontSize: 14, marginTop: 6 }}>
          כל הסוכנים משתמשים ב-API הזה כדי לקרוא ולכתוב נתונים במערכת
        </p>
      </div>

      {/* Auth box */}
      <div style={{ background: '#1f2d3d', borderRadius: 10, padding: 20, marginBottom: 28, color: '#fff' }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>אימות</div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#8596a9', marginBottom: 6 }}>
          Base URL: <span style={{ color: '#63b3ed' }}>{BASE}</span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#8596a9', marginBottom: 6 }}>
          Header (POST/PATCH): <span style={{ color: '#68d391' }}>X-Agent-Key: {'$'}{'{AGENT_API_KEY}'}</span>
        </div>
        <div style={{ background: '#293d50', borderRadius: 6, padding: '10px 14px', marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#8596a9', marginBottom: 4 }}>דוגמת curl (POST עם auth):</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', wordBreak: 'break-all' }}>
            {`curl -X POST ${BASE}/api/agent-reports \\`}<br />
            {`  -H "X-Agent-Key: $AGENT_API_KEY" \\`}<br />
            {`  -H "Content-Type: application/json" \\`}<br />
            {`  -d '{"agent_id":"vp_eng","title":"Health check","body":"All good","report_type":"daily"}'`}
          </div>
        </div>
      </div>

      {/* Endpoints */}
      {endpoints.map(group => (
        <div key={group.group} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 4, height: 18, borderRadius: 2, background: group.color }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#323338' }}>{group.group}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.routes.map((route, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 8, padding: 16,
                border: '1px solid #e6e9ef',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    background: METHOD_COLOR[route.method] + '22',
                    color: METHOD_COLOR[route.method],
                    fontFamily: 'monospace', fontWeight: 700, fontSize: 12,
                    padding: '2px 8px', borderRadius: 4,
                  }}>{route.method}</span>
                  <code style={{ fontFamily: 'monospace', fontSize: 13, color: '#323338', fontWeight: 600 }}>{route.path}</code>
                  {route.auth && (
                    <span style={{ fontSize: 11, color: '#FDAB3D', background: '#FFF4E5', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>🔑 מפתח נדרש</span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#676879', marginBottom: route.body || route.example ? 10 : 0 }}>{route.desc}</div>
                {route.body && (
                  <div>
                    <div style={{ fontSize: 11, color: '#9699a6', marginBottom: 4 }}>Request body (JSON):</div>
                    <pre style={{
                      background: '#f8f9fc', borderRadius: 6, padding: '8px 12px',
                      fontFamily: 'monospace', fontSize: 12, color: '#323338',
                      margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>{route.body}</pre>
                  </div>
                )}
                {route.example && (
                  <div>
                    <div style={{ fontSize: 11, color: '#9699a6', marginBottom: 4 }}>דוגמה:</div>
                    <pre style={{
                      background: '#1f2d3d', borderRadius: 6, padding: '8px 12px',
                      fontFamily: 'monospace', fontSize: 12, color: '#a8d8a8',
                      margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>{route.example}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
