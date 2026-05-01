'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  groupId: string
  color: string
  itemCount: number
}

export function AddItemRow({ groupId, color, itemCount }: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  async function handleAdd() {
    if (!name.trim()) { setAdding(false); return }
    await supabase.from('items').insert({ group_id: groupId, name: name.trim(), status: 'planning', position: itemCount })
    router.refresh()
    setName('')
    setAdding(false)
  }

  if (adding) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px 8px 48px', background: '#fff', borderBottom: '1px solid #e6e9ef' }}>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
          placeholder="שם האייטם..."
          style={{ flex: 1, border: '1px solid #0073ea', borderRadius: 4, padding: '5px 10px', fontSize: 14, outline: 'none', background: '#fff' }}
        />
        <button onClick={handleAdd} style={{ background: '#0073ea', color: '#fff', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 13, cursor: 'pointer' }}>שמור</button>
        <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#676879' }}>ביטול</button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setAdding(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px 8px 48px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#676879', fontSize: 13, width: '100%',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = color; (e.currentTarget as HTMLElement).style.background = '#f5f6f8' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#676879'; (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      <Plus size={14} /> הוסף Item
    </button>
  )
}