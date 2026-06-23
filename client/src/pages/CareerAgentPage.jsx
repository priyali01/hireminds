import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSendChatMessageMutation } from '../store/api'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import '../styles/dashboard.css'

export default function CareerAgentPage() {
  const [messages, setMessages] = useState([
    { 
      role: 'model', 
      text: "Hi! I'm your AI Career Coach. I know your resume, your target roles, and your interview history. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
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
    e?.preventDefault()
    if (!input.trim()) return

    const userMessage = input.trim()
    setInput('')
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const history = messages.filter(m => m.role !== 'error').slice(1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }))

    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp }])

    try {
      const res = await sendMessage({ message: userMessage, history }).unwrap()
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'error', 
        text: 'Looks like I couldn\'t connect to the agent service.\n\nPlease check your connection and try again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    }
  }

  return (
    <div className="dashboard-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <nav className="nav" style={{ flexShrink: 0, padding: '1rem 2rem', background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--color-primary-dark)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--color-primary-light)' }}>
            🤖
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Career Agent</h1>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary-light)', padding: '0.125rem 0.5rem', fontSize: '0.75rem', borderRadius: '1rem' }}>AI Coach</span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Your personal AI career coach, available 24/7
            </p>
          </div>
        </div>
        <Link to="/dashboard" className="btn btn-ghost" style={{ border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>←</span> Back to Dashboard
        </Link>
      </nav>

      <div className="dashboard-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1rem 2rem 2rem 2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        {/* Chat Area */}
        <div className="glass-card" style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '1rem', background: 'var(--color-bg)', border: 'none' }}>
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user'
            const isError = msg.role === 'error'

            if (isUser) {
              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '60%' }}
                >
                  <div style={{
                    background: 'var(--color-primary)',
                    color: '#000',
                    padding: '1rem 1.25rem',
                    borderRadius: '1rem 1rem 0 1rem',
                    lineHeight: '1.5',
                    fontSize: '0.9375rem',
                    fontWeight: 500
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {msg.timestamp} <span style={{ color: 'var(--color-primary-light)' }}>✓✓</span>
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ alignSelf: 'flex-start', display: 'flex', gap: '1rem', maxWidth: '75%' }}
              >
                <div style={{ width: '36px', height: '36px', flexShrink: 0, background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', color: 'var(--color-primary-light)', alignSelf: 'flex-start' }}>
                  🤖
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: 'var(--color-text)',
                    padding: '1.25rem',
                    borderRadius: '0 1rem 1rem 1rem',
                    lineHeight: '1.6',
                    fontSize: '0.9375rem'
                  }}>
                    {isError ? (
                      <div>
                        {msg.text.split('\n').map((line, i) => (
                          <p key={i} style={{ margin: i === 0 ? '0 0 0.5rem 0' : '0', fontWeight: i === 0 ? 600 : 400, color: i === 0 ? '#fff' : 'var(--color-text-muted)' }}>{line}</p>
                        ))}
                        <button onClick={() => {}} className="btn btn-ghost" style={{ marginTop: '1rem', border: '1px solid var(--color-primary-dark)', color: 'var(--color-primary-light)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1rem' }}>↻</span> Retry Connection
                        </button>
                      </div>
                    ) : (
                      <div className="markdown-body" style={{ color: 'inherit' }}>
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-faint)', marginLeft: '0.25rem' }}>
                    {msg.timestamp}
                  </div>
                </div>
              </motion.div>
            )
          })}

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ alignSelf: 'flex-start', display: 'flex', gap: '1rem' }}
            >
              <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                🤖
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '1.25rem',
                borderRadius: '0 1rem 1rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span className="spinner" style={{ width: '16px', height: '16px' }} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', marginTop: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '1rem', alignItems: 'center' }}>
          <input 
            className="input" 
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '0.5rem 1rem', outline: 'none', color: 'var(--color-text)' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your resume, interview weak points, or what to learn next..."
            disabled={isLoading}
          />
          <button type="button" style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Attach file">
            📎
          </button>
          <button className="btn btn-primary" type="submit" disabled={isLoading || !input.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '0.75rem' }}>
            Send <span style={{ fontSize: '1rem' }}>↗</span>
          </button>
        </form>

      </div>
    </div>
  )
}
