import { NextRequest } from 'next/server'
import { sb, ok, err, preflight, requireKey } from '@/lib/api-helpers'

export async function OPTIONS() { return preflight() }

export async function GET(req: NextRequest) {
  const agent = req.nextUrl.searchParams.get('agent_id')
  const key = req.nextUrl.searchParams.get('key')
  const client = sb()

  if (!agent) return err('Required query param: agent_id')

  let q = client.from('agent_memory').select('*').eq('agent_id', agent)
  if (key) q = q.eq('key', key)

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok({ memory: data })
}

export async function POST(req: NextRequest) {
  const denied = requireKey(req)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  if (!body?.agent_id || !body?.key) return err('Required: agent_id, key')

  const { data, error } = await sb()
    .from('agent_memory')
    .upsert({
      agent_id: body.agent_id,
      key: body.key,
      value: body.value ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agent_id,key' })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok({ memory: data }, 201)
}
