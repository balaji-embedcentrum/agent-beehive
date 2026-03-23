import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import type { Message } from '../../stores/chatStore'

interface Props { messages: Message[] }

export function ChatThread({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '20px 20px 8px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {messages.length === 0 && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-tertiary)', gap: 12,
        }}>
          <div style={{ fontSize: 56 }}>🐝</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)' }}>Welcome to BeehiveHQ</div>
          <div style={{ fontSize: 14, maxWidth: 360, textAlign: 'center' }}>
            Use @agentname to talk to a specific agent, or @all to broadcast to everyone.
          </div>
        </div>
      )}
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
