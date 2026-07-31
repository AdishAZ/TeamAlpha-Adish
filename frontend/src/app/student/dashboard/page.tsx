'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth_store';
import { fetchApi } from '@/lib/api_client';
import Link from 'next/link';
import { MessageSquare, LifeBuoy, CheckCircle, AlertCircle, ThumbsUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface StudentAnalytics {
  total_conversations: number;
  support_requests: number;
  resolved_requests: number;
  knowledge_gap_requests: number;
  helpful_feedback_given: number;
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<StudentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const response = await fetchApi('/analytics/student');
      setData(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <nav className="glass-header px-6 py-4 flex justify-between items-center z-20 bg-white/70 backdrop-blur-md border-b border-white/50">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          My Activity
        </h1>
        <div className="flex space-x-6 items-center">
          <Link href="/chat" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">New Chat</Link>
          <Link href="/student/tickets" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">My Tickets</Link>
          <button onClick={() => { logout(); router.push('/login'); }} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Sign Out</button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 z-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome back, {user?.email?.split('@')[0] || 'Student'}!</h2>
            <p className="text-slate-500 mb-8">Here is a summary of your interactions with CampusPilot AI.</p>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : data ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
              >
                
                {/* Metric 1 */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Total AI Chats</p>
                      <h3 className="text-4xl font-black text-indigo-900">{data.total_conversations}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                </motion.div>

                {/* Metric 2 */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Human Support</p>
                      <h3 className="text-4xl font-black text-amber-900">{data.support_requests}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                      <LifeBuoy className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                </motion.div>

                {/* Metric 3 */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Resolved Tickets</p>
                      <h3 className="text-4xl font-black text-emerald-900">{data.resolved_requests}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-500"></div>
                </motion.div>

                {/* Metric 4 */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Questions Missed by AI</p>
                      <h3 className="text-4xl font-black text-rose-900">{data.knowledge_gap_requests}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-[10px] text-rose-600/70 mt-3 font-medium">Questions where AI lacked knowledge</p>
                </motion.div>

                {/* Metric 5 */}
                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100 shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider mb-1">Helpful Feedback</p>
                      <h3 className="text-4xl font-black text-cyan-900">{data.helpful_feedback_given}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-cyan-500 group-hover:scale-110 transition-transform">
                      <ThumbsUp className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-[10px] text-cyan-600/70 mt-3 font-medium">Times you rated AI as helpful</p>
                </motion.div>

              </motion.div>
            ) : (
              <div className="text-center text-slate-500 py-12">Failed to load analytics data.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
