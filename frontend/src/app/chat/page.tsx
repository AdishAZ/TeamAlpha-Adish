'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth_store';
import { fetchApi } from '@/lib/api_client';
import Link from 'next/link';
import { Info, HelpCircle, ThumbsUp, ThumbsDown, BookOpen, AlertCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'STUDENT' | 'AI' | 'ADMIN';
  content: string;
  timestamp: string;
  citations_json?: string;
  confidence?: string;
  is_knowledge_gap?: boolean;
}

interface ChatSession {
  id: string;
  is_escalated: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [showEscalateInput, setShowEscalateInput] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    initSession();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initSession = async () => {
    try {
      const newSession = await fetchApi('/chat/sessions', { method: 'POST' });
      setSession(newSession);
      setMessages([{
        id: 'welcome',
        sender: 'AI',
        content: 'Hi! I am CampusPilot. How can I help you today?',
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error("Failed to init session", err);
    }
  };

  const sendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const text = textOverride || input;
    if (!text.trim() || !session || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'STUDENT',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textOverride) setInput('');
    setLoading(true);

    try {
      const aiResponse = await fetchApi(`/chat/sessions/${session.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ content: text })
      });
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'AI',
        content: 'Sorry, I encountered an error connecting to the server.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const escalateToHuman = async () => {
    if (!session || session.is_escalated) return;
    try {
      setLoading(true);
      const updatedSession = await fetchApi(`/chat/sessions/${session.id}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ reason: escalationReason || 'Student requested human support.' })
      });
      setSession(updatedSession);
      setShowEscalateInput(false);
      const updatedMessages = await fetchApi(`/chat/sessions/${session.id}/messages`);
      setMessages(updatedMessages);
    } catch (err) {
      console.error('Failed to escalate', err);
      alert('Failed to escalate to human support.');
    } finally {
      setLoading(false);
    }
  };

  const explainAnswer = async (messageId: string) => {
    try {
      setExplanations(prev => ({...prev, [messageId]: 'Loading explanation...'}));
      const res = await fetchApi(`/chat/messages/explain`, {
        method: 'POST',
        body: JSON.stringify({ message_id: messageId })
      });
      setExplanations(prev => ({...prev, [messageId]: res.explanation}));
    } catch(err) {
      setExplanations(prev => ({...prev, [messageId]: 'Failed to load explanation.'}));
    }
  };

  const submitFeedback = async (messageId: string, rating: 'HELPFUL' | 'NOT_HELPFUL') => {
    try {
      await fetchApi(`/chat/messages/${messageId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating })
      });
      alert('Thanks for your feedback!');
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-transparent relative font-sans">
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <nav className="glass-header px-6 py-4 flex justify-between items-center z-20">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">CampusPilot <span className="text-blue-600">Chat</span></h1>
        <div className="flex space-x-6 items-center">
          <Link href="/student/tickets" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">My Tickets</Link>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Sign Out</button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full z-10 scroll-smooth">
        <div className="space-y-6 pb-4">
          {messages.map((msg) => {
            let meta: any = { citations: [], related_questions: [] };
            if (msg.citations_json) {
              try { meta = JSON.parse(msg.citations_json); } catch(e){}
            }
            
            const isGap = msg.is_knowledge_gap;

            return (
              <div key={msg.id} className={`flex flex-col gap-2 ${msg.sender === 'STUDENT' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                {isGap && (
                  <div className="w-full max-w-[85%] bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-2 flex items-start gap-3 text-yellow-800 shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm mb-1">Knowledge Gap Detected</p>
                      <p className="text-sm opacity-90 mb-3">I'm sorry, I couldn't find this information in the uploaded university documents.</p>
                      <button onClick={() => setShowEscalateInput(true)} className="bg-yellow-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors shadow-sm">
                        Create Support Request
                      </button>
                    </div>
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-6 py-4 shadow-sm relative group ${
                  msg.sender === 'STUDENT' 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-blue-500/20'
                    : msg.sender === 'ADMIN'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/50 rounded-bl-sm'
                    : 'bg-white/80 backdrop-blur-md text-slate-800 border border-white/60 rounded-bl-sm shadow-xl'
                }`}>
                  {msg.sender === 'ADMIN' && <div className="text-xs font-bold mb-1.5 text-emerald-700 uppercase tracking-wider">Human Support</div>}
                  {msg.sender === 'AI' && (
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">CampusPilot AI</div>
                      {msg.confidence && (
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          parseInt(msg.confidence) > 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          parseInt(msg.confidence) > 50 ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {parseInt(msg.confidence) > 80 ? '🟢 High' : parseInt(msg.confidence) > 50 ? '🟡 Medium' : '🔴 Low'} {msg.confidence}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</div>

                  {msg.sender === 'AI' && meta.citations?.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100/50">
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-2">
                        <BookOpen className="w-3.5 h-3.5" />
                        Sources
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {meta.citations.map((c: any, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 bg-slate-50/80 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-600">
                            📄 <span className="font-medium">{c.filename}</span> 
                            {c.page && <span className="text-slate-400">Pg {c.page}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {msg.sender === 'AI' && msg.id !== 'welcome' && (
                    <div className="absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => submitFeedback(msg.id, 'HELPFUL')} className="p-1.5 bg-white rounded-full text-slate-400 hover:text-emerald-500 shadow-sm border border-slate-100"><ThumbsUp className="w-4 h-4"/></button>
                      <button onClick={() => submitFeedback(msg.id, 'NOT_HELPFUL')} className="p-1.5 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-sm border border-slate-100"><ThumbsDown className="w-4 h-4"/></button>
                    </div>
                  )}
                </div>

                {msg.sender === 'AI' && msg.id !== 'welcome' && !isGap && (
                  <button onClick={() => explainAnswer(msg.id)} className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline ml-2">
                    <Info className="w-3 h-3" /> Explain this answer
                  </button>
                )}

                {explanations[msg.id] && (
                  <div className="max-w-[75%] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap ml-6 shadow-sm">
                    {explanations[msg.id]}
                  </div>
                )}

                {meta.related_questions?.length > 0 && (
                  <div className="max-w-[75%] mt-2 ml-2">
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-2">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Students also ask
                    </div>
                    <div className="flex flex-col gap-1.5 items-start">
                      {meta.related_questions.map((rq: string, idx: number) => (
                        <button 
                          key={idx} 
                          onClick={() => sendMessage(undefined, rq)}
                          className="text-sm text-left bg-white/60 hover:bg-white/90 border border-slate-200 rounded-lg px-4 py-2 text-slate-600 transition-colors shadow-sm"
                        >
                          {rq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-white/80 backdrop-blur-md text-slate-500 shadow-xl border border-white/60 rounded-3xl rounded-bl-sm px-6 py-4">
                <span className="flex space-x-1">
                  <span className="animate-bounce delay-75">•</span>
                  <span className="animate-bounce delay-150">•</span>
                  <span className="animate-bounce delay-300">•</span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      <div className="bg-white/60 backdrop-blur-xl border-t border-white/40 p-4 sm:p-6 z-20">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {messages.length > 2 && !session?.is_escalated && (
            <div className="flex flex-col gap-2 items-center w-full animate-in fade-in duration-500">
              {!showEscalateInput ? (
                <button 
                  onClick={() => setShowEscalateInput(true)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-1.5 px-4 rounded-full transition-all border border-slate-200 shadow-sm"
                >
                  Not helpful? Talk to a human support agent
                </button>
              ) : (
                <div className="flex gap-2 w-full max-w-lg">
                  <input
                    type="text"
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="Briefly describe what you need help with..."
                    className="flex-1 text-sm px-4 py-2 rounded-full border border-red-200 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-white/90"
                    autoFocus
                  />
                  <button
                    onClick={escalateToHuman}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-full transition-all shadow-md font-semibold"
                  >
                    Escalate
                  </button>
                  <button
                    onClick={() => setShowEscalateInput(false)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 py-2 px-4 rounded-full transition-all border border-slate-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          <form onSubmit={(e) => sendMessage(e)} className="flex gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about the university..."
              className="flex-1 px-6 py-4 rounded-full border border-slate-200/60 bg-white/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800 placeholder:text-slate-400"
              disabled={loading || session?.is_escalated}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || session?.is_escalated}
              className="bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 font-semibold shadow-md"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
