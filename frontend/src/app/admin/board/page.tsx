'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth_store';
import { fetchApi } from '@/lib/api_client';
import { Send, Clock, User, AlertCircle, FileText, CheckCircle, Archive, LayoutDashboard } from 'lucide-react';

interface ChatSession {
  id: string;
  title?: string;
  student_id: string;
  started_at: string;
  is_escalated: boolean;
  ai_summary?: string;
  priority?: string;
  priority_explanation?: string;
  department?: string;
  category?: string;
  status: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'STUDENT' | 'AI' | 'ADMIN';
  content: string;
  timestamp: string;
}

export default function AdminBoardPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  
  // Feature 9: Saved Responses
  const [savedResponses, setSavedResponses] = useState<{id: string, title: string, content: string}[]>([]);
  
  const { user } = useAuthStore();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadSessions();
    loadSavedResponses();
  }, [user]);

  const loadSavedResponses = async () => {
    try {
      const data = await fetchApi('/admin/saved-responses');
      setSavedResponses(data);
    } catch (err) {
      console.error('Failed to load saved responses', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const allSessions: ChatSession[] = await fetchApi('/chat/sessions');
      const escalated = allSessions.filter(s => s.is_escalated).sort((a, b) => 
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
      setSessions(escalated);
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
    if (!input.trim() || !activeSession) return;

    try {
      const adminMsg = await fetchApi(`/chat/sessions/${activeSession.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ content: input })
      });
      setMessages(prev => [...prev, adminMsg]);
      setInput('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    }
  };

  const updateStatus = async (status: string) => {
    if (!activeSession) return;
    try {
      await fetchApi(`/chat/sessions/${activeSession.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setActiveSession({ ...activeSession, status });
      setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, status } : s));
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full text-slate-800">
      {/* Column 1: Ticket List */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-semibold text-slate-700 text-sm">Escalated Tickets</h2>
          <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{sessions.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No active tickets.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => selectSession(s)}
                  className={`p-4 cursor-pointer transition-colors ${activeSession?.id === s.id ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-slate-800 line-clamp-1 flex-1 pr-2">{s.title || `Student ${s.student_id.substring(0,6)}...`}</span>
                    <span className="text-xs text-slate-400 shrink-0 mt-0.5">{new Date(s.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                      s.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                      s.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {s.status}
                    </span>
                    {s.priority && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-wide ${
                        s.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        s.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        s.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {s.priority}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Chat Window */}
      <div className="flex-1 flex flex-col bg-slate-50/50 relative">
        {activeSession ? (
          <>
            <div className="h-12 border-b border-slate-200 bg-white flex justify-between items-center px-6 shrink-0">
              <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                {activeSession.title || 'Student Request'}
              </h3>
              <div className="flex gap-2">
                <button onClick={() => updateStatus('RESOLVED')} className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" /> Resolve
                </button>
                <button onClick={() => updateStatus('CLOSED')} className="text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200">
                  <Archive className="w-3.5 h-3.5" /> Close
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.sender === 'ADMIN' 
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : msg.sender === 'STUDENT'
                      ? 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 rounded-bl-sm'
                  }`}>
                    {msg.sender === 'AI' && <div className="text-[10px] font-bold mb-1 text-slate-400 uppercase tracking-wider">AI Assistant</div>}
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              {/* Feature 9: Saved Responses */}
              {savedResponses.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                  {savedResponses.map(resp => (
                    <button
                      key={resp.id}
                      onClick={() => setInput(resp.content)}
                      className="whitespace-nowrap px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 rounded-full text-xs font-semibold transition-colors"
                      title={resp.content}
                    >
                      {resp.title}
                    </button>
                  ))}
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your reply to the student..."
                  disabled={activeSession.status === 'CLOSED'}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm disabled:bg-slate-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || activeSession.status === 'CLOSED'}
                  className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <LayoutDashboard className="w-12 h-12 mb-3 text-slate-300" />
            <p className="font-medium text-sm">Select a ticket to view details</p>
          </div>
        )}
      </div>

      {/* Column 3: Ticket Info */}
      <div className="w-80 border-l border-slate-200 bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-700 text-sm">Ticket Intelligence</h2>
        </div>
        
        {activeSession ? (() => {
          let aiMeta: any = {};
          if (activeSession.ai_summary) {
            try { aiMeta = JSON.parse(activeSession.ai_summary); } catch(e){}
          }
          return (
            <div className="p-5 space-y-6 overflow-y-auto">
              
              {activeSession.department && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Suggested Routing</h4>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
                    {activeSession.department}
                  </div>
                </div>
              )}

              {activeSession.priority_explanation && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    Priority Reason
                  </h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                    {activeSession.priority_explanation}
                  </p>
                </div>
              )}

              <hr className="border-slate-100" />

              {/* AI Summary Details */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Structured Summary
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-1">Issue Overview</div>
                    <p className="text-sm text-slate-700 leading-relaxed">{aiMeta.summary || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-1">Student Intent</div>
                    <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/50 p-2 rounded border border-blue-100">{aiMeta.student_intent || 'N/A'}</p>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-1">Key Context Points</div>
                    <ul className="list-disc pl-4 text-xs text-slate-600 space-y-1">
                      {aiMeta.key_points?.map((kp: string, i: number) => <li key={i}>{kp}</li>) || <li>None</li>}
                    </ul>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-500 mb-1">Suggested Resolution</div>
                    <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-100">{aiMeta.suggested_resolution || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Timeline (Feature 5) */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Ticket Lifecycle
                </h4>
                <div className="relative border-l border-slate-200 ml-3 space-y-6">
                  
                  {/* Event: Ticket Created */}
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                    <div className="text-xs font-semibold text-slate-800">Ticket Created</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{new Date(activeSession.started_at).toLocaleString()}</div>
                    <div className="text-xs text-slate-600 mt-1">Student requested human support.</div>
                  </div>

                  {/* Event: Assigned */}
                  <div className="relative pl-6">
                    <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white"></div>
                    <div className="text-xs font-semibold text-slate-800">Agent Assigned</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Automated</div>
                    <div className="text-xs text-slate-600 mt-1">Routed to {activeSession.department || 'General'} Support.</div>
                  </div>

                  {/* Event: Resolved/Closed */}
                  {activeSession.status !== 'OPEN' && (
                    <div className="relative pl-6">
                      <div className={`absolute w-3 h-3 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white ${activeSession.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                      <div className="text-xs font-semibold text-slate-800">Ticket {activeSession.status === 'RESOLVED' ? 'Resolved' : 'Closed'}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Status: {activeSession.status}</div>
                      <div className={`text-xs mt-1 p-2 rounded-md border ${activeSession.status === 'RESOLVED' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                        {activeSession.status === 'RESOLVED' ? 'Agent marked ticket as resolved.' : 'Agent closed the ticket.'}
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          );
        })() : (
          <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-slate-400">
            Select a ticket to view intelligence
          </div>
        )}
      </div>
    </div>
  );
}
