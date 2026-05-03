'use client'

import { LayoutGrid, Inbox, Settings, ChevronRight, Users, TrendingUp, Plug, Code2, BarChart2, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface SidebarProps {
  unreadCount?: number
}

const NAV_SECTIONS = [
  {
    items: [
      { icon: <LayoutGrid size={18} />, label: 'Board', href: '/board' },
      { icon: <Inbox size={18} />, label: 'Inbox', href: '/inbox', badgeKey: true },
    ],
  },
  {
    label: 'AI Company OS',
    items: [
      { icon: <Users size={18} />, label: 'סוכנים', href: '/agents' },
      { icon: <TrendingUp size={18} />, label: 'כספים', href: '/finance' },
      { icon: <BarChart2 size={18} />, label: 'אנליטיקה', href: '/analytics' },
      { icon: <ShoppingBag size={18} />, label: 'מכירות', href: '/sales' },
      { icon: <Plug size={18} />, label: 'חיבורים', href: '/integrations' },
      { icon: <Code2 size={18} />, label: 'API', href: '/api-docs' },
    ],
  },
  {
    items: [
      { icon: <Settings size={18} />, label: 'Settings', href: '/settings' },
    ],
  },
]

export function Sidebar({ unreadCount = 0 }: SidebarProps) {
  const [expanded, setExpanded] = useState(true)
  const pathname = usePathname()

  function NavLink({ icon, label, href, badge }: { icon: React.ReactNode; label: string; href: string; badge?: number }) {
    const active = pathname === href || (href !== '/' && pathname?.startsWith(href + '/'))
    return (
      <Link
        href={href}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '9px 16px',
          background: active ? '#293d50' : 'transparent',
          color: active ? '#fff' : '#8596a9',
          borderRadius: '0 4px 4px 0',
          whiteSpace: 'nowrap', userSelect: 'none',
          transition: 'background 0.15s, color 0.15s',
          textDecoration: 'none',
        }}
        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = '#293d50'; (e.currentTarget as HTMLElement).style.color = '#fff' } }}
        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#8596a9' } }}
      >
        <span style={{ flexShrink: 0, position: 'relative' }}>
          {icon}
          {(badge ?? 0) > 0 && (
            <span style={{
              position: 'absolute', top: -6, right: -6,
              background: '#E2445C', color: '#fff',
              borderRadius: '50%', width: 16, height: 16,
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {(badge ?? 0) > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        {expanded && <span style={{ fontSize: 14 }}>{label}</span>}
        {expanded && (badge ?? 0) > 0 && (
          <span style={{
            marginLeft: 'auto',
            background: '#E2445C', color: '#fff',
            borderRadius: 20, padding: '1px 7px',
            fontSize: 11, fontWeight: 700,
          }}>
            {badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <aside style={{
      width: expanded ? 240 : 64,
      background: '#1f2d3d',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      transition: 'width 0.2s ease', overflow: 'hidden',
      height: '100vh', position: 'sticky', top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #293d50' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #0073ea, #9d50dd)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>C</span>
        </div>
        {expanded && <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', userSelect: 'none' }}>Claude OS</span>}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#8596a9', cursor: 'pointer', padding: 4,
            display: 'flex', alignItems: 'center',
          }}
        >
          <ChevronRight size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={si}>
            {si > 0 && <div style={{ height: 1, background: '#293d50', margin: '6px 0' }} />}
            {section.label && expanded && (
              <div style={{ padding: '6px 16px 2px', fontSize: 10, fontWeight: 700, color: '#4a5d70', textTransform: 'uppercase', letterSpacing: '0.08em', userSelect: 'none' }}>
                {section.label}
              </div>
            )}
            {section.items.map(item => (
              <NavLink
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                badge={'badgeKey' in item ? unreadCount : undefined}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #293d50', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', background: '#0073ea', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 600, fontSize: 13, userSelect: 'none',
        }}>G</div>
        {expanded && <span style={{ color: '#8596a9', fontSize: 13, whiteSpace: 'nowrap', userSelect: 'none' }}>גיל גרשוביץ</span>}
      </div>
    </aside>
  )
}
