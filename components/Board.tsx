import type { Group as GroupType } from '@/lib/types'
import { Group } from './Group'

interface Props {
  groups: GroupType[]
}

export function Board({ groups }: Props) {
  return (
    <div style={{ padding: '24px 24px 48px' }}>
      {groups.map((group, i) => (
        <Group key={group.id} group={group} showHeaders={i === 0} />
      ))}
      {groups.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 80, color: '#9699a6',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>אין פרויקטים עדיין</div>
          <div style={{ fontSize: 14, marginTop: 8 }}>לחץ על "הוסף פרויקט" כדי להתחיל</div>
        </div>
      )}
    </div>
  )
}
