'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth_store';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="font-bold text-white text-xl tracking-tight">CampusPilot</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <Link
            href="/admin/board"
            className={`block px-4 py-2 rounded transition-colors relative ${
              pathname === '/admin/board' ? 'text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {pathname === '/admin/board' && (
              <motion.div 
                layoutId="sidebar-active"
                className="absolute inset-0 bg-blue-600 rounded z-0"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Inbox</span>
          </Link>
          
          <Link
            href="/admin/knowledge"
            className={`block px-4 py-2 rounded transition-colors relative ${
              pathname === '/admin/knowledge' ? 'text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {pathname === '/admin/knowledge' && (
              <motion.div 
                layoutId="sidebar-active"
                className="absolute inset-0 bg-blue-600 rounded z-0"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Knowledge Base</span>
          </Link>
          
          <Link
            href="/admin/analytics"
            className={`block px-4 py-2 rounded transition-colors relative ${
              pathname === '/admin/analytics' ? 'text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {pathname === '/admin/analytics' && (
              <motion.div 
                layoutId="sidebar-active"
                className="absolute inset-0 bg-blue-600 rounded z-0"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">Analytics</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 text-slate-400 text-sm">
          <p className="truncate mb-2">{user?.email}</p>
          <button 
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 transition-colors w-full text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative z-10">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-xl font-semibold text-slate-800 capitalize">
            {pathname.split('/').pop() || 'Dashboard'}
          </h2>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
