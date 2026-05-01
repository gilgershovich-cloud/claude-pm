'use client'

import { LayoutGrid, Inbox, Settings, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface SidebarProps {
  unreadCount?: number
}

export function Sidebar({ unreadCount = 0 }: SidebarProps) {
  const [expanded, setExpanded] = useState(true)
  const pathname = usePathname()

  const navItems = [
    { icon: <LayoutGrid size={18} />, label: 'Board', href: '/board' },
    { icon: <Inbox size={18} />, label: 'Inbox', href: '/inbox', badge: unreadCount },
    { icon: <Settings size={18} />, label: 'Settings', href: '/settings' },
  ]

  return (
    <aside style={{
      width: expanded ? 240 : 64,
      background: '#1f2d3d',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      transition: 'width 0.2s ease', overflow: 'hidden',
      height: '100vh', position: 'sticky', top: 0,
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
        {expanded && <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', userSelect: 'none' }}>Claude PM</span>}
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
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {navItems.map(({ icon, label, href, badge }) => {
          const active = pathname === href || pathname?.startsWith(href + '/')
          return (
            <Link
              key={label}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 16px', width: '100%',
                background: active ? '#293d50' : 'transparent',
                color: active ? '#fff' : '#8596a9',
                cursor: 'pointer',
                borderRadius: '0 4px 4px 0',
                whiteSpace: 'nowrap', userSelect: 'none',
                transition: 'background 0.15s',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#293d50' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
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
        })}
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
