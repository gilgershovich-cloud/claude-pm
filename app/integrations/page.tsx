import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface SocialAccount {
  id: string
  group_id: string
  platform: string
  account_name: string
  status: 'active' | 'expired' | 'needs_reconnect' | 'pending'
  connected_at: string
  last_verified: string | null
}

async function getSocialAccounts(): Promise<SocialAccount[]> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await sb.from('social_accounts').select('*').order('connected_at', { ascending: false })
    return (data ?? []) as SocialAccount[]
  } catch {
    return []
  }
}

const INTEGRATIONS = [
  {
    group: 'תשתית ענן',
    items: [
      {
        name: 'Railway',
        desc: 'Social AI Platform (backend + workers)',
        status: 'active' as const,
        url: 'https://railway.app',
        icon: '🚂',
        details: 'Pro plan · Social AI deployed',
        managed_by: 'vp_it',
      },
      {
        name: 'Vercel',
        desc: 'Claude OS, Social AI Frontend, Claude Skills Explorer',
        status: 'active' as const,
        url: 'https://vercel.com',
        icon: '▲',
        details: 'Pro plan · 3 deployments active',
        managed_by: 'vp_it',
      },
      {
        name: 'Supabase — Claude OS',
        desc: 'DB ראשי של מערכת הניהול, סוכנים ובורד',
        status: 'active' as const,
        url: 'https://supabase.com',
        icon: '🛢',
        details: 'Free tier · pcbqkyvrkbmlmtmporsg',
        managed_by: 'vp_it',
      },
      {
        name: 'Supabase — Social AI',
        desc: 'DB של Social AI Platform (users, posts, api_usage_log)',
        status: 'active' as const,
        url: 'https://supabase.com',
        icon: '🛢',
        details: 'Free tier · פרויקט נפרד',
        managed_by: 'vp_it',
      },
    ],
  },
  {
    group: 'AI ומודלים',
    items: [
      {
        name: 'Anthropic API',
        desc: 'Claude Sonnet 4.6 — כל הסוכנים + Social AI + MD Clinic',
        status: 'active' as const,
        url: 'https://anthropic.com',
        icon: '🤖',
        details: 'Pay-as-you-go · VP Finance מנטר עלויות',
        managed_by: 'vp_finance',
      },
    ],
  },
  {
    group: 'תשלומים',
    items: [
      {
        name: 'Green Invoice',
        desc: 'חשבוניות + דמי רצינות לקליניקות M.D Clinic',
        status: 'active' as const,
        url: 'https://www.greeninvoice.co.il',
        icon: '🧾',
        details: 'חשבונית 300 ₪ · Webhook מוגדר',
        managed_by: 'vp_finance',
      },
    ],
  },
  {
    group: 'ניטור ו-A/B Testing',
    items: [
      {
        name: 'Flipt A/B Testing',
        desc: 'תשתית A/B testing — מחובר ל-Social AI ו-MD Clinic',
        status: 'active' as const,
        url: 'https://flipt.io',
        icon: '🎛',
        details: 'Docker · Local + future cloud',
        managed_by: 'vp_eng',
      },
    ],
  },
]

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  active:           { label: 'פעיל',            color: '#00CA72', bg: '#E6F9EF' },
  expired:          { label: 'פג תוקף',          color: '#E2445C', bg: '#FFE8EC' },
  needs_reconnect:  { label: 'נדרש חיבור מחדש', color: '#FDAB3D', bg: '#FFF4E5' },
  pending:          { label: 'ממתין',            color: '#9699a6', bg: '#f5f6f8' },
}

const PLATFORM_EMOJI: Record<string, string> = {
  meta: '📘', google: '🔍', tiktok: '🎵', linkedin: '💼', instagram: '📸', youtube: '▶️',
}

export default async function IntegrationsPage() {
  const socialAccounts = await getSocialAccounts()

  return (
    <div style={{ padding: 32, background: '#f6f7fb', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#323338', margin: 0 }}>חיבורים ואינטגרציות</h1>
        <p style={{ color: '#676879', fontSize: 14, marginTop: 6 }}>
          כל השירותים שמחוברים למערכת · VP IT מנטר אותם כל 30 דקות
        </p>
      </div>

      {/* Static integrations */}
      {INTEGRATIONS.map(group => (
        <div key={group.group} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9699a6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {group.group}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {group.items.map(item => {
              const s = STATUS_LABEL[item.status]
              return (
                <div key={item.name} style={{
                  background: '#fff', borderRadius: 10, padding: 18,
                  border: '1px solid #e6e9ef', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 8, background: '#f5f6f8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#323338' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#676879', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {s.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11, color: '#9699a6' }}>{item.details}</div>
                    <div style={{ fontSize: 11, color: '#9699a6' }}>מנהל: {item.managed_by}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Social accounts from DB */}
      {socialAccounts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9699a6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            רשתות חברתיות
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {socialAccounts.map(acc => {
              const s = STATUS_LABEL[acc.status] ?? STATUS_LABEL.pending
              return (
                <div key={acc.id} style={{
                  background: '#fff', borderRadius: 10, padding: 16,
                  border: '1px solid #e6e9ef',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 20 }}>{PLATFORM_EMOJI[acc.platform] ?? '🌐'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#323338' }}>{acc.account_name}</div>
                      <div style={{ fontSize: 11, color: '#9699a6' }}>{acc.platform}</div>
                    </div>
                    <span style={{ background: s.bg, color: s.color, padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{s.label}</span>
                  </div>
                  {acc.last_verified && (
                    <div style={{ fontSize: 11, color: '#9699a6' }}>אומת לאחרונה: {new Date(acc.last_verified).toLocaleDateString('he-IL')}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 18, border: '1px solid #e6e9ef' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#323338', marginBottom: 12 }}>סיכום</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#00CA72' }}>
              {INTEGRATIONS.flatMap(g => g.items).filter(i => i.status === 'active').length + socialAccounts.filter(a => a.status === 'active').length}
            </div>
            <div style={{ fontSize: 12, color: '#676879' }}>חיבורים פעילים</div>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#E2445C' }}>
              {socialAccounts.filter(a => a.status === 'needs_reconnect' || a.status === 'expired').length}
            </div>
            <div style={{ fontSize: 12, color: '#676879' }}>דורשים תשומת לב</div>
          </div>
        </div>
      </div>
    </div>
  )
}
