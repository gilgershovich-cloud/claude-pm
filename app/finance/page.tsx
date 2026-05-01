import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface FinanceEntry {
  id: string
  type: 'expense' | 'revenue'
  amount_ils: number
  description: string
  category: string
  project: string | null
  source: string
  date: string
  created_by: string
}

async function getData() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await sb
    .from('finance_entries')
    .select('*')
    .order('date', { ascending: false })
    .limit(200)

  return (data ?? []) as FinanceEntry[]
}

function formatILS(n: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(n)
}

const CATEGORY_LABELS: Record<string, string> = {
  api_usage: 'שימוש API',
  infrastructure: 'תשתית',
  sales: 'מכירות',
  marketing: 'שיווק',
  other: 'אחר',
}

const PROJECT_LABELS: Record<string, string> = {
  social_ai: 'Social AI',
  md_clinic: 'M.D Clinic',
  claude_pm: 'Claude OS',
  general: 'כללי',
}

export default async function FinancePage() {
  const entries = await getData()

  const expenses = entries.filter(e => e.type === 'expense')
  const revenue = entries.filter(e => e.type === 'revenue')
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount_ils), 0)
  const totalRevenue = revenue.reduce((s, e) => s + Number(e.amount_ils), 0)
  const profit = totalRevenue - totalExpenses

  const byProject: Record<string, { exp: number; rev: number }> = {}
  for (const e of entries) {
    const proj = e.project ?? 'general'
    if (!byProject[proj]) byProject[proj] = { exp: 0, rev: 0 }
    if (e.type === 'expense') byProject[proj].exp += Number(e.amount_ils)
    else byProject[proj].rev += Number(e.amount_ils)
  }

  return (
    <div style={{ padding: 32, background: '#f6f7fb', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#323338', margin: 0 }}>כספים</h1>
        <p style={{ color: '#676879', fontSize: 14, marginTop: 6 }}>
          עדכון אוטומטי ע"י VP Finance · הנתונים מוזנים מכל המערכות
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <KpiCard label="הוצאות חודש נוכחי" value={formatILS(totalExpenses)} color="#E2445C" sub={`${expenses.length} רשומות`} />
        <KpiCard label="הכנסות חודש נוכחי" value={formatILS(totalRevenue)} color="#00CA72" sub={`${revenue.length} רשומות`} />
        <KpiCard
          label="רווח / הפסד"
          value={formatILS(profit)}
          color={profit >= 0 ? '#00CA72' : '#E2445C'}
          sub={profit >= 0 ? 'רווח ✓' : 'הפסד — צריך פעולה'}
        />
      </div>

      {/* By project */}
      {Object.keys(byProject).length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', padding: 20, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#323338', marginBottom: 14 }}>לפי פרויקט</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {Object.entries(byProject).map(([proj, nums]) => (
              <div key={proj} style={{ background: '#f8f9fc', borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#323338', marginBottom: 8 }}>
                  {PROJECT_LABELS[proj] ?? proj}
                </div>
                <div style={{ fontSize: 12, color: '#E2445C', marginBottom: 2 }}>הוצאות: {formatILS(nums.exp)}</div>
                <div style={{ fontSize: 12, color: '#00CA72' }}>הכנסות: {formatILS(nums.rev)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e9ef', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>הוצאות</span>
          <span style={{ background: '#FFE8EC', color: '#E2445C', padding: '1px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{formatILS(totalExpenses)}</span>
        </div>
        <EntryTable entries={expenses} />
      </div>

      {/* Revenue table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e6e9ef', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#323338' }}>הכנסות</span>
          <span style={{ background: '#E6F9EF', color: '#00CA72', padding: '1px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{formatILS(totalRevenue)}</span>
        </div>
        {revenue.length === 0 ? (
          <div style={{ padding: '24px 20px', color: '#9699a6', fontSize: 13, fontStyle: 'italic' }}>
            אין הכנסות עדיין · VP Sales ידווח כאן עם כל עסקה
          </div>
        ) : (
          <EntryTable entries={revenue} />
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e6e9ef' }}>
      <div style={{ fontSize: 12, color: '#676879', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#9699a6' }}>{sub}</div>
    </div>
  )
}

function EntryTable({ entries }: { entries: FinanceEntry[] }) {
  if (entries.length === 0) {
    return (
      <div style={{ padding: '24px 20px', color: '#9699a6', fontSize: 13, fontStyle: 'italic' }}>
        אין רשומות
      </div>
    )
  }

  const COL = ['תאריך', 'תיאור', 'קטגוריה', 'פרויקט', 'מקור', 'סכום']
  const WIDTHS = [100, 260, 110, 100, 90, 90]

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', background: '#f5f6f8', borderBottom: '1px solid #e6e9ef' }}>
        {COL.map((c, i) => (
          <div key={c} style={{ width: WIDTHS[i], padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#676879', flexShrink: 0 }}>{c}</div>
        ))}
      </div>
      {entries.map(e => (
        <div key={e.id} style={{ display: 'flex', borderBottom: '1px solid #f0f1f3', alignItems: 'center' }}>
          <div style={{ width: WIDTHS[0], padding: '10px 12px', fontSize: 13, color: '#676879', flexShrink: 0 }}>{e.date}</div>
          <div style={{ width: WIDTHS[1], padding: '10px 12px', fontSize: 13, color: '#323338', fontWeight: 500, flexShrink: 0 }}>{e.description}</div>
          <div style={{ width: WIDTHS[2], padding: '10px 12px', fontSize: 12, color: '#676879', flexShrink: 0 }}>{CATEGORY_LABELS[e.category] ?? e.category}</div>
          <div style={{ width: WIDTHS[3], padding: '10px 12px', fontSize: 12, color: '#676879', flexShrink: 0 }}>{PROJECT_LABELS[e.project ?? 'general'] ?? e.project}</div>
          <div style={{ width: WIDTHS[4], padding: '10px 12px', fontSize: 12, color: '#9699a6', flexShrink: 0 }}>{e.source}</div>
          <div style={{ width: WIDTHS[5], padding: '10px 12px', fontSize: 13, fontWeight: 700, color: e.type === 'expense' ? '#E2445C' : '#00CA72', flexShrink: 0 }}>
            {e.type === 'expense' ? '-' : '+'}{formatILS(Number(e.amount_ils))}
          </div>
        </div>
      ))}
    </div>
  )
}
