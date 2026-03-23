import { create } from 'zustand'
import { useAuthStore } from './authStore'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const ROOM_ID = 'main'

export interface Message {
  id: string
  content: string
  sender_type: 'user' | 'agent'
  sender_name: string
  agent_name?: string
  created_at: string
}

interface ChatState {
  messages: Message[]
  ws: WebSocket | null
  connected: boolean
  send: (content: string) => Promise<void>
  connect: () => void
  disconnect: () => void
  loadHistory: () => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  ws: null,
  connected: false,

  loadHistory: async () => {
    const token = useAuthStore.getState().token
    const res = await fetch(`${API}/chat/history/${ROOM_ID}?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const msgs = await res.json()
      set({ messages: msgs })
    }
  },

  send: async (content) => {
    const token = useAuthStore.getState().token
    const user = useAuthStore.getState().user
    // Optimistic local message
    const optimistic: Message = {
      id: `local-${Date.now()}`,
      content,
      sender_type: 'user',
      sender_name: user?.username || 'you',
      created_at: new Date().toISOString(),
    }
    set(s => ({ messages: [...s.messages, optimistic] }))
    await fetch(`${API}/chat/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, room_id: ROOM_ID }),
    })
  },

  connect: () => {
    const token = useAuthStore.getState().token
    if (!token) return
    const ws = new WebSocket(`${WS_URL}/ws/${ROOM_ID}?token=${token}`)

    ws.onopen = () => set({ connected: true })
    ws.onclose = () => {
      set({ connected: false, ws: null })
      setTimeout(() => get().connect(), 3000)
    }
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message' && data.message) {
          const msg = data.message as Message
          // Don't duplicate user's own messages (already added optimistically)
          set(s => {
            const isDup = s.messages.some(m =>
              m.sender_type === 'user' && m.content === msg.content &&
              Math.abs(new Date(m.created_at).getTime() - new Date(msg.created_at).getTime()) < 5000
            )
            if (msg.sender_type === 'user' && isDup) return s
            return { messages: [...s.messages, msg] }
          })
        }
      } catch {}
    }

    set({ ws })
  },

  disconnect: () => {
    get().ws?.close()
    set({ ws: null, connected: false })
  },
}))
