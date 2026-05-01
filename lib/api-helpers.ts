import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Agent-Key',
}

export function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS })
}

export function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status, headers: CORS })
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

export function requireKey(req: NextRequest): NextResponse | null {
  const key = process.env.AGENT_API_KEY
  if (!key) return null
  const provided = req.headers.get('x-agent-key')
  if (provided !== key) return err('Unauthorized — missing or invalid X-Agent-Key', 401)
  return null
}
