import { NextRequest } from 'next/server'
import { sb, ok, err, preflight } from '@/lib/api-helpers'
import Anthropic from '@anthropic-ai/sdk'

export async function OPTIONS() { return preflight() }

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get('text')
  if (!text) return err('Required: text')

  const cacheKey = `translate_${text.slice(0, 100)}`

  // Check cache
  const client = sb()
  const cached = await client
    .from('agent_memory')
    .select('value')
    .eq('agent_id', 'translate_cache')
    .eq('key', cacheKey)
    .maybeSingle()

  if (cached.data?.value) {
    return ok({ translation: cached.data.value, cached: true })
  }

  // Translate with Claude
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return ok({ translation: text, cached: false })

  try {
    const anthropic = new Anthropic({ apiKey })
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `תרגם לעברית קצר ומדויק (מקסימום 8 מילים): "${text}"\n\nענה רק את התרגום, בלי ציטוטים ובלי הסבר.`,
      }],
    })

    const translation = (msg.content[0] as { text: string }).text.trim()

    // Save to cache
    await client.from('agent_memory').upsert({
      agent_id: 'translate_cache',
      key: cacheKey,
      value: translation,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agent_id,key' })

    return ok({ translation, cached: false })
  } catch (e) {
    return ok({ translation: text, cached: false })
  }
}
