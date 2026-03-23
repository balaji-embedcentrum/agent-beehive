import { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { useAgentsStore } from '../../stores/agentsStore'

export function InputBar() {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [mentionOpen, setMentionOpen] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [mentionIdx, setMentionIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const send = useChatStore(s => s.send)
  const agents = useAgentsStore(s => s.agents)

  // Listen for mention events from sidebar
  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent).detail as string
      const prefix = text.trim() ? text + ' @' + name + ' ' : '@' + name + ' '
      setText(prefix)
      setMentionOpen(false)
      textareaRef.current?.focus()
    }
    window.addEventListener('beehive:mention', handler)
    return () => window.removeEventListener('beehive:mention', handler)
  }, [text])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [text])

  const mentionCandidates = [
    { name: 'all', display_name: 'All agents', is_online: true },
    ...agents.filter(a =>
      a.name.toLowerCase().includes(mentionFilter.toLowerCase()) ||
      a.display_name.toLowerCase().includes(mentionFilter.toLowerCase())
    )
  ]

  const handleChange = (val: string) => {
    setText(val)
    const cursorPos = textareaRef.current?.selectionStart || val.length
    const beforeCursor = val.slice(0, cursorPos)
    const atMatch = beforeCursor.match(/@([\w]*)$/)
    if (atMatch) {
      setMentionFilter(atMatch[1])
      setMentionOpen(true)
      setMentionIdx(0)
    } else {
      setMentionOpen(false)
    }
  }

  const insertMention = (name: string) => {
    const ta = textareaRef.current
    const cursorPos = ta?.selectionStart || text.length
    const beforeCursor = text.slice(0, cursorPos)
    const afterCursor = text.slice(cursorPos)
    const atPos = beforeCursor.lastIndexOf('@')
    const newText = beforeCursor.slice(0, atPos) + '@' + name + ' ' + afterCursor
    setText(newText)
    setMentionOpen(false)
    ta?.focus()
  }

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, mentionCandidates.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); if (mentionCandidates[mentionIdx]) insertMention(mentionCandidates[mentionIdx].name); return }
      if (e.key === 'Escape') { setMentionOpen(false); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleSend = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true); setText('')
    try { await send(content) } finally { setSending(false) }
  }

  return (
    <div style={{
      padding: '12px 16px 16px', background: 'var(--surface-1)',
      borderTop: '1px solid var(--border-subtle)', flexShrink: 0, position: 'relative',
    }}>
      {/* @mention dropdown */}
      {mentionOpen && mentionCandidates.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 16, right: 16, marginBottom: 4,
          background: 'var(--surface-3)', border: '1px solid var(--border-default)',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
          maxHeight: 220, overflowY: 'auto', zIndex: 100,
        }}>
          {mentionCandidates.map((a, i) => (
            <div key={a.name} onMouseDown={e => { e.preventDefault(); insertMention(a.name) }} style={{
              padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              background: i === mentionIdx ? 'var(--bg-hover)' : 'transparent',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#000', flexShrink: 0,
              }}>
                {a.name === 'all' ? '🌐' : a.display_name.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.display_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{a.name}</div>
              </div>
              {'is_online' in a && a.name !== 'all' && (
                <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: a.is_online ? '#4ade80' : '#52525b' }} />
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 10,
        background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: 14, padding: '10px 14px',
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="@all send a message... (@ to mention an agent)"
          rows={1}
          style={{
            flex: 1, background: 'none', border: 'none', resize: 'none',
            color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.6,
            padding: 0, outline: 'none', fontFamily: 'var(--font-sans)',
            minHeight: 24, maxHeight: 200,
          }}
        />
        <button onClick={handleSend} disabled={!text.trim() || sending} style={{
          background: text.trim() ? 'var(--accent)' : 'var(--surface-3)',
          border: 'none', borderRadius: 8, padding: '7px 10px', flexShrink: 0,
          color: text.trim() ? '#000' : 'var(--text-tertiary)',
          transition: 'all var(--transition-fast)', display: 'flex', alignItems: 'center',
        }}>
          <Send size={16} />
        </button>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, textAlign: 'center' }}>
        Enter to send · Shift+Enter for new line · @ to mention an agent
      </div>
    </div>
  )
}
