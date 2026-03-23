import { create } from 'zustand'
import { useAuthStore } from './authStore'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Agent {
  id: string
  name: string
  display_name: string
  url: string
  adapter: string
  model: string
  description: string
  is_default: boolean
  is_online: boolean
  last_seen: string | null
}

interface AgentsState {
  agents: Agent[]
  loading: boolean
  loadAgents: () => Promise<void>
  addAgent: (data: Partial<Agent>) => Promise<void>
  removeAgent: (name: string) => Promise<void>
  setDefault: (name: string) => Promise<void>
}

function authHeaders() {
  const token = useAuthStore.getState().token
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export const useAgentsStore = create<AgentsState>((set) => ({
  agents: [],
  loading: false,

  loadAgents: async () => {
    set({ loading: true })
    try {
      const res = await fetch(`${API}/agents`, { headers: authHeaders() })
      if (res.ok) set({ agents: await res.json() })
    } finally {
      set({ loading: false })
    }
  },

  addAgent: async (data) => {
    const res = await fetch(`${API}/agents`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await res.text())
    await useAgentsStore.getState().loadAgents()
  },

  removeAgent: async (name) => {
    await fetch(`${API}/agents/${name}`, { method: 'DELETE', headers: authHeaders() })
    await useAgentsStore.getState().loadAgents()
  },

  setDefault: async (name) => {
    await fetch(`${API}/agents/${name}/set-default`, { method: 'POST', headers: authHeaders() })
    await useAgentsStore.getState().loadAgents()
  },
}))
