'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth_store';
import { fetchApi } from '@/lib/api_client';
import { MessageSquare, AlertCircle, CheckCircle2, FileText, ArrowUpRight, Clock, Zap, HelpCircle, BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react';

interface AnalyticsData {
  total_conversations: number;
  ai_answered: number;
  escalated_tickets: number;
  resolution_rate: number;
  knowledge_gap_rate: number;
  average_confidence: number;
  average_response_time: string;
  requests_by_status: Record<string, number>;
  requests_by_priority: Record<string, number>;
  most_asked_categories: Record<string, number>;
  knowledge_base_documents: number;
  helpful_vs_not_helpful: Record<string, number>;
  total_chunks: number;
  generated_faqs: number;
  average_chunks_per_pdf: number;
  most_referenced_documents: Record<string, number>;
  most_active_departments: Record<string, number>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const result = await fetchApi('/analytics');
      setData(result);
    } catch (err) {
      console.error(err);
    }
  };

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metrics = [
    { title: "Total Convs", value: data.total_conversations, icon: MessageSquare, color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "AI Resolution", value: `${data.resolution_rate}%`, icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { title: "Avg Confidence", value: `${data.average_confidence}%`, icon: Zap, color: "text-amber-600", bgColor: "bg-amber-50" },
    { title: "Knowledge Gap", value: `${data.knowledge_gap_rate}%`, icon: HelpCircle, color: "text-red-600", bgColor: "bg-red-50" },
    { title: "Escalated", value: data.escalated_tickets, icon: AlertCircle, color: "text-purple-600", bgColor: "bg-purple-50" },
    { title: "Response Time", value: data.average_response_time, icon: Clock, color: "text-cyan-600", bgColor: "bg-cyan-50" },
  ];

  return (
    <div className="p-6 h-full bg-slate-50 text-slate-800 overflow-y-auto font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Analytics Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Monitor AI performance, knowledge gaps, and ticket routing.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAnalytics} className="bg-white border border-slate-200 text-sm rounded-md px-4 py-1.5 focus:outline-none hover:bg-slate-50 text-slate-600 shadow-sm font-medium transition-colors">
              Refresh Data
            </button>
          </div>
        </div>

        {/* Top KPI Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                <div className="flex justify-between items-start z-10">
                  <div className={`p-2 rounded-lg ${metric.bgColor} text-slate-600`}>
                    <Icon className={`w-4 h-4 ${metric.color}`} />
                  </div>
                </div>
                <div className="z-10 mt-auto">
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-1">{metric.title}</p>
                </div>
                <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full ${metric.bgColor} opacity-30`} />
              </div>
            );
          })}
        </div>

        {/* Detailed Stats Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Categories */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
              Top Categories
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">AI Detected</span>
            </h3>
            <div className="space-y-3">
              {Object.keys(data.most_asked_categories || {}).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No categories detected yet.</p>
              ) : (
                Object.entries(data.most_asked_categories || {}).map(([cat, count], i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">{cat}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">{count as number}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Ticket Status & Priority */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Ticket Status</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                {Object.entries(data.requests_by_status || {}).map(([status, count]) => (
                  <div key={status} className="flex-1 bg-slate-50 rounded-lg p-3 border border-slate-100 text-center">
                    <div className="text-xl font-bold text-slate-700">{count as number}</div>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1">{status}</div>
                  </div>
                ))}
                {Object.keys(data.requests_by_status || {}).length === 0 && (
                  <div className="flex-1 text-center py-4 text-sm text-slate-400">No ticket status data.</div>
                )}
              </div>
              
              <h3 className="text-sm font-bold text-slate-800 mb-2 mt-6">Ticket Priorities</h3>
              <div className="space-y-2">
                {Object.entries(data.requests_by_priority || {}).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between text-sm">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{priority}</span>
                    <span className="font-semibold text-slate-700">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Student Feedback</h3>
            <div className="flex gap-4">
              <div className="flex-1 bg-emerald-50 rounded-lg p-4 border border-emerald-100 text-center">
                <div className="text-2xl font-bold text-emerald-700">{data.helpful_vs_not_helpful?.['HELPFUL'] || 0}</div>
                <div className="text-xs font-semibold text-emerald-600 uppercase mt-1">Helpful 👍</div>
              </div>
              <div className="flex-1 bg-red-50 rounded-lg p-4 border border-red-100 text-center">
                <div className="text-2xl font-bold text-red-700">{data.helpful_vs_not_helpful?.['NOT_HELPFUL'] || 0}</div>
                <div className="text-xs font-semibold text-red-600 uppercase mt-1">Not Helpful 👎</div>
              </div>
            </div>
          </div>

        </div>

        {/* Feature 3, 6, 7 Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Knowledge Base Health (Feature 3) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Knowledge Base Health
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-slate-700">{data.knowledge_base_documents}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Total PDFs</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-slate-700">{data.total_chunks}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Total Chunks</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-slate-700">{data.generated_faqs}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Generated FAQs</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-slate-700">{data.average_chunks_per_pdf}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Avg Chunks/PDF</div>
              </div>
            </div>
            <div className="mt-auto text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
              System is healthy and indexed.
            </div>
          </div>

          {/* Most Referenced Documents (Feature 6) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Most Referenced Documents
            </h3>
            <div className="space-y-3">
              {Object.keys(data.most_referenced_documents || {}).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No citations yet.</p>
              ) : (
                Object.entries(data.most_referenced_documents || {}).map(([doc, count], i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium truncate pr-4 text-xs">{doc}</span>
                    <span className="bg-indigo-50 px-2 py-0.5 rounded text-indigo-700 font-semibold text-xs">{count as number}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Most Active Departments (Feature 7) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Most Active Departments
            </h3>
            <div className="space-y-3">
              {Object.keys(data.most_active_departments || {}).length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No department data yet.</p>
              ) : (
                Object.entries(data.most_active_departments || {}).sort((a,b) => (b[1] as number) - (a[1] as number)).map(([dept, count], i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">{dept}</span>
                    <span className="bg-rose-50 px-2 py-0.5 rounded text-rose-700 font-semibold text-xs">{count as number}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
