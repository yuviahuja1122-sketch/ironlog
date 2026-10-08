import React from 'react';
import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      <TopBar />
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        <BottomNav />
        <main className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto pb-24 md:pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
