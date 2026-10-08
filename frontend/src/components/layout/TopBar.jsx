import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, LogOut, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TopBar() {
  const { user, profile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
          <Dumbbell className="text-zinc-950 font-bold" size={20} strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-lg font-black tracking-tight text-zinc-100 group-hover:text-emerald-400 transition-colors">IRONLOG</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold ml-1.5 px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-emerald-500/20">AI</span>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <Link 
          to="/profile" 
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-full transition-all text-xs font-medium text-zinc-300"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
            {profile?.name ? profile.name[0].toUpperCase() : 'U'}
          </div>
          <span className="hidden sm:inline max-w-[100px] truncate">{profile?.name || user?.email?.split('@')[0]}</span>
        </Link>
        <button
          onClick={logout}
          title="Sign out"
          className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-red-500/10 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 text-zinc-400 flex items-center justify-center transition-all"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
