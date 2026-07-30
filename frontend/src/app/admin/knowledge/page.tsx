'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api_client';
import { useAuthStore } from '@/lib/auth_store';
import { useRouter } from 'next/navigation';
import { Search, Filter, Plus, FileText, Settings2, MoreHorizontal, UploadCloud } from 'lucide-react';

interface KnowledgeDoc {
  id: string;
  filename: string;
  uploaded_at: string;
  uploaded_by: string;
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadDocs();
  }, [user]);

  const loadDocs = async () => {
    try {
      const data = await fetchApi('/knowledge/');
      setDocs(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/knowledge/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Upload failed');
      }

      await loadDocs();
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 p-6">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        
        {/* Header / Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Knowledge Base" 
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700"
              />
            </div>
            <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Status</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
            </button>
            <div className="relative">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="px-4 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 cursor-pointer shadow-sm transition-colors">
                <Plus className="w-4 h-4" />
                <span>Upload PDF</span>
              </label>
            </div>
          </div>
        </div>

        {/* Upload Pending Area */}
        {file && (
          <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-blue-800">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-medium">{file.name}</span>
              <span className="text-blue-500 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFile(null)}
                className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpload}
                disabled={loading}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading ? 'Uploading...' : 'Confirm Upload'}
                {!loading && <UploadCloud className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-sm text-red-600 flex items-center gap-2">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Data Table */}
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium text-slate-500 w-12">#</th>
                <th className="px-6 py-3 font-medium text-slate-500">Document Name</th>
                <th className="px-6 py-3 font-medium text-slate-500 w-32">Status</th>
                <th className="px-6 py-3 font-medium text-slate-500 w-48">Updated At</th>
                <th className="px-6 py-3 font-medium text-slate-500 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 bg-slate-50/30">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <FileText className="w-10 h-10 text-slate-200" />
                      <p>No documents found in Knowledge Base.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                docs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-3 text-slate-400">{idx + 1}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-700">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Indexed
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {new Date(doc.uploaded_at).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center text-sm text-slate-500">
          <div>
            Showing {docs.length} of {docs.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border border-slate-200 rounded bg-slate-50 opacity-50 cursor-not-allowed">Prev</button>
            <button className="px-3 py-1 border border-slate-200 rounded bg-slate-50 opacity-50 cursor-not-allowed">Next</button>
          </div>
        </div>

      </div>
    </div>
  );
}
