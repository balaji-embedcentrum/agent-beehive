import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface User { id: string; username: string }

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: () => boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: () => !!get().token,

      login: async (username, password) => {
        const form = new FormData()
        form.append('username', username)
        form.append('password', password)
        const res = await fetch(`${API}/auth/login`, { method: 'POST', body: form })
        if (!res.ok) throw new Error('Invalid credentials')
        const data = await res.json()
        set({ token: data.access_token })
        await get().fetchMe()
      },

      logout: () => {
        set({ token: null, user: null })
        window.location.hash = '/'
      },

      fetchMe: async () => {
        const { token } = get()
        if (!token) return
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const user = await res.json()
          set({ user })
        } else {
          set({ token: null, user: null })
        }
      },
    }),
    { name: 'beehive-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)
