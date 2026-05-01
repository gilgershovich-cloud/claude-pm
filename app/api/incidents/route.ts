import { NextRequest } from 'next/server'
import { sb, ok, err, preflight, requireKey } from '@/lib/api-helpers'

export async function OPTIONS() { return preflight() }

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  const client = sb()

  let q = client.from('incidents').select('*').order('created_at', { ascending: false }).limit(50)
  if (status) q = q.eq('status', status)

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok({ incidents: data })
}

export async function POST(req: NextRequest) {
  const denied = requireKey(req)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  if (!body?.agent_id || !body?.title || !body?.description) {
    return err('Required: agent_id, title, description')
  }

  const { data, error } = await sb()
    .from('incidents')
    .insert({
      agent_id: body.agent_id,
      project: body.project ?? null,
      severity: body.severity ?? 'medium',
      title: body.title,
      description: body.description,
      status: 'open',
    })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok({ incident: data }, 201)
}
