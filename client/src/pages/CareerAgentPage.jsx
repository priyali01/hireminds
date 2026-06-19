import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSendChatMessageMutation } from '../store/api'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import '../styles/dashboard.css'

export default function CareerAgentPage() {
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hi! I'm your AI Career Coach. I know your resume, your target roles, and your interview history. How can I help you today?" }
  ])
  const [input, setInput] = useState('')
  const [sendMessage, { isLoading }] = useSendChatMessageMutation()
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    
    // Convert to Gemini history format
    const history = messages.slice(1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }))

    // Optimistic UI update
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])

    try {
      const res = await sendMessage({ message: userMessage, history }).unwrap()
      setMessages(prev => [...prev, { role: 'model', text: res.response }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: 'Error: ' + (err.data?.error || 'Could not connect to the agent.') }])
    }
  }

  return (
    <div className="dashboard-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="nav" style={{ flexShrink: 0 }}>
        <div className="nav-brand">🤖 Career Agent</div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Back to Dashboard</Link>
        </div>
      </nav>

      <div className="dashboard-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem' }}>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
                color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                padding: '1rem',
                borderRadius: '1rem',
                maxWidth: '75%',
                border: msg.role === 'model' ? '1px solid var(--color-border)' : 'none',
                lineHeight: '1.5'
              }}
            >
              {msg.role === 'user' ? (
                <div>{msg.text}</div>
              ) : (
                <div className="markdown-body" style={{ color: 'inherit' }}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ alignSelf: 'flex-start', padding: '1rem', color: 'var(--color-text-muted)' }}
            >
              Thinking...
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <input 
            className="input" 
            style={{ flex: 1 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your resume, interview weak points, or what to learn next..."
            disabled={isLoading}
          />
          <button className="btn btn-primary" type="submit" disabled={isLoading || !input.trim()}>
            Send
          </button>
        </form>

      </div>
    </div>
  )
}
