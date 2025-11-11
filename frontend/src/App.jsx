import React, { useState, useRef } from 'react'

export default function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const eventSourceRef = useRef(null)

  const handleSend = async () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: input }])

    setLoading(true)
    setInput('')

    // Llamamos al backend que reenvía el streaming
    try {
      const resp = await fetch('http://localhost:4000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      if (!resp.ok) {
        const text = await resp.text()
        setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${text}` }])
        setLoading(false)
        return
      }

      // Leemos el body como stream
      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        assistantText += chunk
        // Actualizamos UI incrementalmente
        setMessages(prev => {
          const withoutLast = prev.filter((m, i) => i !== prev.length - 1)
          return [...withoutLast, { role: 'assistant', text: assistantText }]
        })
      }

      setLoading(false)
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error de conexión' }])
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Gemini POC</h1>
      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>{m.text}</div>
        ))}
      </div>
      <div className="composer">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe tu mensaje..." />
        <button onClick={handleSend} disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</button>
      </div>
    </div>
  )
}
