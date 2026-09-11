'use client';

import { useAuth } from '@/context/AuthContext';

export default function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          Store Management
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase">
              {user.email.slice(0, 2)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-white">{user.firstName || user.email}</p>
              <p className="text-[10px] text-slate-400">{user.role}</p>
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Not authenticated</span>
        )}
      </div>
    </header>
  );
}
