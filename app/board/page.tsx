import { createClient } from '@supabase/supabase-js'
import { Board } from '@/components/Board'
import type { Group, Item, SubItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getData(): Promise<Group[]> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: groups } = await sb
    .from('groups')
    .select('*')
    .order('position')

  if (!groups) return []

  const { data: items } = await sb
    .from('items')
    .select('*')
    .order('position')

  const { data: subItems } = await sb
    .from('sub_items')
    .select('*')
    .order('position')

  const subMap: Record<string, SubItem[]> = {}
  for (const s of subItems ?? []) {
    if (!subMap[s.item_id]) subMap[s.item_id] = []
    subMap[s.item_id].push(s as SubItem)
  }

  const itemMap: Record<string, Item[]> = {}
  for (const item of items ?? []) {
    const i: Item = { ...(item as Item), sub_items: subMap[item.id] ?? [] }
    if (!itemMap[item.group_id]) itemMap[item.group_id] = []
    itemMap[item.group_id].push(i)
  }

  return groups.map(g => ({ ...(g as Group), items: itemMap[g.id] ?? [] }))
}

export default async function BoardPage() {
  const groups = await getData()

  return <Board groups={groups} />
}
