'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Trash2 } from 'lucide-react'
import type { Group as GroupType } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { ItemRow } from './ItemRow'
import { AddItemRow } from './AddItemRow'

const COL_WIDTHS = [340, 150, 130, 130, 120, 200]
const COL_LABELS = ['שם', 'סטטוס', 'קטגוריה', 'סביבה', 'Stack', 'הערות']

interface Props {
  group: GroupType
  showHeaders: boolean
}

export function Group({ group, showHeaders }: Props) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(group.is_collapsed)
  const [hover, setHover] = useState(false)

  async function toggle() {
    const next = !collapsed
    setCollapsed(next)
    await supabase.from('groups').update({ is_collapsed: next }).eq('id', group.id)
  }

  async function handleDelete() {
    if (!window.confirm(`למחוק את "${group.name}"? כל האייטמים יימחקו.`)) return
    const { data: items } = await supabase.from('items').select('id').eq('group_id', group.id)
    const ids = (items ?? []).map(i => i.id)
    if (ids.length > 0) {
      await supabase.from('sub_items').delete().in('item_id', ids)
      await supabase.from('items').delete().in('id', ids)
    }
    await supabase.from('groups').delete().eq('id', group.id)
    router.refresh()
  }

  const items = group.items ?? []

  return (
    <div style={{ marginBottom: 16 }}>
      {showHeaders && (
        <div style={{
          display: 'flex', background: '#f5f6f8',
          borderTop: '1px solid #e6e9ef', borderBottom: '1px solid #e6e9ef',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {COL_LABELS.map((label, i) => (
            <div key={label} style={{
              width: COL_WIDTHS[i], padding: '8px 12px',
              fontSize: 12, color: '#676879', fontWeight: 600,
              flexShrink: 0, letterSpacing: '0.02em',
            }}>
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Group header */}
      <button
        type="button"
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '10px 16px', cursor: 'pointer', border: 'none',
          background: hover ? '#f8f9fc' : 'transparent',
          userSelect: 'none', textAlign: 'left',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={toggle}
      >
        <div style={{ width: 6, height: 20, borderRadius: 2, background: group.color, flexShrink: 0 }} />
        <ChevronDown
          size={16}
          style={{ transform: collapsed ? 'rotate(-90deg)' : 'none', transition: '0.15s', color: group.color, flexShrink: 0 }}
        />
        <span style={{ fontWeight: 700, fontSize: 14, color: group.color, userSelect: 'none' }}>
          {group.name}
        </span>
        <span style={{ fontSize: 12, color: '#9699a6', marginLeft: 4, userSelect: 'none' }}>
          {items.length}
        </span>
        <span
          role="button"
          onClick={e => { e.stopPropagation(); handleDelete() }}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center',
            color: hover ? '#c4c4c4' : 'transparent', transition: 'color 0.15s',
            padding: 4,
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#E2445C')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = hover ? '#c4c4c4' : 'transparent')}
        >
          <Trash2 size={14} />
        </span>
      </button>

      {/* Items */}
      {!collapsed && (
        <div style={{ border: '1px solid #e6e9ef', borderRadius: '0 0 6px 6px' }}>
          {items.length === 0 ? (
            <div style={{ padding: '16px 48px', color: '#9699a6', fontSize: 13, fontStyle: 'italic' }}>
              אין אייטמים עדיין
            </div>
          ) : (
            items.map(item => (
              <ItemRow key={item.id} item={item} colWidths={COL_WIDTHS} />
            ))
          )}
          <AddItemRow groupId={group.id} color={group.color} itemCount={items.length} />
        </div>
      )}
    </div>
  )
}