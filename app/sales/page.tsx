import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface ProposalPage { id: string; group_id: string; slug: string; title: string; payment_provider: string; price_ils: number; published: boolean; url: string | null; created_at: string }
interface AgentMessage { id: string; from_agent: string; subject: string; body: string; priority: string; created_at: string }

function fmt(n: number) { return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n) }
function timeSince(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return `לפני ${m} דק'`
  const h = Math.floor(m / 60)
  if (h < 24) return `לפני ${h} שעות`
  return `לפני ${Math.floor(h / 24)} ימים`
}

async function getData() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [{ data: proposals }, { data: revenue }, { data: messages }] = await Promise.all([
    sb.from('proposal_pages').select('*').order('created_at', { ascending: false }),
    sb.from('finance_entries').select('*').eq('type', 'revenue').order('date', { ascending: false }),
    sb.from('agent_messages').select('*').eq('from_agent', 'vp_sales').order('created_at', { ascending: false }).limit(10),
  ])
  return {
    proposals: (proposals ?? []) as ProposalPage[],
    revenue: revenue ?? [],
    messages: (messages ?? []) as AgentMessage[],
  }
}

export default async function SalesPage() {
  const { proposals, revenue, messages } = await getData()

  const totalRevenue = revenue.reduce((s: number, e: { amount_ils: number }) => s + Number(e.amount_ils), 0)
  const publishedProposals = proposals.filter(p => p.published)

  return (
    <div style={{ background: '#f6f7fb', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6e9ef', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#323338' }}>מכירות</span>
        <span style={{ fontSize: 13, color: '#9699a6' }}>VP Sales מנטר כל רכישה בזמן אמת</span>
      </div>

      <div style={{ padding: 28 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'סה"כ הכנסות', value: fmt(totalRevenue), sub: `${revenue.length} עסקאות`, color: '#00CA72' },
            { label: 'עמודי הצעה פעילים', value: String(publishedProposals.length), sub: `מתוך ${proposals.length} סה"כ`, color: '#0073EA' },
            { label: 'ממוצע לעסקה', value: revenue.length > 0 ? fmt(totalRevenue / revenue.length) : '—', sub: 'Average Order Value', color: '#9D50DD' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e6e9ef' }}>
              <div style={{ fontSize: 12, color: '#676879', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 12, color: '#9699a6' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Proposal pages */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e9ef', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>עמודי הצעה</span>
            <span style={{ background: '#f0f1f3', color: '#676879', padding: '1px 8px', borderRadius: 20, fontSize: 12 }}>{proposals.length}</span>
          </div>
          {proposals.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9699a6', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💼</div>
              <div style={{ fontWeight: 600, color: '#676879', marginBottom: 4 }}>אין עמודי הצעה עדיין</div>
              <div>VP Marketing יצור עמודים אוטומטית לכל פרויקט</div>
            </div>
          ) : proposals.map(p => (
            <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f3', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#323338', marginBottom: 2 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: '#9699a6' }}>/proposal/{p.slug}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#323338' }}>{fmt(p.price_ils)}</div>
              <div style={{ fontSize: 12, color: '#676879' }}>{p.payment_provider}</div>
              <span style={{ background: p.published ? '#E6F9EF' : '#f5f6f8', color: p.published ? '#00CA72' : '#9699a6', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                {p.published ? 'פעיל' : 'טיוטה'}
              </span>
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0073EA', textDecoration: 'none', flexShrink: 0 }}>
                  פתח ↗
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Revenue log */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e9ef', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>הכנסות</span>
            <span style={{ background: '#E6F9EF', color: '#00CA72', padding: '1px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{fmt(totalRevenue)}</span>
          </div>
          {revenue.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9699a6', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>💳</div>
              <div style={{ fontWeight: 600, color: '#676879', marginBottom: 4 }}>ממתין לרכישה ראשונה</div>
              <div>VP Sales ידווח כאן עם כל עסקה מ-Green Invoice</div>
            </div>
          ) : (revenue as Array<{ id: string; description: string; amount_ils: number; project: string | null; source: string; date: string }>).map(e => (
            <div key={e.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f0f1f3', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#323338' }}>{e.description}</div>
                {e.project && <div style={{ fontSize: 12, color: '#9699a6' }}>{e.project}</div>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#00CA72' }}>+{fmt(Number(e.amount_ils))}</div>
              <div style={{ fontSize: 12, color: '#9699a6' }}>{e.date}</div>
            </div>
          ))}
        </div>

        {/* VP Sales reports */}
        {messages.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e9ef' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>הודעות VP Sales</span>
            </div>
            {messages.map(m => (
              <div key={m.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f0f1f3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#323338' }}>{m.subject}</span>
                  <span style={{ fontSize: 11, color: '#9699a6' }}>{timeSince(m.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#676879', lineHeight: 1.5 }}>{m.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
