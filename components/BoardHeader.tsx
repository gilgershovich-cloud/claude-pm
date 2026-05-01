'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LayoutGrid, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const GROUP_COLORS = ['#0073EA', '#9D50DD', '#FF7575', '#00CA72', '#FDAB3D', '#E2445C']

export function BoardHeader({ groupCount }: { groupCount: number }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  async function handleAdd() {
    if (!name.trim()) { setAdding(false); return }
    const color = GROUP_COLORS[groupCount % GROUP_COLORS.length]
    await supabase.from('groups').insert({ name: name.trim(), color, position: groupCount })
    router.refresh()
    setName('')
    setAdding(false)
  }

  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid #e6e9ef',
      padding: '0 24px', height: 56,
      display: 'flex', alignItems: 'center', gap: 16,
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LayoutGrid size={20} color="#0073ea" />
        <span style={{ fontWeight: 700, fontSize: 18, color: '#323338' }}>My Projects</span>
      </div>

      <div style={{ display: 'flex', gap: 4, marginLeft: 24, background: '#f5f6f8', borderRadius: 6, padding: 3 }}>
        {['Table', 'Kanban'].map(v => (
          <button key={v} style={{
            padding: '5px 14px', border: 'none', borderRadius: 4,
            background: v === 'Table' ? '#fff' : 'transparent',
            color: v === 'Table' ? '#323338' : '#676879',
            fontSize: 13, fontWeight: v === 'Table' ? 600 : 400, cursor: 'pointer',
            boxShadow: v === 'Table' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            {v}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f5f6f8', borderRadius: 6, padding: '6px 12px' }}>
        <Search size={14} color="#676879" />
        <span style={{ fontSize: 13, color: '#9699a6' }}>חיפוש...</span>
      </div>

      <div style={{ marginLeft: 'auto' }}>
        {adding ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="שם הפרויקט..."
              style={{ border: '1px solid #0073ea', borderRadius: 6, padding: '6px 12px', fontSize: 13, outline: 'none' }}
            />
            <button onClick={handleAdd} style={{ background: '#0073ea', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>הוסף</button>
            <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#676879' }}>ביטול</button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#0073ea', color: '#fff', border: 'none',
              borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#0060c0')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#0073ea')}
          >
            <Plus size={16} /> הוסף פרויקט
          </button>
        )}
      </div>
    </div>
  )
}