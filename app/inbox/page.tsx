export const dynamic = 'force-dynamic'

import { getInboxMessages, getPendingDecisions, getOpenIncidents, markMessageRead, markAllRead, resolveDecision } from '@/lib/actions'
import type { AgentMessage, AgentDecision, Incident } from '@/lib/types'

const AGENT_LABELS: Record<string, { name: string; color: string }> = {
  ceo:            { name: 'מנכ"ל',         color: '#9D50DD' },
  vp_engineering: { name: 'VP Engineering', color: '#0073EA' },
  vp_finance:     { name: 'VP כספים',       color: '#00CA72' },
  vp_marketing:   { name: 'VP שיווק',       color: '#FDAB3D' },
  vp_it:          { name: 'VP IT',          color: '#FF7575' },
  vp_hr:          { name: 'VP HR',          color: '#E2445C' },
  vp_sales:       { name: 'VP מכירות',      color: '#00C875' },
}

const PRIORITY_CONFIG = {
  high:   { label: 'גבוה', bg: '#E2445C', color: '#fff' },
  medium: { label: 'בינוני', bg: '#FDAB3D', color: '#fff' },
  low:    { label: 'נמוך', bg: '#C4C4C4', color: '#323338' },
}

const SEVERITY_CONFIG = {
  critical: { label: 'קריטי', bg: '#E2445C', color: '#fff' },
  high:     { label: 'גבוה',  bg: '#FF7575', color: '#fff' },
  medium:   { label: 'בינוני', bg: '#FDAB3D', color: '#fff' },
  low:      { label: 'נמוך',  bg: '#C4C4C4', color: '#323338' },
}

function AgentBadge({ agentId }: { agentId: string }) {
  const cfg = AGENT_LABELS[agentId] ?? { name: agentId, color: '#8596a9' }
  return (
    <span style={{
      background: cfg.color + '22', color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600,
    }}>
      {cfg.name}
    </span>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      background: bg, color, borderRadius: 20, padding: '2px 10px',
      fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
    }}>
      {label}
    </span>
  )
}

export default async function InboxPage() {
  const [messages, decisions, incidents] = await Promise.all([
    getInboxMessages(),
    getPendingDecisions(),
    getOpenIncidents(),
  ])

  const unreadCount = messages.filter(m => !m.is_read).length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, fontFamily: 'system-ui, sans-serif', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#323338' }}>
            Inbox
            {unreadCount > 0 && (
              <span style={{
                marginRight: 10, background: '#0073EA', color: '#fff',
                borderRadius: 20, padding: '2px 9px', fontSize: 13, fontWeight: 700,
              }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#8596a9', fontSize: 14 }}>
            הודעות מהצוות, החלטות ממתינות ואינצידנטים
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllRead}>
            <button type="submit" style={{
              background: 'none', border: '1px solid #d0d4e4',
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
              fontSize: 13, color: '#676879',
            }}>
              סמן הכל כנקרא
            </button>
          </form>
        )}
      </div>

      {/* Pending Decisions */}
      {decisions.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#323338' }}>
            החלטות ממתינות לאישורך
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {decisions.map((d: AgentDecision) => (
              <div key={d.id} style={{
                background: '#fff8f0', border: '1px solid #FDAB3D44',
                borderRadius: 10, padding: '16px 20px',
                borderRight: '4px solid #FDAB3D',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <AgentBadge agentId={d.agent_id} />
                  <Pill
                    label={`סיכון: ${d.risk_tier === 'high' ? 'גבוה' : d.risk_tier === 'medium' ? 'בינוני' : 'נמוך'}`}
                    bg={d.risk_tier === 'high' ? '#E2445C' : d.risk_tier === 'medium' ? '#FDAB3D' : '#C4C4C4'}
                    color={d.risk_tier === 'low' ? '#323338' : '#fff'}
                  />
                  <span style={{ marginRight: 'auto', color: '#8596a9', fontSize: 12 }}>{formatTime(d.created_at)}</span>
                </div>
                <div style={{ fontWeight: 600, color: '#323338', marginBottom: 6 }}>{d.title}</div>
                <p style={{ margin: '0 0 14px', color: '#676879', fontSize: 14, lineHeight: 1.6 }}>{d.description}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <form action={resolveDecision.bind(null, d.id, 'approved')}>
                    <button type="submit" style={{
                      background: '#00C875', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}>
                      אשר
                    </button>
                  </form>
                  <form action={resolveDecision.bind(null, d.id, 'rejected')}>
                    <button type="submit" style={{
                      background: '#E2445C', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '7px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                    }}>
                      דחה
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open Incidents */}
      {incidents.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#323338' }}>
            אינצידנטים פתוחים
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incidents.map((inc: Incident) => {
              const sev = SEVERITY_CONFIG[inc.severity]
              return (
                <div key={inc.id} style={{
                  background: '#fff3f5', border: '1px solid #E2445C33',
                  borderRadius: 10, padding: '14px 20px',
                  borderRight: `4px solid ${sev.bg}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <AgentBadge agentId={inc.agent_id} />
                    <Pill label={sev.label} bg={sev.bg} color={sev.color} />
                    {inc.project && (
                      <span style={{ color: '#0073EA', fontSize: 12, fontWeight: 600 }}>{inc.project}</span>
                    )}
                    <span style={{ marginRight: 'auto', color: '#8596a9', fontSize: 12 }}>{formatTime(inc.created_at)}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: '#323338', marginBottom: 4 }}>{inc.title}</div>
                  <p style={{ margin: 0, color: '#676879', fontSize: 13, lineHeight: 1.5 }}>{inc.description}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Messages */}
      <section>
        <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: '#323338' }}>
          הודעות
        </h2>
        {messages.length === 0 ? (
          <div style={{
            background: '#f6f7fb', borderRadius: 10, padding: '40px 20px',
            textAlign: 'center', color: '#8596a9', fontSize: 14,
          }}>
            אין הודעות חדשות
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.map((msg: AgentMessage) => {
              const pri = PRIORITY_CONFIG[msg.priority]
              return (
                <div key={msg.id} style={{
                  background: msg.is_read ? '#f6f7fb' : '#fff',
                  border: `1px solid ${msg.is_read ? '#e6e9ef' : '#c3d4f7'}`,
                  borderRadius: 10, padding: '16px 20px',
                  borderRight: `4px solid ${msg.is_read ? '#e6e9ef' : '#0073EA'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {!msg.is_read && (
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#0073EA', flexShrink: 0,
                      }} />
                    )}
                    <AgentBadge agentId={msg.from_agent} />
                    <Pill label={pri.label} bg={pri.bg} color={pri.color} />
                    <span style={{ marginRight: 'auto', color: '#8596a9', fontSize: 12 }}>{formatTime(msg.created_at)}</span>
                  </div>
                  <div style={{ fontWeight: msg.is_read ? 500 : 700, color: '#323338', marginBottom: 6, fontSize: 15 }}>
                    {msg.subject}
                  </div>
                  <p style={{ margin: '0 0 10px', color: '#676879', fontSize: 14, lineHeight: 1.6 }}>{msg.body}</p>
                  {!msg.is_read && (
                    <form action={markMessageRead.bind(null, msg.id)}>
                      <button type="submit" style={{
                        background: 'none', border: '1px solid #d0d4e4',
                        borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
                        fontSize: 12, color: '#676879',
                      }}>
                        סמן כנקרא
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
