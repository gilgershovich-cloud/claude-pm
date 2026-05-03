'use client'

import { useState, useRef } from 'react'

interface Props {
  text: string
  children: React.ReactNode
}

const cache: Record<string, string> = {}

export function TranslateTooltip({ text, children }: Props) {
  const [tooltip, setTooltip] = useState<string | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchTranslation(x: number, y: number) {
    if (cache[text]) {
      setTooltip(cache[text])
      setPos({ x, y })
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/translate?text=${encodeURIComponent(text)}`)
      const data = await res.json()
      cache[text] = data.translation
      setTooltip(data.translation)
      setPos({ x, y })
    } catch {}
    setLoading(false)
  }

  function handleMouseEnter(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    timerRef.current = setTimeout(() => {
      fetchTranslation(rect.left, rect.top)
    }, 600)
  }

  function handleMouseLeave() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setTooltip(null)
    setLoading(false)
  }

  return (
    <span style={{ position: 'relative', display: 'inline' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {(tooltip || loading) && (
        <span style={{
          position: 'fixed',
          top: pos.y - 42,
          left: pos.x,
          background: '#1f2d3d',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          padding: '6px 12px',
          borderRadius: 8,
          whiteSpace: 'nowrap',
          zIndex: 99999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}>
          {loading ? '...' : tooltip}
          {/* Arrow */}
          <span style={{
            position: 'absolute', bottom: -6, left: 16,
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1f2d3d',
          }} />
        </span>
      )}
    </span>
  )
}
