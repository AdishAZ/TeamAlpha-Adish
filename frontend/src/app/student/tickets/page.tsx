'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth_store';
import { fetchApi } from '@/lib/api_client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatSession {
  id: string;
  student_id: string;
  started_at: string;
  is_escalated: boolean;
  status: string;
  title: string | null;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'STUDENT' | 'AI' | 'ADMIN';
  content: string;
  timestamp: string;
}

export default function StudentTicketsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    loadSessions();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const allSessions: ChatSession[] = await fetchApi('/chat/sessions');
      const sorted = allSessions.sort((a, b) => 
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
      setSessions(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  const selectSession = async (session: ChatSession) => {
    setActiveSession(session);
    try {
      const sessionMessages = await fetchApi(`/chat/sessions/${session.id}/messages`);
      setMessages(sessionMessages);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      session_id: activeSession.id,
      sender: 'STUDENT',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const responseMsg = await fetchApi(`/chat/sessions/${activeSession.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ content: userMessage.content })
      });
      setMessages(prev => [...prev, responseMsg]);
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const escalateToHuman = async () => {
    if (!activeSession || activeSession.is_escalated) return;
    try {
      setLoading(true);
      const updatedSession = await fetchApi(`/chat/sessions/${activeSession.id}/escalate`, {
        method: 'POST'
      });
      setActiveSession(updatedSession);
      
      // Update session in list
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));

      // Fetch messages again to get the system message
      const updatedMessages = await fetchApi(`/chat/sessions/${activeSession.id}/messages`);
      setMessages(updatedMessages);
    } catch (err) {
      console.error('Failed to escalate', err);
      alert('Failed to escalate to human support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-transparent relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <nav className="glass-header px-6 py-4 flex justify-between items-center z-20">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">My Tickets</h1>
        <div className="flex space-x-6 items-center">
          <Link href="/student/dashboard" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Dashboard</Link>
          <Link href="/chat" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">New Chat</Link>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Sign Out</button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden z-10 max-w-7xl mx-auto w-full p-4 sm:p-6 gap-6">
        {/* Left Sidebar: Session List */}
        <div className="w-1/4 glass-panel rounded-3xl overflow-hidden flex flex-col shadow-xl">
          <div className="p-5 border-b border-white/40 bg-white/50 backdrop-blur-md">
            <h2 className="font-semibold text-slate-800">Past Conversations ({sessions.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {sessions.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No past conversations.</div>
            ) : (
              <AnimatePresence>
                {sessions.map((s, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: idx * 0.05 }}
                    key={s.id} 
                    onClick={() => selectSession(s)}
                    className={`p-4 cursor-pointer rounded-2xl transition-all duration-300 ${activeSession?.id === s.id ? 'bg-white shadow-md border border-white/60 translate-x-1' : 'hover:bg-white/60 border border-transparent'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm text-slate-900 truncate pr-2">
                        {s.title || (s.is_escalated ? 'Escalated Ticket' : 'AI Chat')}
                      </span>
                      <span className="text-xs font-medium text-slate-500 whitespace-nowrap">{new Date(s.started_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-slate-500 font-mono">ID: {s.id.substring(0,8)}...</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        s.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                        s.status === 'CLOSED' ? 'bg-slate-200 text-slate-600' :
                        s.is_escalated ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {s.status === 'RESOLVED' ? 'Resolved' : s.status === 'CLOSED' ? 'Closed' : s.is_escalated ? 'Escalated' : 'AI Handled'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Middle Pane: Chat Window */}
        <div className="w-1/2 flex flex-col glass-panel rounded-3xl overflow-hidden shadow-xl">
          {activeSession ? (
            <>
              <div className="p-5 border-b border-white/40 bg-white/50 backdrop-blur-md flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">{activeSession.title || 'Ticket Details'}</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                      className={`flex ${msg.sender === 'STUDENT' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-6 py-4 shadow-sm ${
                        msg.sender === 'STUDENT' 
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-blue-500/20'
                          : msg.sender === 'ADMIN'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/50 rounded-bl-sm'
                          : 'bg-white/80 backdrop-blur-md text-slate-800 border border-white/60 rounded-bl-sm shadow-xl'
                      }`}>
                        {msg.sender === 'ADMIN' && <div className="text-xs font-bold mb-1.5 text-emerald-700 uppercase tracking-wider">Human Support</div>}
                        {msg.sender === 'AI' && <div className="text-xs font-bold mb-1.5 text-slate-400 uppercase tracking-wider">CampusPilot AI</div>}
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/80 backdrop-blur-md text-slate-500 shadow-xl border border-white/60 rounded-3xl rounded-bl-sm px-6 py-4">
                      <span className="flex space-x-1">
                        <span className="animate-bounce delay-75">•</span>
                        <span className="animate-bounce delay-150">•</span>
                        <span className="animate-bounce delay-300">•</span>
                      </span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              <div className="bg-white/50 backdrop-blur-md border-t border-white/40 p-5">
                <div className="w-full flex flex-col gap-3">
                  {messages.length > 2 && !activeSession.is_escalated && (
                    <button 
                      onClick={escalateToHuman}
                      className="text-xs self-center bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 px-4 rounded-full transition-all shadow-sm border border-slate-200 font-medium"
                    >
                      Not helpful? Re-open and escalate to human
                    </button>
                  )}
                  <form onSubmit={sendMessage} className="flex gap-3 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        activeSession.status === 'RESOLVED' ? "This ticket has been resolved." :
                        activeSession.status === 'CLOSED' ? "This ticket is closed." :
                        activeSession.is_escalated ? "Wait for an agent to reply..." : "Ask a follow up question..."
                      }
                      className="flex-1 px-6 py-3.5 rounded-full border border-slate-200/60 bg-white/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 placeholder:text-slate-400 disabled:opacity-75 disabled:bg-slate-100"
                      disabled={loading || activeSession.status === 'RESOLVED' || activeSession.status === 'CLOSED' || activeSession.is_escalated}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading || activeSession.status === 'RESOLVED' || activeSession.status === 'CLOSED' || activeSession.is_escalated}
                      className="bg-blue-600 text-white px-8 py-3.5 rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 font-semibold shadow-md"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <p className="font-medium text-lg text-slate-500">Select a conversation to view details</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Timeline (Feature 5) */}
        <div className="w-1/4 glass-panel rounded-3xl overflow-hidden flex flex-col shadow-xl">
          <div className="p-5 border-b border-white/40 bg-white/50 backdrop-blur-md">
            <h2 className="font-semibold text-slate-800">Timeline</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeSession ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                className="relative border-l border-slate-200 ml-3 space-y-6"
              >
                
                {/* Event: Ticket Created */}
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                  <div className="text-xs font-semibold text-slate-800">Ticket Created</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{new Date(activeSession.started_at).toLocaleString()}</div>
                  <div className="text-xs text-slate-600 mt-1">Started conversation with CampusPilot AI.</div>
                </div>

                {/* Event: AI Resolution Attempt */}
                {messages.length > 1 && (
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                    <div className="text-xs font-semibold text-slate-800">AI Assistance</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Automated</div>
                    <div className="text-xs text-slate-600 mt-1">AI provided {Math.floor(messages.length / 2)} responses.</div>
                  </div>
                )}

                {/* Event: Escalation */}
                {activeSession.is_escalated && (
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-amber-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                    <div className="text-xs font-semibold text-slate-800">Escalated to Human</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Status: OPEN</div>
                    <div className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-100 p-2 rounded-md">Ticket transferred to {activeSession.status === 'RESOLVED' ? 'resolved queue' : 'support queue'}</div>
                  </div>
                )}

                {/* Event: Resolved */}
                {activeSession.status === 'RESOLVED' && (
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                    <div className="text-xs font-semibold text-slate-800">Ticket Resolved</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Status: RESOLVED</div>
                    <div className="text-xs text-emerald-700 mt-1 bg-emerald-50 border border-emerald-100 p-2 rounded-md">The ticket was marked as resolved by a support agent.</div>
                  </div>
                )}

                {/* Event: Closed */}
                {activeSession.status === 'CLOSED' && (
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-slate-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                    <div className="text-xs font-semibold text-slate-800">Ticket Closed</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Status: CLOSED</div>
                    <div className="text-xs text-slate-600 mt-1">Ticket was closed and archived.</div>
                  </div>
                )}

              </motion.div>
            ) : (
              <div className="text-center text-slate-400 text-sm mt-10">
                Select a ticket to view its lifecycle timeline.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
