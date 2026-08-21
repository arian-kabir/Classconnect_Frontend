// app/scheduler/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StudySchedulerHub from '@/components/StudyScheduler/StudySchedulerHub';

export default function SchedulerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'unauthenticated') {
    router.push('/auth/login');
  }

  const user = session?.user as any;
  const userName = user?.name || 'John Doe';
  const userRole = user?.role === 'student' ? 'Student' : (user?.role === 'teacher' ? 'Faculty Member' : 'Academic Member');

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-[#191c1d] font-sans selection:bg-[#002626] selection:text-white">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#f3f4f5] border-r border-[#e5e7eb] flex flex-col flex-shrink-0 min-h-screen">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#e5e7eb]">
          <svg className="w-5 h-5 text-[#191c1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <span className="font-bold text-base text-[#191c1d] tracking-tight">Academic Nexus</span>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-6">
          <div>
            <h3 className="px-6 text-[11px] font-bold uppercase tracking-wider text-[#707978] mb-3">
              Navigation
            </h3>
            <nav className="flex flex-col gap-1 px-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all"
              >
                <span>🏠</span>
                <span>Portal Dashboard</span>
              </Link>

              <Link
                href="/scheduler"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-[#002626] bg-[#e2ede6] transition-all"
              >
                <span>⏱️</span>
                <span>Study Scheduler (M3)</span>
              </Link>

              <Link
                href="/notes"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all"
              >
                <span>📖</span>
                <span>Notes & Canvas</span>
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="px-6 text-[11px] font-bold uppercase tracking-wider text-[#707978] mb-3">
              Admin & Planning
            </h3>
            <nav className="flex flex-col gap-1 px-3">
              <Link
                href="/admin/allocations"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all"
              >
                <span>📋</span>
                <span>Staffing Ledger</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all"
              >
                <span>📊</span>
                <span>Routine Intake</span>
              </Link>
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-[#e5e7eb]">
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#dc2626] bg-[#fee2e2] hover:bg-[#fecaca] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-8 bg-white border-b border-[#e5e7eb] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-bold text-[#51625b] hover:text-[#002626] flex items-center gap-1"
            >
              <span>← Back to Dashboard</span>
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="font-bold text-base text-[#191c1d] tracking-tight">
              Contextual Student Routine Builder & Study Scheduler
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#191c1d] leading-none">{userName}</p>
              <p className="text-xs text-[#707978] mt-1">{userRole}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#dbe5df] border border-[#c0c8c7] flex items-center justify-center text-sm font-bold text-[#002626]">
              {userName.charAt(0)}
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          <StudySchedulerHub />
        </main>
      </div>
    </div>
  );
}
