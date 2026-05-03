import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { AgentReport, Incident } from '@/lib/types'
import { AgentChat } from '@/components/AgentChat'

export const dynamic = 'force-dynamic'

const AGENTS: Record<string, { label: string; role: string; schedule: string; color: string; desc: string }> = {
  ceo:          { label: 'מנכ"ל',           role: 'מנהל כללי',        schedule: 'כל יום 22:00',  color: '#0073EA', desc: 'מנהל את כל הסוכנים, שולח דוח יומי לגיל, מקבל החלטות גדולות' },
  vp_eng:       { label: 'VP Engineering',  role: 'סמנכ"ל פיתוח',     schedule: 'כל שעה',        color: '#9D50DD', desc: 'מנטר Railway, Vercel, GitHub — מתקן באגים קטנים לבד, מדווח על incidents' },
  vp_marketing: { label: 'VP Marketing',    role: 'סמנכ"ל שיווק',     schedule: 'כל שעה',        color: '#FF7575', desc: 'קמפיינים, analytics, עמודי הצעה — מנטר ROAS ו-CPC בזמן אמת' },
  vp_projects:  { label: 'VP Projects',     role: 'סמנכ"ל פרויקטים',  schedule: 'כל שעה',        color: '#00CA72', desc: 'עוקב אחרי כל הפרויקטים בבורד, מעדכן סטטוסים, sprint planning' },
  vp_sales:     { label: 'VP Sales',        role: 'סמנכ"ל מכירות',    schedule: 'כל שעה',        color: '#FDAB3D', desc: 'מנטר לידים, המרות, Green Invoice — מדווח על כל עסקה' },
  vp_finance:   { label: 'VP Finance',      role: 'סמנכ"ל כספים',     schedule: 'כל שעה',        color: '#E2445C', desc: 'עלויות API, הכנסות, P&L — מנטר ומייעל הוצאות' },
  vp_it:        { label: 'VP IT',           role: 'סמנכ"ל IT',        schedule: 'כל 30 דקות',    color: '#00C875', desc: 'תשתית, אבטחה, monitoring — Vercel, Railway, Supabase' },
  vp_hr:        { label: 'VP HR',           role: 'סמנכ"ל HR',        schedule: 'כל שעה',        color: '#818589', desc: 'ביצועי סוכנים, team health, גיוס/פיטורים' },
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `לפני ${mins} דק'`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שעות`
  return `לפני ${Math.floor(hrs / 24)} ימים`
}

async function getData(agentId: string) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [{ data: reports }, { data: incidents }, { data: memory }, { data: messages }] = await Promise.all([
    sb.from('agent_reports').select('*').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(20),
    sb.from('incidents').select('*').eq('agent_id', agentId).order('created_at', { ascending: false }).limit(10),
    sb.from('agent_memory').select('*').eq('agent_id', agentId).order('updated_at', { ascending: false }),
    sb.from('agent_messages').select('*').eq('from_agent', agentId).order('created_at', { ascending: false }).limit(10),
  ])
  return {
    reports: (reports ?? []) as AgentReport[],
    incidents: (incidents ?? []) as Incident[],
    memory: memory ?? [],
    messages: messages ?? [],
  }
}

const SEV_COLOR: Record<string, string> = { low: '#00CA72', medium: '#FDAB3D', high: '#E2445C', critical: '#8B0000' }
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  open:        { bg: '#FFE8EC', color: '#E2445C' },
  in_progress: { bg: '#FFF4E5', color: '#FDAB3D' },
  resolved:    { bg: '#E6F9EF', color: '#00CA72' },
}

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agent = AGENTS[id]
  if (!agent) notFound()

  const { reports, incidents, memory, messages } = await getData(id)
  const lastReport = reports[0]
  const openIncidents = incidents.filter(i => i.status !== 'resolved')

  return (
    <div style={{ background: '#f6f7fb', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6e9ef', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: agent.color + '20', border: `2px solid ${agent.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
          {id === 'ceo' ? '👔' : '🤖'}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#323338' }}>{agent.label}</div>
          <div style={{ fontSize: 13, color: '#676879' }}>{agent.role} · {agent.schedule}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {openIncidents.length > 0 && (
            <span style={{ background: '#FFE8EC', color: '#E2445C', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {openIncidents.length} incidents פתוחים
            </span>
          )}
          {lastReport && (
            <span style={{ background: '#E6F9EF', color: '#00CA72', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              ● פעיל · {timeSince(lastReport.created_at)}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* About */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9699a6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>תיאור תפקיד</div>
            <div style={{ fontSize: 14, color: '#323338', lineHeight: 1.6 }}>{agent.desc}</div>
          </div>

          {/* Reports */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e9ef', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>דוחות</span>
              <span style={{ background: '#f0f1f3', color: '#676879', padding: '1px 8px', borderRadius: 20, fontSize: 12 }}>{reports.length}</span>
            </div>
            {reports.length === 0 ? (
              <div style={{ padding: '24px 20px', color: '#9699a6', fontSize: 13, fontStyle: 'italic' }}>ממתין לדוח ראשון...</div>
            ) : reports.map(r => (
              <div key={r.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f3' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#323338' }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: '#9699a6', flexShrink: 0 }}>{timeSince(r.created_at)}</div>
                </div>
                <div style={{ fontSize: 13, color: '#676879', lineHeight: 1.6 }}>{r.body}</div>
                <div style={{ marginTop: 6 }}>
                  <span style={{ background: '#f5f6f8', color: '#9699a6', padding: '1px 7px', borderRadius: 4, fontSize: 11 }}>{r.report_type}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Incidents */}
          {incidents.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e9ef' }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>אירועים</span>
              </div>
              {incidents.map(inc => {
                const s = STATUS_COLOR[inc.status] ?? STATUS_COLOR.open
                return (
                  <div key={inc.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f3', display: 'flex', gap: 12 }}>
                    <div style={{ width: 3, borderRadius: 2, background: SEV_COLOR[inc.severity] ?? '#ccc', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#323338' }}>{inc.title}</span>
                        <span style={{ background: s.bg, color: s.color, padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{inc.status}</span>
                        {inc.project && <span style={{ background: '#f0f1f3', color: '#676879', padding: '1px 7px', borderRadius: 4, fontSize: 11 }}>{inc.project}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#676879' }}>{inc.description}</div>
                      <div style={{ fontSize: 11, color: '#9699a6', marginTop: 4 }}>{timeSince(inc.created_at)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Side column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Chat */}
          <AgentChat agentId={id} agentLabel={agent.label} agentColor={agent.color} />

          {/* Stats */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9699a6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>סטטיסטיקות</div>
            {[
              { label: 'דוחות שנשלחו', value: reports.length },
              { label: 'incidents פתוחים', value: openIncidents.length },
              { label: 'הודעות שנשלחו', value: messages.length },
              { label: 'keys בזיכרון', value: memory.length },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#676879' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#323338' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Memory */}
          {memory.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e6e9ef' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#323338' }}>זיכרון</span>
              </div>
              {(memory as Array<{ key: string; value: unknown; updated_at: string }>).map(m => (
                <div key={m.key} style={{ padding: '10px 16px', borderBottom: '1px solid #f0f1f3' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#323338', marginBottom: 2 }}>{m.key}</div>
                  <div style={{ fontSize: 11, color: '#676879', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {JSON.stringify(m.value).slice(0, 80)}{JSON.stringify(m.value).length > 80 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent messages */}
          {messages.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e6e9ef' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#323338' }}>הודעות אחרונות</span>
              </div>
              {(messages as Array<{ id: string; to_agent: string; subject: string; created_at: string }>).slice(0, 5).map(m => (
                <div key={m.id} style={{ padding: '10px 16px', borderBottom: '1px solid #f0f1f3' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#323338' }}>→ {m.to_agent}</div>
                  <div style={{ fontSize: 11, color: '#676879' }}>{m.subject}</div>
                  <div style={{ fontSize: 10, color: '#9699a6', marginTop: 2 }}>{timeSince(m.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
