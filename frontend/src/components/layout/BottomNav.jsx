import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Dumbbell, 
  Calendar, 
  Layers, 
  Utensils, 
  Scale, 
  Bot, 
  User 
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/workout', label: 'Log', icon: Dumbbell },
  { path: '/plan', label: 'Split', icon: Calendar },
  { path: '/coverage', label: 'Volume', icon: Layers },
  { path: '/nutrition', label: 'Diet', icon: Utensils },
  { path: '/body', label: 'Body', icon: Scale },
  { path: '/coach', label: 'AI Coach', icon: Bot, highlight: true },
];

export default function BottomNav() {
  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1.5 flex justify-around items-center">
        {navItems.map(({ path, label, icon: Icon, highlight }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200
              ${isActive 
                ? (highlight ? 'text-blue-400 bg-blue-500/10' : 'text-emerald-400 bg-emerald-500/10') 
                : 'text-zinc-400 hover:text-zinc-200'
              }
            `}
          >
            <Icon size={20} className={highlight ? 'text-blue-400' : ''} />
            <span className="text-[10px] font-medium mt-0.5 tracking-tight">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-950/80 backdrop-blur-md p-4 min-h-[calc(100vh-61px)]">
        <div className="space-y-1.5 flex-1">
          {navItems.map(({ path, label, icon: Icon, highlight }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                ${isActive 
                  ? (highlight ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10') 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
                }
              `}
            >
              <Icon size={19} className={highlight ? 'text-blue-400' : ''} />
              <span>{label}</span>
              {highlight && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 font-bold rounded-full border border-blue-500/30">
                  AI
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="p-3 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            AI Engine Online
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Smart Soreness & Progressive Overload Active</p>
        </div>
      </aside>
    </>
  );
}
