import { NextRequest } from 'next/server'
import { sb, ok, err, preflight, requireKey } from '@/lib/api-helpers'

export async function OPTIONS() { return preflight() }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireKey(req)
  if (denied) return denied

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body?.status) return err('Required: status (approved | rejected)')

  const { data, error } = await sb()
    .from('agent_decisions')
    .update({ status: body.status, resolved_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok({ decision: data })
}
