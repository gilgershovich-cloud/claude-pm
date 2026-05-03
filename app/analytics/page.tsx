import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface Campaign { id: string; name: string; platform: string; status: string; daily_budget_ils: number; total_spent_ils: number; objective: string; start_date: string }
interface Metric { campaign_id: string; measured_at: string; impressions: number; clicks: number; conversions: number; spend_ils: number; roas: number; cpc_ils: number; ctr: number }
interface AgentReport { id: string; agent_id: string; title: string; body: string; created_at: string }

function fmt(n: number) { return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n) }
function pct(n: number) { return (n * 100).toFixed(1) + '%' }

const PLATFORM_COLOR: Record<string, string> = { meta: '#1877F2', google: '#4285F4', tiktok: '#000', instagram: '#E1306C', linkedin: '#0A66C2', youtube: '#FF0000' }
const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  active:           { label: 'פעיל',    bg: '#E6F9EF', color: '#00CA72' },
  pending_approval: { label: 'ממתין',   bg: '#FFF4E5', color: '#FDAB3D' },
  paused:           { label: 'מושהה',   bg: '#f5f6f8', color: '#9699a6' },
  ended:            { label: 'הסתיים',  bg: '#f5f6f8', color: '#9699a6' },
  draft:            { label: 'טיוטה',   bg: '#f5f6f8', color: '#9699a6' },
}

async function getData() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [{ data: campaigns }, { data: metrics }, { data: reports }] = await Promise.all([
    sb.from('ad_campaigns').select('*').order('created_at', { ascending: false }),
    sb.from('campaign_metrics').select('*').order('measured_at', { ascending: false }).limit(100),
    sb.from('agent_reports').select('*').eq('agent_id', 'vp_marketing').order('created_at', { ascending: false }).limit(5),
  ])
  return {
    campaigns: (campaigns ?? []) as Campaign[],
    metrics: (metrics ?? []) as Metric[],
    reports: (reports ?? []) as AgentReport[],
  }
}

export default async function AnalyticsPage() {
  const { campaigns, metrics, reports } = await getData()

  const totalSpend = campaigns.reduce((s, c) => s + Number(c.total_spent_ils ?? 0), 0)
  const totalConversions = metrics.reduce((s, m) => s + Number(m.conversions ?? 0), 0)
  const totalImpressions = metrics.reduce((s, m) => s + Number(m.impressions ?? 0), 0)
  const avgROAS = metrics.length > 0 ? metrics.reduce((s, m) => s + Number(m.roas ?? 0), 0) / metrics.length : 0

  return (
    <div style={{ background: '#f6f7fb', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e6e9ef', padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 20 }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#323338' }}>אנליטיקה</span>
        <span style={{ fontSize: 13, color: '#9699a6' }}>VP Marketing מנטר ומייעל בזמן אמת</span>
      </div>

      <div style={{ padding: 28 }}>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'סה"כ הוצאות פרסום', value: fmt(totalSpend), sub: `${campaigns.length} קמפיינים`, color: '#E2445C' },
            { label: 'המרות', value: totalConversions.toLocaleString(), sub: 'כל הפלטפורמות', color: '#00CA72' },
            { label: 'חשיפות', value: totalImpressions > 1000 ? (totalImpressions / 1000).toFixed(0) + 'K' : totalImpressions.toString(), sub: 'impressions', color: '#0073EA' },
            { label: 'ROAS ממוצע', value: avgROAS > 0 ? avgROAS.toFixed(2) + 'x' : '—', sub: 'Return on Ad Spend', color: '#9D50DD' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e6e9ef' }}>
              <div style={{ fontSize: 12, color: '#676879', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 12, color: '#9699a6' }}>{sub}</div>
            </div>
          ))}
        </div>

        {campaigns.length === 0 ? (
          /* Empty state */
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', padding: '48px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#323338', marginBottom: 8 }}>VP Marketing עוד לא הפעיל קמפיינים</div>
            <div style={{ fontSize: 14, color: '#676879', marginBottom: 24, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 24px' }}>
              כאשר VP Marketing יפעיל קמפיינים, תראה כאן את כל הנתונים בזמן אמת:
              ROAS, CPC, CTR, המרות, ועוד.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 500, margin: '0 auto' }}>
              {['Meta Ads', 'Google Ads', 'TikTok'].map(p => (
                <div key={p} style={{ background: '#f8f9fc', borderRadius: 8, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#676879' }}>{p}</div>
              ))}
            </div>
          </div>
        ) : (
          /* Campaigns table */
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e9ef' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>קמפיינים פעילים</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f6f8' }}>
                    {['קמפיין', 'פלטפורמה', 'סטטוס', 'תקציב יומי', 'הוצאה כוללת', 'ROAS', 'המרות'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', fontSize: 11, fontWeight: 600, color: '#676879', textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => {
                    const s = STATUS_CFG[c.status] ?? STATUS_CFG.draft
                    const cMetrics = metrics.filter(m => m.campaign_id === c.id)
                    const convs = cMetrics.reduce((s, m) => s + Number(m.conversions ?? 0), 0)
                    const roas = cMetrics.length > 0 ? cMetrics.reduce((s, m) => s + Number(m.roas ?? 0), 0) / cMetrics.length : 0
                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid #f0f1f3' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#323338' }}>{c.name}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: (PLATFORM_COLOR[c.platform] ?? '#ccc') + '20', color: PLATFORM_COLOR[c.platform] ?? '#676879', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                            {c.platform}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#323338' }}>{fmt(c.daily_budget_ils)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#E2445C', fontWeight: 600 }}>{fmt(Number(c.total_spent_ils ?? 0))}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: roas >= 2 ? '#00CA72' : roas > 0 ? '#FDAB3D' : '#9699a6', fontWeight: 600 }}>{roas > 0 ? roas.toFixed(2) + 'x' : '—'}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#323338' }}>{convs}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VP Marketing recent reports */}
        {reports.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e9ef' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>דוחות VP Marketing</span>
            </div>
            {reports.map(r => (
              <div key={r.id} style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f3' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#323338' }}>{r.title}</span>
                  <span style={{ fontSize: 11, color: '#9699a6' }}>{new Date(r.created_at).toLocaleDateString('he-IL')}</span>
                </div>
                <div style={{ fontSize: 13, color: '#676879', lineHeight: 1.6 }}>{r.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
