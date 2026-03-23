import { useEffect, useState } from 'react'
import { useAuthStore } from './stores/authStore'
import LoginPage from './components/LoginPage'
import ChatPage from './components/ChatPage'
import AgentsPage from './components/agents/AgentsPage'

function getRoute() {
  return window.location.hash.replace('#', '') || '/'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)
  const isAuth = useAuthStore(s => s.isAuthenticated())

  useEffect(() => {
    const handler = () => setRoute(getRoute())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  if (!isAuth) return <LoginPage />
  if (route === '/agents') return <AgentsPage />
  return <ChatPage />
}
