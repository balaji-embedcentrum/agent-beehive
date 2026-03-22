import { Message } from '@/types'

interface Props {
  message: Message
  currentUser: string
}

export default function MessageBubble({ message, currentUser }: Props) {
  const isUser = message.sender_type === 'user'
  const isMe = isUser && message.sender_name === currentUser
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
        ${isUser ? 'bg-blue-600 text-white' : 'bg-yellow-500 text-gray-900'}`}>
        {message.sender_name.charAt(0).toUpperCase()}
      </div>

      {/* Bubble */}
      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs font-semibold text-gray-400">{message.sender_name}</span>
          <span className="text-xs text-gray-600">{time}</span>
          {message.is_broadcast && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">@all</span>
          )}
        </div>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
          ${isMe
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : isUser
            ? 'bg-gray-700 text-gray-100 rounded-tl-sm'
            : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-sm'
          }`}>
          {renderContent(message.content)}
        </div>
      </div>
    </div>
  )
}

function renderContent(content: string) {
  // Highlight @mentions
  const parts = content.split(/(@\w+)/g)
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className="text-yellow-400 font-semibold">{part}</span>
      : <span key={i}>{part}</span>
  )
}
