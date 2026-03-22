'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { User } from '@/types'
import { isAuthenticated } from '@/lib/auth'
import ChatRoom from '@/components/ChatRoom'

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/')
      return
    }
    api.me().then(setUser).catch(() => router.push('/'))
  }, [router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-yellow-400 text-2xl animate-pulse">🐝</div>
      </div>
    )
  }

  return <ChatRoom user={user} />
}
