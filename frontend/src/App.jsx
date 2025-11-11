import React, { useState, useRef, useEffect } from 'react'

export default function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connected')
  const [messageCount, setMessageCount] = useState(0)
  const eventSourceRef = useRef(null)
  const chatEndRef = useRef(null)

  // Auto scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, isTyping])

  // Check backend connection on mount
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/test')
      setConnectionStatus(response.ok ? 'connected' : 'error')
    } catch (err) {
      setConnectionStatus('disconnected')
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    
    const userMessage = {
      role: 'user', 
      text: input, 
      timestamp: new Date(),
      id: Date.now()
    }
    
    setMessages(prev => [...prev, userMessage])
    setMessageCount(prev => prev + 1)
    setLoading(true)
    setIsTyping(true)
    setInput('')

    // Simulate typing delay
    setTimeout(() => setIsTyping(false), 1000)

    try {
      const resp = await fetch('http://localhost:4000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      if (!resp.ok) {
        const text = await resp.text()
        const errorMessage = {
          role: 'assistant',
          text: `⚠️ Error del servidor: ${resp.status}. ${text}`,
          timestamp: new Date(),
          id: Date.now(),
          isError: true
        }
        setMessages(prev => [...prev, errorMessage])
        setConnectionStatus('error')
        setLoading(false)
        setIsTyping(false)
        return
      }

      const data = await resp.json()
      const assistantMessage = {
        role: 'assistant',
        text: data.message,
        timestamp: new Date(),
        id: Date.now()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      setConnectionStatus('connected')
      setLoading(false)
      setIsTyping(false)
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        text: '❌ Error de conexión. Verifica que el servidor esté ejecutándose.',
        timestamp: new Date(),
        id: Date.now(),
        isError: true      }
      setMessages(prev => [...prev, errorMessage]);
      setConnectionStatus('disconnected')
      setLoading(false)
      setIsTyping(false)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="header-content">
          <div className="header-title">
            <h1>Gemini AI Pro</h1>
            <p>Conversación avanzada con inteligencia artificial</p>
          </div>
          <div className="header-status">
            <div className={`status-indicator ${connectionStatus}`}>
              <div className="status-dot"></div>
              <span className="status-text">
                {connectionStatus === 'connected' ? 'Conectado' : 
                 connectionStatus === 'error' ? 'Error' : 'Desconectado'}
              </span>
            </div>
            <div className="message-counter">
              {messageCount} mensajes
            </div>
          </div>
        </div>
      </div>
      
      <div className="chat">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <h3>¡Bienvenido a Gemini AI Pro!</h3>
            <p>Comienza una conversación inteligente escribiendo tu mensaje abajo.</p>
            <div className="quick-actions">
              <button className="quick-action" onClick={() => setInput('¿Qué es la inteligencia artificial?')}>
                🧠 ¿Qué es la IA?
              </button>
              <button className="quick-action" onClick={() => setInput('Escríbeme un poema')}>
                ✍️ Escribe un poema
              </button>
              <button className="quick-action" onClick={() => setInput('Explícame JavaScript')}>
                💻 Explica JavaScript
              </button>
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={m.id || i} className={`message ${m.role} ${m.isError ? 'error' : ''}`}>
              <div className="message-content">{m.text}</div>
              <div className="message-timestamp">
                {formatTime(m.timestamp)}
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="message assistant typing">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">Gemini está escribiendo...</span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>
      
      <div className="composer">
        <div className="composer-wrapper">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            placeholder="Escribe tu mensaje aquí... (Enter para enviar)" 
            onKeyPress={e => e.key === 'Enter' && !loading && handleSend()}
            disabled={loading}
            className="composer-input"
          />
          <button 
            onClick={handleSend} 
            disabled={loading || !input.trim()}
            className="send-button"
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
        <div className="composer-footer">
          <span className="composer-hint">
            Gemini puede cometer errores. Verifica la información importante.
          </span>
        </div>
      </div>
    </div>
  )
}
