'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth_store';
import { 
  Ticket, 
  Database, 
  BarChart, 
  LogOut, 
  UserCircle,
  Globe,
  Monitor
} from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuGroups = [
    {
      title: "Reception Center",
      items: [
        { name: "Tickets", path: "/admin/board", icon: Ticket }
      ]
    },
    {
      title: "AI Capabilities",
      items: [
        { name: "Knowledge Base", path: "/admin/knowledge", icon: Database }
      ]
    },
    {
      title: "System Admin",
      items: [
        { name: "Analytics", path: "/admin/analytics", icon: BarChart }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        {/* Logo Area */}
        <div className="h-14 flex items-center px-6 border-b border-slate-200 gap-3">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <h1 className="font-bold text-slate-800 tracking-wide text-sm">CampusPilot Admin</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {menuGroups.map((group, i) => (
            <div key={i}>
              <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                {group.title}
              </h2>
              <div className="space-y-1">
                {group.items.map((item, j) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={j}
                      href={item.path}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <UserCircle className="w-8 h-8 text-slate-300" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-700 truncate">{user?.email || 'admin@campuspilot.edu'}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{user?.role || 'ADMIN'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Monitor className="w-4 h-4" />
            <span>Dashboard</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Globe className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
