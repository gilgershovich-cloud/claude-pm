import { NextRequest } from 'next/server'
import { sb, ok, err, preflight, requireKey } from '@/lib/api-helpers'

export async function OPTIONS() { return preflight() }

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status') ?? 'pending'
  const { data, error } = await sb()
    .from('agent_decisions')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return err(error.message, 500)
  return ok({ decisions: data })
}

export async function POST(req: NextRequest) {
  const denied = requireKey(req)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  if (!body?.agent_id || !body?.title || !body?.description || !body?.risk_tier) {
    return err('Required: agent_id, title, description, risk_tier')
  }

  const { data, error } = await sb()
    .from('agent_decisions')
    .insert({
      agent_id: body.agent_id,
      title: body.title,
      description: body.description,
      risk_tier: body.risk_tier,
      status: 'pending',
    })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok({ decision: data }, 201)
}
