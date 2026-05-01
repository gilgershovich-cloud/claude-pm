export type Status =
  | 'active'
  | 'working_on_it'
  | 'done'
  | 'blocked'
  | 'planning'
  | 'pending'

export const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  active:        { label: 'Active',        color: '#ffffff', bg: '#00C875' },
  working_on_it: { label: 'Working on it', color: '#ffffff', bg: '#FDAB3D' },
  done:          { label: 'Done',          color: '#ffffff', bg: '#00CA72' },
  blocked:       { label: 'Blocked',       color: '#ffffff', bg: '#E2445C' },
  planning:      { label: 'Planning',      color: '#323338', bg: '#C4C4C4' },
  pending:       { label: 'Pending',       color: '#ffffff', bg: '#FDAB3D' },
}

export interface SubItem {
  id: string
  item_id: string
  name: string
  status: Status
  notes: string | null
  position: number
}

export interface Item {
  id: string
  group_id: string
  name: string
  status: Status
  category: string | null
  environment: string | null
  stack: string | null
  notes: string | null
  position: number
  updated_at: string
  sub_items?: SubItem[]
}

export interface Group {
  id: string
  name: string
  color: string
  position: number
  is_collapsed: boolean
  items?: Item[]
}

export type Priority = 'low' | 'medium' | 'high'
export type RiskTier = 'low' | 'medium' | 'high'
export type DecisionStatus = 'pending' | 'approved' | 'rejected'
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'in_progress' | 'resolved'

export interface AgentMessage {
  id: string
  from_agent: string
  to_agent: string
  subject: string
  body: string
  priority: Priority
  is_read: boolean
  created_at: string
}

export interface AgentDecision {
  id: string
  agent_id: string
  title: string
  description: string
  risk_tier: RiskTier
  status: DecisionStatus
  created_at: string
  resolved_at: string | null
}

export interface AgentReport {
  id: string
  agent_id: string
  title: string
  body: string
  report_type: 'daily' | 'weekly' | 'monthly'
  created_at: string
}

export interface Incident {
  id: string
  agent_id: string
  project: string | null
  severity: IncidentSeverity
  title: string
  description: string
  status: IncidentStatus
  created_at: string
  resolved_at: string | null
}
