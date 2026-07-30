'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api_client';
import { Search, BookOpen, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function SmartSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setResults(null);
    try {
      // Re-using the chat generation endpoint temporarily but treating it as a search query
      // For a true hackathon MVP without adding too many routes, we can just spawn a temp chat session,
      // but it's cleaner to just use the chat response logic.
      // Wait, there is no direct search endpoint. Let's create a mock structure or use standard fetch if we had one.
      // To implement this quickly, I will simulate it by calling the backend chat API on a transient session.
      const newSession = await fetchApi('/chat/sessions', { method: 'POST' });
      const aiResponse = await fetchApi(`/chat/sessions/${newSession.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ content: query })
      });
      
      let meta: any = { citations: [], related_questions: [] };
      if (aiResponse.citations_json) {
        try { meta = JSON.parse(aiResponse.citations_json); } catch(e){}
      }
      
      setResults({
        answer: aiResponse.content,
        citations: meta.citations,
        is_gap: aiResponse.is_knowledge_gap
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-transparent relative font-sans">
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      </div>

      <nav className="glass-header px-6 py-4 flex justify-between items-center z-20">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">CampusPilot <span className="text-blue-600">Search</span></h1>
        <div className="flex space-x-6 items-center">
          <Link href="/chat" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Back to Chat</Link>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 sm:p-10 max-w-4xl mx-auto w-full z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Smart Knowledge Search</h2>
          <p className="text-slate-500">Search across all university documents instantly.</p>
        </div>

        <form onSubmit={handleSearch} className="mb-10 relative">
          <Search className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for policies, handbook rules, FAQs..."
            className="w-full pl-14 pr-6 py-4 rounded-full border border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
          <button type="submit" disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {results && (
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/60 animate-in fade-in slide-in-from-bottom-4">
            {results.is_gap ? (
              <div className="bg-yellow-50 text-yellow-800 p-6 rounded-2xl flex items-start gap-4">
                <AlertCircle className="w-6 h-6 shrink-0 text-yellow-600" />
                <div>
                  <h3 className="font-bold text-lg mb-2">No results found in knowledge base</h3>
                  <p>We couldn't find any documents matching your query. Try asking the AI Chat assistant to escalate to human support.</p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">AI Summary</h3>
                <div className="prose prose-slate max-w-none mb-8">
                  {results.answer}
                </div>
                
                {results.citations?.length > 0 && (
                  <>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Referenced Documents
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {results.citations.map((c: any, i: number) => (
                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                            📄
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{c.filename}</p>
                            <p className="text-xs text-slate-500">Page {c.page}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
