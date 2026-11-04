import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const QUICK_CHIPS = [
  'What is due today?',
  'Analyze my deadline risks',
  'How is my study progress?',
  'Generate an exam revision plan',
  'Give me focus & memory tips',
  'Create a quick quiz for my subjects'
];

export function StudyAssistant() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your AI Study Assistant. I analyze your active deadlines, registered subjects, and study sessions to build personalized revision plans, flag deadline risks, and help you focus. How can I help you today?'
    }
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chatLogRef = useRef(null);

  // Load chat history from backend if authenticated
  useEffect(() => {
    if (user) {
      api.get('/api/ai/history').then(res => {
        if (res.success && res.data?.length > 0) {
          setMessages(res.data);
        }
      }).catch(err => {
        console.warn('[AI Assistant] Could not fetch chat history:', err.message);
      });
    }
  }, [user]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || prompt).trim();
    if (!query || loading) return;

    setError('');
    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      if (user) {
        const res = await api.post('/api/ai/chat', { prompt: query });
        if (res.success && res.data) {
          setMessages(prev => [...prev, res.data]);
        }
      } else {
        // Unauthenticated demo fallback response
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `> *💡 Operating in local demo mode. Sign in to your account to enable cloud chat persistence and AI synchronization with your subjects and deadlines.*

Regarding **"${query}"**: Break your tasks down into 25-minute Pomodoro sessions and conquer your highest-priority deadline first!`
            }
          ]);
          setLoading(false);
        }, 500);
        return;
      }
    } catch (err) {
      console.error('[AI Assistant] Chat error:', err);
      setError(err.message || 'Could not reach AI Assistant.');
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an issue connecting to the AI backend. Please verify your internet connection or check that the backend server is running.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (user) {
      try {
        await api.delete('/api/ai/history');
      } catch (err) {
        console.warn('[AI Assistant] Clear error:', err.message);
      }
    }
    setMessages([
      {
        role: 'assistant',
        content: 'Chat history cleared. What would you like to plan next?'
      }
    ]);
  };

  return (
    <div className="card chat">
      <div className="row between mb">
        <div>
          <h2>AI Study Assistant & Academic Coach</h2>
          <span className="mu">Powered by your server backend with access to your real tasks and subjects.</span>
        </div>
        <button
          className="ghost"
          onClick={handleClearHistory}
          style={{ fontSize: '0.8rem', padding: '4px 10px' }}
        >
          Clear History
        </button>
      </div>

      {/* Chat Log */}
      <div className="log" ref={chatLogRef} style={{ background: 'var(--bg)', borderRadius: '14px', padding: '16px' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`msg ${m.role === 'assistant' ? 'assistant' : 'user'}`}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="msg assistant" style={{ fontStyle: 'italic', opacity: 0.8 }}>
            Thinking and reviewing your academic schedule...
          </div>
        )}
      </div>

      {/* Quick Prompt Chips */}
      <div className="row mt" style={{ gap: '6px' }}>
        {QUICK_CHIPS.map(chip => (
          <button
            key={chip}
            type="button"
            className="ghost"
            style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '20px' }}
            onClick={() => handleSendMessage(chip)}
            disabled={loading}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="row mt"
      >
        <input
          type="text"
          placeholder="Ask about your deadlines, revision schedule, exam tips, or study strategies..."
          aria-label="Your question"
          maxLength={500}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn" disabled={loading || !prompt.trim()}>
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>

      {error && <p className="err">{error}</p>}

      <p className="mu mt" style={{ fontSize: '0.78rem' }}>
        🔒 Privacy & Security: The AI Study Assistant only receives data belonging to your authenticated account. Server-side API keys are protected and never exposed to the browser.
      </p>
    </div>
  );
}
