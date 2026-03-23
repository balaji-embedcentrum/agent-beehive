import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { marked } from 'marked'
import type { Message } from '../../stores/chatStore'

const AGENT_COLORS = [
  '#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899',
  '#06b6d4','#84cc16','#f97316','#ef4444','#a78bfa'
]

function agentColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AGENT_COLORS.length
  return AGENT_COLORS[h]
}

function timeStr(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

interface Props { message: Message }

export function MessageBubble({ message }: Props) {
  const [copied, setCopied] = useState(false)
  const isUser = message.sender_type === 'user'
  const name = message.agent_name || message.sender_name || (isUser ? 'You' : 'Agent')
  const initial = name.charAt(0).toUpperCase()
  const color = isUser ? 'var(--accent)' : agentColor(name)

  const html = !isUser ? marked.parse(message.content, { breaks: true }) as string : null

  const copy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      display: 'flex', gap: 10, maxWidth: '82%', padding: '2px 0',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      flexDirection: isUser ? 'row-reverse' : 'row',
    }}>
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0, marginTop: 4,
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: isUser ? '#000' : '#fff',
      }}>
        {initial}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color }}>{name}</span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{timeStr(message.created_at)}</span>
        </div>

        <div style={{ position: 'relative' }} className="msg-wrap">
          <div style={{
            padding: '10px 14px',
            borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: isUser ? 'var(--user-bubble)' : 'var(--agent-bubble)',
            border: `1px solid ${isUser ? 'var(--user-bubble-border)' : 'var(--agent-bubble-border)'}`,
            fontSize: 14, lineHeight: 1.65,
            wordBreak: 'break-word',
          }}>
            {isUser ? (
              <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
            ) : (
              <div
                className="md-content"
                dangerouslySetInnerHTML={{ __html: html || '' }}
              />
            )}
          </div>

          {/* Copy button */}
          <button onClick={copy} style={{
            position: 'absolute', top: 6, right: isUser ? 'auto' : 6, left: isUser ? 6 : 'auto',
            background: 'var(--surface-3)', border: '1px solid var(--border-subtle)',
            borderRadius: 6, padding: '3px 6px', color: 'var(--text-tertiary)',
            opacity: 0, transition: 'opacity var(--transition-fast)',
            display: 'flex', alignItems: 'center',
          }} className="copy-btn">
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      <style>{`.msg-wrap:hover .copy-btn { opacity: 1 !important; }`}</style>
    </div>
  )
}
