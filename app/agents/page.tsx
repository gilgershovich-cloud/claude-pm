import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { AgentReport, Incident } from '@/lib/types'

export const dynamic = 'force-dynamic'

const AGENTS = [
  { id: 'ceo',          label: 'מנכ"ל',             role: 'מנהל כללי',              schedule: 'כל יום 22:00',  color: '#0073EA', tier: 'ceo' },
  { id: 'vp_eng',       label: 'VP Engineering',     role: 'סמנכ"ל פיתוח',          schedule: 'כל שעה',        color: '#9D50DD', tier: 'vp' },
  { id: 'vp_marketing', label: 'VP Marketing',       role: 'סמנכ"ל שיווק',          schedule: 'כל שעה',        color: '#FF7575', tier: 'vp' },
  { id: 'vp_projects',  label: 'VP Projects',        role: 'סמנכ"ל פרויקטים',       schedule: 'כל שעה',        color: '#00CA72', tier: 'vp' },
  { id: 'vp_sales',     label: 'VP Sales',           role: 'סמנכ"ל מכירות',         schedule: 'כל שעה',        color: '#FDAB3D', tier: 'vp' },
  { id: 'vp_finance',   label: 'VP Finance',         role: 'סמנכ"ל כספים',          schedule: 'כל שעה',        color: '#E2445C', tier: 'vp' },
  { id: 'vp_it',        label: 'VP IT',              role: 'סמנכ"ל IT',             schedule: 'כל 30 דקות',    color: '#00C875', tier: 'vp' },
  { id: 'vp_hr',        label: 'VP HR',              role: 'סמנכ"ל HR',             schedule: 'כל שעה',        color: '#C4C4C4', tier: 'vp' },
]

async function getData() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: reports } = await sb
    .from('agent_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: incidents } = await sb
    .from('incidents')
    .select('*')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })

  return { reports: (reports ?? []) as AgentReport[], incidents: (incidents ?? []) as Incident[] }
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `לפני ${mins} דקות`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שעות`
  return `לפני ${Math.floor(hrs / 24)} ימים`
}

function AgentStatus({ lastReport, incidents }: { lastReport?: AgentReport; incidents: Incident[] }) {
  if (incidents.some(i => i.severity === 'critical' || i.severity === 'high')) {
    return <span style={{ background: '#FFE8EC', color: '#E2445C', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>⚠ אירוע פתוח</span>
  }
  if (!lastReport) {
    return <span style={{ background: '#f5f6f8', color: '#9699a6', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>לא פעל עדיין</span>
  }
  const mins = Math.floor((Date.now() - new Date(lastReport.created_at).getTime()) / 60000)
  if (mins < 90) {
    return <span style={{ background: '#E6F9EF', color: '#00CA72', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>● פעיל</span>
  }
  return <span style={{ background: '#FFF4E5', color: '#FDAB3D', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>● ממתין</span>
}

export default async function AgentsPage() {
  const { reports, incidents } = await getData()

  const reportsByAgent: Record<string, AgentReport[]> = {}
  for (const r of reports) {
    if (!reportsByAgent[r.agent_id]) reportsByAgent[r.agent_id] = []
    reportsByAgent[r.agent_id].push(r)
  }

  const incidentsByAgent: Record<string, Incident[]> = {}
  for (const i of incidents) {
    if (!incidentsByAgent[i.agent_id]) incidentsByAgent[i.agent_id] = []
    incidentsByAgent[i.agent_id].push(i)
  }

  const ceo = AGENTS.find(a => a.tier === 'ceo')!
  const vps = AGENTS.filter(a => a.tier === 'vp')

  return (
    <div style={{ background: '#f6f7fb', minHeight: '100%' }}>
      {/* Page header — sticky, Monday-style */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6e9ef', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#323338' }}>צוות הסוכנים</span>
        <span style={{ fontSize: 13, color: '#9699a6' }}>{AGENTS.length} סוכנים פעילים · מנהלים את כל הפרויקטים באופן אוטונומי</span>
      </div>

      <div style={{ padding: 28 }}>
      {/* CEO */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#9699a6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>מנהל כללי</div>
        <AgentCard
          agent={ceo}
          lastReport={reportsByAgent[ceo.id]?.[0]}
          agentIncidents={incidentsByAgent[ceo.id] ?? []}
          recentReports={reportsByAgent[ceo.id]?.slice(0, 3) ?? []}
        />
      </div>

      {/* Reports to CEO line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: '#e6e9ef' }} />
        <span style={{ fontSize: 12, color: '#9699a6', whiteSpace: 'nowrap' }}>מדווחים למנכ"ל</span>
        <div style={{ flex: 1, height: 1, background: '#e6e9ef' }} />
      </div>

      {/* VPs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {vps.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            lastReport={reportsByAgent[agent.id]?.[0]}
            agentIncidents={incidentsByAgent[agent.id] ?? []}
            recentReports={reportsByAgent[agent.id]?.slice(0, 2) ?? []}
          />
        ))}
      </div>
      </div>
    </div>
  )
}

function AgentCard({ agent, lastReport, agentIncidents, recentReports }: {
  agent: typeof AGENTS[0]
  lastReport?: AgentReport
  agentIncidents: Incident[]
  recentReports: AgentReport[]
}) {
  return (
    <Link href={`/agents/${agent.id}`} style={{ textDecoration: 'none', display: 'block' }}>
    <div className="agent-card" style={{
      background: '#fff', borderRadius: 12, padding: 20,
      border: '1px solid #e6e9ef',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.15s, border-color 0.15s',
    }}>
      {/* Agent header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>{agent.label}</div>
          <div style={{ fontSize: 13, color: '#676879', marginTop: 2 }}>{agent.role}</div>
          <div style={{ marginTop: 6 }}>
            <AgentStatus lastReport={lastReport} incidents={agentIncidents} />
          </div>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: agent.color + '18',
          border: `2px solid ${agent.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {agent.tier === 'ceo' ? '👔' : '🤖'}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0f1f3' }}>
        <div>
          <div style={{ fontSize: 11, color: '#9699a6', marginBottom: 2 }}>תדירות</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#323338' }}>{agent.schedule}</div>
        </div>
        {lastReport && (
          <div>
            <div style={{ fontSize: 11, color: '#9699a6', marginBottom: 2 }}>ריצה אחרונה</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#323338' }}>{timeSince(lastReport.created_at)}</div>
          </div>
        )}
        {agentIncidents.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#9699a6', marginBottom: 2 }}>אירועים פתוחים</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#E2445C' }}>{agentIncidents.length}</div>
          </div>
        )}
      </div>

      {/* Recent reports */}
      {recentReports.length > 0 ? (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9699a6', marginBottom: 8 }}>דוחות אחרונים</div>
          {recentReports.map(r => (
            <div key={r.id} style={{ marginBottom: 6, padding: '8px 10px', background: '#f8f9fc', borderRadius: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#323338', marginBottom: 2 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: '#676879', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {r.body}
              </div>
              <div style={{ fontSize: 10, color: '#9699a6', marginTop: 4 }}>{timeSince(r.created_at)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#9699a6', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>
          ממתין לדוח ראשון...
        </div>
      )}
    </div>
    </Link>
  )
}
