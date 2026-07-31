'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api_client';
import { Search, BookOpen, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SmartSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // Feature 10: Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const suggestedSearches = [
    "What is the late submission policy?",
    "How to connect to campus wifi?",
    "When is the add/drop deadline?"
  ];

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  const saveRecentSearch = (q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };
  
  const handleSearch = async (e?: React.FormEvent, explicitQuery?: string) => {
    if (e) e.preventDefault();
    const searchQuery = explicitQuery || query;
    if (!searchQuery.trim()) return;
    
    setQuery(searchQuery);
    saveRecentSearch(searchQuery);
    
    setLoading(true);
    setResults(null);
    try {
      const newSession = await fetchApi('/chat/sessions', { method: 'POST' });
      const aiResponse = await fetchApi(`/chat/sessions/${newSession.id}/message`, {
        method: 'POST',
        body: JSON.stringify({ content: searchQuery })
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

        <form onSubmit={handleSearch} className="mb-8 relative">
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

        {/* Feature 10: Recent and Suggested Searches (Shown when no results and not loading) */}
        {!results && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/80 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Searches
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((s, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleSearch(undefined, s)}
                      className="w-full text-left px-4 py-2 rounded-xl hover:bg-white text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-3 text-sm group"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Searches */}
            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/80 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Suggested Topics
              </h3>
              <div className="space-y-2">
                {suggestedSearches.map((s, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSearch(undefined, s)}
                    className="w-full text-left px-4 py-2 rounded-xl hover:bg-white text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-3 text-sm group border border-transparent hover:border-blue-100"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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
