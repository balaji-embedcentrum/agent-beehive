import { useEffect, useRef } from 'react'
import { AgentSidebar } from './layout/AgentSidebar'
import { ChatThread } from './chat/ChatThread'
import { InputBar } from './chat/InputBar'
import { useChatStore } from '../stores/chatStore'
import { useAgentsStore } from '../stores/agentsStore'

export default function ChatPage() {
  const messages = useChatStore(s => s.messages)
  const connect = useChatStore(s => s.connect)
  const disconnect = useChatStore(s => s.disconnect)
  const loadHistory = useChatStore(s => s.loadHistory)
  const loadAgents = useAgentsStore(s => s.loadAgents)
  const inputRef = useRef<{ insertMention: (name: string) => void } | null>(null)

  useEffect(() => {
    loadAgents()
    loadHistory()
    connect()

    // Poll agents every 30s for online status
    const poll = setInterval(() => loadAgents(), 30000)
    return () => {
      clearInterval(poll)
      disconnect()
    }
  }, [])

  const handleMention = (name: string) => {
    // Dispatch custom event to InputBar
    window.dispatchEvent(new CustomEvent('beehive:mention', { detail: name }))
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      <AgentSidebar onMention={handleMention} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <ChatThread messages={messages} />
        <InputBar />
      </div>
    </div>
  )
}
