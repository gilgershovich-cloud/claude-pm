import { NextRequest } from 'next/server'
import { sb, ok, err, preflight, requireKey } from '@/lib/api-helpers'

export async function OPTIONS() { return preflight() }

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type')
  const client = sb()

  let q = client.from('finance_entries').select('*').order('date', { ascending: false }).limit(100)
  if (type) q = q.eq('type', type)

  const { data, error } = await q
  if (error) return err(error.message, 500)

  const entries = data ?? []
  const expenses = entries.filter((e: { type: string }) => e.type === 'expense').reduce((s: number, e: { amount_ils: number }) => s + e.amount_ils, 0)
  const revenue = entries.filter((e: { type: string }) => e.type === 'revenue').reduce((s: number, e: { amount_ils: number }) => s + e.amount_ils, 0)

  return ok({ entries, summary: { expenses, revenue, profit: revenue - expenses } })
}

export async function POST(req: NextRequest) {
  const denied = requireKey(req)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  if (!body?.type || !body?.amount_ils || !body?.description) {
    return err('Required: type (expense|revenue), amount_ils, description')
  }

  const { data, error } = await sb()
    .from('finance_entries')
    .insert({
      type: body.type,
      amount_ils: body.amount_ils,
      description: body.description,
      category: body.category ?? 'other',
      project: body.project ?? null,
      source: body.source ?? 'api',
      reference_id: body.reference_id ?? null,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      created_by: body.agent_id ?? 'api',
    })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok({ entry: data }, 201)
}
