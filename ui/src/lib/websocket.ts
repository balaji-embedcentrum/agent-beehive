import { Message } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

type MessageHandler = (msg: Message) => void

export class HiveWebSocket {
  private ws: WebSocket | null = null
  private roomId: string
  private handlers: MessageHandler[] = []
  private pingInterval: ReturnType<typeof setInterval> | null = null

  constructor(roomId: string) {
    this.roomId = roomId
  }

  connect() {
    this.ws = new WebSocket(`${WS_URL}/ws/${this.roomId}`)

    this.ws.onopen = () => {
      console.log('[ws] connected to room', this.roomId)
      this.pingInterval = setInterval(() => {
        this.ws?.send('ping')
      }, 30000)
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message' && data.message) {
          this.handlers.forEach(h => h(data.message as Message))
        }
      } catch {}
    }

    this.ws.onclose = () => {
      console.log('[ws] disconnected — reconnecting in 3s')
      if (this.pingInterval) clearInterval(this.pingInterval)
      setTimeout(() => this.connect(), 3000)
    }

    this.ws.onerror = (e) => {
      console.error('[ws] error', e)
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler)
  }

  disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval)
    this.ws?.close()
  }
}
