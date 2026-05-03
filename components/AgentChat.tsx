'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

interface Message {
  id: string
  from_agent: string
  to_agent: string
  subject: string
  body: string
  priority: string
  is_read: boolean
  created_at: string
}

interface Props {
  agentId: string
  agentLabel: string
  agentColor: string
}

function timeStr(d: string) {
  const dt = new Date(d)
  return dt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + dt.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

export function AgentChat({ agentId, agentLabel, agentColor }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function fetchMessages() {
    try {
      const [toAgent, fromAgent] = await Promise.all([
        fetch(`/api/agent-messages?to=${agentId}`).then(r => r.json()),
        fetch(`/api/agent-messages?to=gil`).then(r => r.json()),
      ])
      const all = [
        ...(toAgent.messages ?? []).filter((m: Message) => m.from_agent === 'gil'),
        ...(fromAgent.messages ?? []).filter((m: Message) => m.from_agent === agentId),
      ]
      all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      setMessages(all)
    } catch {}
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 15000)
    return () => clearInterval(interval)
  }, [agentId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await fetch('/api/agent-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Agent-Key': 'claude-os-2026-gil' },
        body: JSON.stringify({
          from_agent: 'gil',
          to_agent: agentId,
          subject: text.trim().slice(0, 60),
          body: text.trim(),
          priority: 'high',
        }),
      })
      setText('')
      await fetchMessages()
    } finally {
      setSending(false)
    }
  }

  const isGil = (m: Message) => m.from_agent === 'gil'

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e6e9ef', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e6e9ef', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: agentColor }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#323338' }}>שיחה עם {agentLabel}</span>
        <span style={{ fontSize: 11, color: '#9699a6', marginRight: 'auto' }}>מתרענן כל 15 שניות</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 280, maxHeight: 400 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9699a6', fontSize: 13, padding: '32px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            כתוב הוראה או שאלה — {agentLabel} יקרא ויענה בריצה הבאה
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isGil(m) ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: isGil(m) ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: isGil(m) ? '#0073EA' : '#f5f6f8',
              color: isGil(m) ? '#fff' : '#323338',
              fontSize: 13, lineHeight: 1.6,
            }}>
              {m.body}
            </div>
            <div style={{ fontSize: 10, color: '#9699a6', marginTop: 3, padding: '0 4px' }}>
              {isGil(m) ? 'אתה' : agentLabel} · {timeStr(m.created_at)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #e6e9ef', display: 'flex', gap: 8 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={`כתוב הוראה ל${agentLabel}...`}
          style={{
            flex: 1, border: '1px solid #e6e9ef', borderRadius: 8,
            padding: '8px 12px', fontSize: 13, outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = '#0073EA')}
          onBlur={e => (e.currentTarget.style.borderColor = '#e6e9ef')}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          style={{
            background: text.trim() ? '#0073EA' : '#e6e9ef',
            color: text.trim() ? '#fff' : '#9699a6',
            border: 'none', borderRadius: 8, padding: '8px 14px',
            cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, transition: 'background 0.15s',
          }}
        >
          <Send size={14} />
          שלח
        </button>
      </div>
    </div>
  )
}
