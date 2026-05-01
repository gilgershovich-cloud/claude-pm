'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import type { Status, AgentMessage, AgentDecision, AgentReport, Incident } from './types'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function updateItemStatus(id: string, status: Status) {
  const sb = getClient()
  await sb.from('items').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/board')
}

export async function updateItemField(id: string, field: string, value: string) {
  const sb = getClient()
  await sb.from('items').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/board')
}

export async function addItem(group_id: string, name: string) {
  const sb = getClient()
  const { data: existing } = await sb
    .from('items')
    .select('position')
    .eq('group_id', group_id)
    .order('position', { ascending: false })
    .limit(1)
  const position = existing && existing.length > 0 ? existing[0].position + 1 : 0
  await sb.from('items').insert({ group_id, name, status: 'planning', position })
  revalidatePath('/board')
}

export async function deleteItem(id: string) {
  const sb = getClient()
  await sb.from('items').delete().eq('id', id)
  revalidatePath('/board')
}

export async function addSubItem(item_id: string, name: string) {
  const sb = getClient()
  const { data: existing } = await sb
    .from('sub_items')
    .select('position')
    .eq('item_id', item_id)
    .order('position', { ascending: false })
    .limit(1)
  const position = existing && existing.length > 0 ? existing[0].position + 1 : 0
  await sb.from('sub_items').insert({ item_id, name, status: 'planning', position })
  revalidatePath('/board')
}

export async function updateSubItemStatus(id: string, status: Status) {
  const sb = getClient()
  await sb.from('sub_items').update({ status }).eq('id', id)
  revalidatePath('/board')
}

export async function deleteSubItem(id: string) {
  const sb = getClient()
  await sb.from('sub_items').delete().eq('id', id)
  revalidatePath('/board')
}

export async function toggleGroupCollapsed(id: string, is_collapsed: boolean) {
  const sb = getClient()
  await sb.from('groups').update({ is_collapsed }).eq('id', id)
  revalidatePath('/board')
}

export async function addGroup(name: string) {
  const sb = getClient()
  const colors = ['#0073EA', '#9D50DD', '#FF7575', '#00CA72', '#FDAB3D', '#E2445C']
  const { data: existing } = await sb
    .from('groups')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
  const position = existing && existing.length > 0 ? existing[0].position + 1 : 0
  const color = colors[position % colors.length]
  await sb.from('groups').insert({ name, color, position })
  revalidatePath('/board')
}

export async function deleteGroup(id: string) {
  const sb = getClient()
  await sb.from('groups').delete().eq('id', id)
  revalidatePath('/board')
}

// ── Inbox ──────────────────────────────────────────────────────────────────

export async function getInboxMessages(): Promise<AgentMessage[]> {
  const sb = getClient()
  const { data } = await sb
    .from('agent_messages')
    .select('*')
    .eq('to_agent', 'gil')
    .order('created_at', { ascending: false })
  return (data as AgentMessage[]) ?? []
}

export async function markMessageRead(id: string) {
  const sb = getClient()
  await sb.from('agent_messages').update({ is_read: true }).eq('id', id)
  revalidatePath('/inbox')
}

export async function markAllRead() {
  const sb = getClient()
  await sb.from('agent_messages').update({ is_read: true }).eq('to_agent', 'gil').eq('is_read', false)
  revalidatePath('/inbox')
}

export async function getPendingDecisions(): Promise<AgentDecision[]> {
  const sb = getClient()
  const { data } = await sb
    .from('agent_decisions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  return (data as AgentDecision[]) ?? []
}

export async function resolveDecision(id: string, status: 'approved' | 'rejected') {
  const sb = getClient()
  await sb
    .from('agent_decisions')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/inbox')
}

export async function getRecentReports(): Promise<AgentReport[]> {
  const sb = getClient()
  const { data } = await sb
    .from('agent_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  return (data as AgentReport[]) ?? []
}

export async function getOpenIncidents(): Promise<Incident[]> {
  const sb = getClient()
  const { data } = await sb
    .from('incidents')
    .select('*')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })
  return (data as Incident[]) ?? []
}
