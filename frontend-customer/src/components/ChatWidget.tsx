import { useState, useRef, useEffect } from 'react'
import { useLang } from '../context/LangContext'
import { useCart } from '../context/CartContext'
import { sendChat } from '../api/client'

let msgIdCounter = Date.now()
function nextId() {
  return ++msgIdCounter
}

interface UIMessage {
  id: number
  role: 'agent' | 'customer'
  text: string
}

export default function ChatWidget() {
  const { lang, t } = useLang()
  const { applyCartResponse } = useCart()
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    const custMsg: UIMessage = { id: nextId(), role: 'customer', text: trimmed }
    setMessages((prev) => [...prev, custMsg])
    setInput('')
    setTyping(true)
    try {
      const resp = await sendChat(trimmed)
      applyCartResponse({ lines: resp.cart, total: resp.total })
      const agentMsg: UIMessage = { id: nextId(), role: 'agent', text: resp.message }
      setMessages((prev) => [...prev, agentMsg])
    } catch {
      const errMsg: UIMessage = {
        id: nextId(),
        role: 'agent',
        text: t('Sorry, something went wrong. Please try again.', 'عذراً، حصلت مشكلة. حاول تاني.'),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="chat-widget">
      <div className="chat-messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble ${m.role === 'agent' ? 'bubble-agent' : 'bubble-customer'}`}
          >
            <p>{m.text}</p>
          </div>
        ))}

        {typing && (
          <div className="chat-bubble bubble-agent">
            <div className="typing-indicator">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="chat-input-wrap">
        <input
          className="chat-input"
          placeholder={t('Type your order...', 'اكتب طلبك...')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
        />
        <button className="send-btn" disabled={!input.trim()} onClick={() => send(input)}>
          {lang === 'ar' ? 'إرسال' : 'Send'}
        </button>
      </div>
    </div>
  )
}
