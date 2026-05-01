import { createClient } from '@supabase/supabase-js'
import { Sidebar } from './Sidebar'

async function getUnreadCount(): Promise<number> {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { count } = await sb
      .from('agent_messages')
      .select('*', { count: 'exact', head: true })
      .eq('to_agent', 'gil')
      .eq('is_read', false)
    return count ?? 0
  } catch {
    return 0
  }
}

export async function SidebarServer() {
  const unreadCount = await getUnreadCount()
  return <Sidebar unreadCount={unreadCount} />
}
