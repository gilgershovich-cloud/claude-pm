import { NextRequest } from 'next/server'
import { sb, ok, preflight } from '@/lib/api-helpers'

export async function OPTIONS() { return preflight() }

export async function GET(_req: NextRequest) {
  const client = sb()
  const { data: groups } = await client.from('groups').select('*').order('position')
  const { data: items } = await client.from('items').select('*').order('position')
  const { data: subItems } = await client.from('sub_items').select('*').order('position')

  const subMap: Record<string, unknown[]> = {}
  for (const s of subItems ?? []) {
    const si = s as { item_id: string }
    if (!subMap[si.item_id]) subMap[si.item_id] = []
    subMap[si.item_id].push(s)
  }

  const itemMap: Record<string, unknown[]> = {}
  for (const item of items ?? []) {
    const i = item as { group_id: string; id: string }
    const full = { ...item, sub_items: subMap[i.id] ?? [] }
    if (!itemMap[i.group_id]) itemMap[i.group_id] = []
    itemMap[i.group_id].push(full)
  }

  const board = (groups ?? []).map(g => {
    const grp = g as { id: string }
    return { ...g, items: itemMap[grp.id] ?? [] }
  })

  return ok({ board })
}
