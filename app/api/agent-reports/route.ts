import { NextRequest } from 'next/server'
import { sb, ok, err, preflight, requireKey } from '@/lib/api-helpers'

export async function OPTIONS() { return preflight() }

export async function GET(req: NextRequest) {
  const agent = req.nextUrl.searchParams.get('agent_id')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '20')
  const client = sb()

  let q = client.from('agent_reports').select('*').order('created_at', { ascending: false }).limit(limit)
  if (agent) q = q.eq('agent_id', agent)

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok({ reports: data })
}

export async function POST(req: NextRequest) {
  const denied = requireKey(req)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  if (!body?.agent_id || !body?.title || !body?.body) {
    return err('Required: agent_id, title, body')
  }

  const { data, error } = await sb()
    .from('agent_reports')
    .insert({
      agent_id: body.agent_id,
      title: body.title,
      body: body.body,
      report_type: body.report_type ?? 'daily',
    })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok({ report: data }, 201)
}
