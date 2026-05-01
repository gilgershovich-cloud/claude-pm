'use client'

import { STATUS_CONFIG, type Status } from '@/lib/types'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  status: Status
  onChange: (s: Status) => void
  size?: 'sm' | 'md'
}

export function StatusCell({ status, onChange, size = 'md' }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.planning

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const inBtn = btnRef.current?.contains(e.target as Node)
      const inDrop = dropRef.current?.contains(e.target as Node)
      if (!inBtn && !inDrop) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleOpen() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left })
    }
    setOpen(v => !v)
  }

  function select(s: Status) {
    onChange(s)
    setOpen(false)
  }

  const dropdown = open && mounted ? createPortal(
    <div
      ref={dropRef}
      style={{
        position: 'fixed', top: pos.top, left: pos.left,
        zIndex: 99999, background: '#fff',
        border: '1px solid #e6e9ef', borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        padding: 6, minWidth: 170,
      }}
    >
      {(Object.keys(STATUS_CONFIG) as Status[]).map(s => {
        const c = STATUS_CONFIG[s]
        return (
          <button
            key={s}
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => select(s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', border: 'none',
              background: s === status ? '#f5f6f8' : 'transparent',
              padding: '7px 10px', cursor: 'pointer', borderRadius: 4,
              fontSize: 13, color: '#323338', userSelect: 'none',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f5f6f8')}
            onMouseLeave={e => (e.currentTarget.style.background = s === status ? '#f5f6f8' : 'transparent')}
          >
            <span style={{ width: 12, height: 12, borderRadius: 3, background: c.bg, flexShrink: 0 }} />
            {c.label}
          </button>
        )
      })}
    </div>,
    document.body
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        style={{
          background: cfg.bg, color: cfg.color,
          border: 'none', borderRadius: 4,
          padding: size === 'sm' ? '3px 8px' : '4px 10px',
          fontSize: size === 'sm' ? 11 : 12,
          fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap', userSelect: 'none',
        }}
      >
        {cfg.label}
      </button>
      {dropdown}
    </>
  )
}
