'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import type { SubItem, Status } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { StatusCell } from './StatusCell'

interface Props {
  itemId: string
  subItems: SubItem[]
}

export function SubItemPanel({ itemId, subItems }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  async function handleAdd() {
    if (!newName.trim()) return
    const position = subItems.length
    await supabase.from('sub_items').insert({ item_id: itemId, name: newName.trim(), status: 'planning', position })
    router.refresh()
    setNewName('')
    setAdding(false)
  }

  async function handleStatusChange(id: string, s: Status) {
    await supabase.from('sub_items').update({ status: s }).eq('id', id)
    router.refresh()
  }

  async function handleDelete(id: string) {
    await supabase.from('sub_items').delete().eq('id', id)
    router.refresh()
  }

  return (
    <div style={{ background: '#f8f9fc', borderTop: '1px solid #e6e9ef' }}>
      {subItems.map(sub => (
        <div
          key={sub.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 16px 7px 72px',
            borderBottom: '1px solid #f0f1f5',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f0f2f8')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: 2, height: 16, background: '#e6e9ef', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: '#323338' }}>{sub.name}</span>
          <StatusCell
            status={sub.status}
            size="sm"
            onChange={s => handleStatusChange(sub.id, s)}
          />
          <button
            onClick={() => handleDelete(sub.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4c4c4', padding: 2, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#E2445C')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#c4c4c4')}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      {adding ? (
        <div style={{ padding: '7px 16px 7px 80px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="שם ה-sub item..."
            style={{
              flex: 1, border: '1px solid #0073ea', borderRadius: 4,
              padding: '4px 8px', fontSize: 13, outline: 'none', background: '#fff',
            }}
          />
          <button onClick={handleAdd} style={{ background: '#0073ea', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 12px', fontSize: 13, cursor: 'pointer' }}>שמור</button>
          <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#676879' }}>ביטול</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px 7px 80px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#676879', fontSize: 13, width: '100%',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#0073ea')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#676879')}
        >
          <Plus size={14} /> הוסף sub item
        </button>
      )}
    </div>
  )
}