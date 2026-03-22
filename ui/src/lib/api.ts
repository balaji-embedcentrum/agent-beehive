import { Agent, Message, Room, User, Token } from '@/types'
import { getToken, setToken, clearToken } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (res.status === 401) {
    clearToken()
    window.location.href = '/'
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err)
  }
  return res.json()
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<Token> {
    const form = new FormData()
    form.append('username', username)
    form.append('password', password)
    const res = await fetch(`${API_URL}/auth/login`, { method: 'POST', body: form })
    if (!res.ok) throw new Error('Login failed')
    const data = await res.json()
    setToken(data.access_token)
    return data
  },

  async me(): Promise<User> {
    return request<User>('/auth/me')
  },

  // Agents
  async listAgents(): Promise<Agent[]> {
    return request<Agent[]>('/agents')
  },

  async addAgent(agent: Partial<Agent>): Promise<Agent> {
    return request<Agent>('/agents', { method: 'POST', body: JSON.stringify(agent) })
  },

  async removeAgent(name: string): Promise<void> {
    return request(`/agents/${name}`, { method: 'DELETE' })
  },

  async setDefaultAgent(name: string): Promise<void> {
    return request(`/agents/${name}/set-default`, { method: 'POST' })
  },

  // Chat
  async listRooms(): Promise<Room[]> {
    return request<Room[]>('/chat/rooms')
  },

  async getHistory(roomId: string, limit = 100): Promise<Message[]> {
    return request<Message[]>(`/chat/history/${roomId}?limit=${limit}`)
  },

  async sendMessage(content: string, roomId?: string): Promise<void> {
    return request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ content, room_id: roomId }),
    })
  },
}
