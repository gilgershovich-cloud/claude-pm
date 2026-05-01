import { NextRequest } from 'next/server'
import { sb, ok, err, preflight, requireKey } from '@/lib/api-helpers'

export async function OPTIONS() { return preflight() }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireKey(req)
  if (denied) return denied

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err('Invalid JSON body')

  const update: Record<string, unknown> = {}
  if (body.status) update.status = body.status
  if (body.status === 'resolved') update.resolved_at = new Date().toISOString()

  const { data, error } = await sb()
    .from('incidents')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok({ incident: data })
}
