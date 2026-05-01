'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Trash2 } from 'lucide-react'
import type { Item, Status } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { StatusCell } from './StatusCell'
import { SubItemPanel } from './SubItemPanel'

interface Props {
  item: Item
  colWidths: number[]
}

const EDITABLE_FIELDS = ['category', 'environment', 'stack', 'notes'] as const

export function ItemRow({ item, colWidths }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [hover, setHover] = useState(false)
  const [editField, setEditField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [localStatus, setLocalStatus] = useState<Status>(item.status as Status)

  async function handleStatusChange(s: Status) {
    setLocalStatus(s)
    await supabase.from('items').update({ status: s, updated_at: new Date().toISOString() }).eq('id', item.id)
  }

  function startEdit(field: string, current: string | null) {
    setEditField(field)
    setEditValue(current ?? '')
  }

  async function commitEdit() {
    if (editField && editValue !== (item[editField as keyof Item] ?? '')) {
      await supabase.from('items').update({ [editField]: editValue, updated_at: new Date().toISOString() }).eq('id', item.id)
      router.refresh()
    }
    setEditField(null)
  }

  async function handleDelete() {
    await supabase.from('items').delete().eq('id', item.id)
    router.refresh()
  }

  const subItems = item.sub_items ?? []

  return (
    <>
      <div
        style={{
          display: 'flex',
          background: hover ? '#f5f6f8' : '#fff',
          borderBottom: '1px solid #e6e9ef',
          minHeight: 40,
          alignItems: 'center',
          position: 'relative',
          userSelect: 'none',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Expand + Name */}
        <div style={{ width: colWidths[0], display: 'flex', alignItems: 'center', padding: '0 8px 0 16px', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#676879', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
          >
            <ChevronRight size={14} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: '0.15s' }} />
          </button>

          {editField === 'name' ? (
            <input
              autoFocus
              className="cell-edit"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditField(null) }}
            />
          ) : (
            <span
              onDoubleClick={() => startEdit('name', item.name)}
              style={{ fontSize: 14, color: '#323338', cursor: 'default', flex: 1, paddingRight: 8 }}
            >
              {item.name}
            </span>
          )}

          {hover && (
            <button
              onClick={handleDelete}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4c4c4', padding: 2, display: 'flex', marginLeft: 'auto', flexShrink: 0 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#E2445C')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#c4c4c4')}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Status */}
        <div style={{ width: colWidths[1], padding: '0 8px', flexShrink: 0, overflow: 'visible', position: 'relative', zIndex: 5 }}>
          <StatusCell status={localStatus} onChange={handleStatusChange} />
        </div>

        {/* Category / Env / Stack / Notes */}
        {EDITABLE_FIELDS.map((field, i) => (
          <div key={field} style={{ width: colWidths[i + 2], padding: '0 8px', flexShrink: 0 }}>
            {editField === field ? (
              <input
                autoFocus
                className="cell-edit"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditField(null) }}
              />
            ) : (
              <span
                onDoubleClick={() => startEdit(field, item[field] as string | null)}
                style={{ fontSize: 13, color: item[field] ? '#323338' : '#c4c4c4', cursor: 'default' }}
              >
                {(item[field] as string | null) ?? '—'}
              </span>
            )}
          </div>
        ))}
      </div>

      {expanded && (
        <SubItemPanel itemId={item.id} subItems={subItems} />
      )}
    </>
  )
}