'use client'

import { useState } from 'react'
import type { Group as GroupType, Status } from '@/lib/types'
import { Group } from './Group'
import { BoardHeader, type FilterKey } from './BoardHeader'

interface Props {
  groups: GroupType[]
}

const FILTER_STATUSES: Record<FilterKey, Status[] | null> = {
  all:      null,
  planning: ['planning', 'pending'],
  active:   ['active'],
  working:  ['working_on_it'],
  done:     ['done'],
  blocked:  ['blocked'],
}

export function Board({ groups }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const filterStatuses = FILTER_STATUSES[filter]

  const filtered = groups.map(g => ({
    ...g,
    items: (g.items ?? []).filter(item => {
      const matchesQuery = !query.trim() ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category?.toLowerCase().includes(query.toLowerCase()) ||
        item.notes?.toLowerCase().includes(query.toLowerCase())
      const matchesFilter = !filterStatuses || filterStatuses.includes(item.status as Status)
      return matchesQuery && matchesFilter
    }),
  })).filter(g => g.items.length > 0 || (!filterStatuses && !query.trim()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <BoardHeader groupCount={groups.length} onSearch={setQuery} onFilter={setFilter} activeFilter={filter} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '24px 24px 48px' }}>
          {filtered.map((group, i) => (
            <Group key={group.id} group={group} showHeaders={i === 0} />
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 80, color: '#9699a6' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>אין תוצאות ל-"{query}"</div>
            </div>
          )}
          {groups.length === 0 && !query && (
            <div style={{ textAlign: 'center', padding: 80, color: '#9699a6' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>אין פרויקטים עדיין</div>
              <div style={{ fontSize: 14, marginTop: 8 }}>לחץ על "הוסף פרויקט" כדי להתחיל</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
