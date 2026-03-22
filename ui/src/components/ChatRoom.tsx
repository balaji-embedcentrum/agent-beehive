'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Message, Agent, Room, User } from '@/types'
import { api } from '@/lib/api'
import { HiveWebSocket } from '@/lib/websocket'
import MessageBubble from './MessageBubble'
import AgentSidebar from './AgentSidebar'

interface Props {
  user: User
}

export default function ChatRoom({ user }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [room, setRoom] = useState<Room | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [mentions, setMentions] = useState<string[]>([])
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const wsRef = useRef<HiveWebSocket | null>(null)

  // Load initial data
  useEffect(() => {
    async function init() {
      const [rooms, agentList] = await Promise.all([api.listRooms(), api.listAgents()])
      const generalRoom = rooms.find(r => r.name === 'general') || rooms[0]
      if (!generalRoom) return
      setRoom(generalRoom)
      setAgents(agentList)
      const history = await api.getHistory(generalRoom.id)
      setMessages(history)

      // Connect WebSocket
      const ws = new HiveWebSocket(generalRoom.id)
      ws.connect()
      ws.onMessage(msg => {
        setMessages(prev => [...prev, msg])
      })
      wsRef.current = ws
    }
    init()
    return () => wsRef.current?.disconnect()
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Refresh agents every 30s
  useEffect(() => {
    const interval = setInterval(async () => {
      const agentList = await api.listAgents()
      setAgents(agentList)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await api.sendMessage(input.trim(), room?.id)
      setInput('')
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const insertMention = (name: string) => {
    const mention = `@${name} `
    setInput(prev => {
      const lastAt = prev.lastIndexOf('@')
      if (lastAt >= 0 && !prev.slice(lastAt).includes(' ')) {
        return prev.slice(0, lastAt) + mention
      }
      return prev + mention
    })
    setShowMentionPicker(false)
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)
    // Show mention picker when typing @
    const lastWord = val.split(/\s/).pop() || ''
    setShowMentionPicker(lastWord.startsWith('@') && lastWord.length >= 1)
  }

  const onlineMentions = ['all', ...agents.filter(a => a.is_online).map(a => a.name)]
  const lastWord = input.split(/\s/).pop() || ''
  const mentionQuery = lastWord.startsWith('@') ? lastWord.slice(1).toLowerCase() : ''
  const filteredMentions = onlineMentions.filter(n => n.startsWith(mentionQuery))

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <AgentSidebar agents={agents} onMention={insertMention} />

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-gray-800 flex items-center px-6 gap-3">
          <span className="text-xl">🐝</span>
          <div>
            <h1 className="font-semibold text-gray-100">BeehiveHQ</h1>
            <p className="text-xs text-gray-500">
              {agents.filter(a => a.is_online).length} agents online
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-400">{user.username}</span>
            <a href="/agents" className="text-xs text-yellow-400 hover:text-yellow-300 transition">
              Manage Agents
            </a>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🐝</div>
              <h2 className="text-xl font-semibold text-gray-300">Welcome to your Hive</h2>
              <p className="text-gray-500 mt-2 max-w-md">
                Start chatting! Use <span className="text-yellow-400 font-mono">@agentname</span> to
                talk to a specific agent, or <span className="text-yellow-400 font-mono">@all</span> to
                broadcast to everyone.
              </p>
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} currentUser={user.username} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4 relative">
          {/* Mention picker */}
          {showMentionPicker && filteredMentions.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-800 border border-gray-700
                           rounded-xl shadow-xl overflow-hidden">
              {filteredMentions.slice(0, 6).map(name => (
                <button
                  key={name}
                  onClick={() => insertMention(name)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-700 transition text-left"
                >
                  <span className={`w-2 h-2 rounded-full ${name === 'all' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  <span className="text-sm text-gray-200 font-medium">@{name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Message the Hive... (use @agentname or @all)"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-gray-100
                         placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1
                         focus:ring-yellow-500 resize-none transition"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold
                         rounded-xl px-5 py-3 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? '...' : '↑'}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Enter to send · Shift+Enter for new line · @mention to target an agent
          </p>
        </div>
      </div>
    </div>
  )
}
