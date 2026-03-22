export interface Agent {
  id: string
  name: string
  display_name: string
  url: string
  adapter: string
  model?: string
  description?: string
  avatar_url?: string
  is_online: boolean
  is_default: boolean
  last_seen?: string
  capabilities: string[]
}

export interface Message {
  id: string
  room_id: string
  content: string
  sender_type: 'user' | 'agent'
  sender_name: string
  sender_id?: string
  mentions: string[]
  is_broadcast: boolean
  metadata: Record<string, any>
  created_at: string
}

export interface Room {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface User {
  id: string
  username: string
  email?: string
  is_admin: boolean
}

export interface Token {
  access_token: string
  token_type: string
}
