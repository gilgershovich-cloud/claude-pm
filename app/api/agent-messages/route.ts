import { NextRequest } from 'next/server'
import { sb, ok, err, preflight, requireKey } from '@/lib/api-helpers'

export async function OPTIONS() { return preflight() }

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to') ?? 'gil'
  const unread = req.nextUrl.searchParams.get('unread')
  const client = sb()

  let q = client.from('agent_messages').select('*').eq('to_agent', to).order('created_at', { ascending: false }).limit(50)
  if (unread === 'true') q = q.eq('is_read', false)

  const { data, error } = await q
  if (error) return err(error.message, 500)
  return ok({ messages: data })
}

export async function POST(req: NextRequest) {
  const denied = requireKey(req)
  if (denied) return denied

  const body = await req.json().catch(() => null)
  if (!body?.from_agent || !body?.to_agent || !body?.subject || !body?.body) {
    return err('Required: from_agent, to_agent, subject, body')
  }

  const { data, error } = await sb()
    .from('agent_messages')
    .insert({
      from_agent: body.from_agent,
      to_agent: body.to_agent,
      subject: body.subject,
      body: body.body,
      priority: body.priority ?? 'medium',
    })
    .select()
    .single()

  if (error) return err(error.message, 500)
  return ok({ message: data }, 201)
}
