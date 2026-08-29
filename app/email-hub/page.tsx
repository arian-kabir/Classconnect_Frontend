// app/email-hub/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import EmailTemplateEngine from '@/components/EmailHub/EmailTemplateEngine';

export default function EmailHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'unauthenticated') {
    router.push('/auth/login');
  }

  const user = session?.user as any;
  const userName = user?.name || 'Arian Kabir';
  const userRole = user?.role === 'teacher' ? 'Lead Instructor' : (user?.role === 'admin' ? 'System Administrator' : (user?.role === 'student_tutor' ? 'Student Tutor' : 'University Student'));

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-[#191c1d] font-sans selection:bg-[#002626] selection:text-white">
      {/* Left Sidebar: Course Navigator & Workspace Tools */}
      <aside className="w-64 bg-[#f3f4f5] border-r border-[#e5e7eb] flex flex-col flex-shrink-0 min-h-screen">
        {/* Sidebar Header — Brand Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#e5e7eb]">
          <span className="text-2xl">🎓</span>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-base text-[#002626] tracking-tight">ClassConnect</span>
            <span className="text-[10px] font-semibold text-[#51625b] tracking-wider uppercase">Email Studio</span>
          </div>
        </div>

        <div className="flex-1 py-6 flex flex-col gap-6 overflow-y-auto">
          {/* Section 1: My Courses */}
          <div>
            <h3 className="px-6 text-[11px] font-bold uppercase tracking-wider text-[#707978] mb-3">
              My Courses
            </h3>
            <nav className="flex flex-col gap-1 px-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="w-5 flex justify-center text-xs font-mono font-bold text-[#707978] group-hover:text-[#002626]">&lt;&gt;</span>
                <span>CS101: Programming</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <svg className="w-4 h-4 text-[#707978] group-hover:text-[#002626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span>CSE471: Architecture</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="w-5 flex justify-center text-sm font-serif font-bold text-[#707978] group-hover:text-[#002626]">Σ</span>
                <span>MAT202: Calculus</span>
              </Link>
            </nav>
          </div>

          {/* Section 2: Modules & Tools */}
          <div>
            <h3 className="px-6 text-[11px] font-bold uppercase tracking-wider text-[#707978] mb-3">
              Modules & Tools
            </h3>
            <nav className="flex flex-col gap-1 px-3">
              <Link
                href="/email-hub"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-[#002626] bg-[#e2ede6] transition-all"
              >
                <span className="text-base">✉️</span>
                <span>Email Engine (M3)</span>
              </Link>

              <Link
                href="/scheduler"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">⏱️</span>
                <span>Study Scheduler (M3)</span>
              </Link>

              <Link
                href="/notes"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">📖</span>
                <span>Notes & Canvas</span>
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">💬</span>
                <span>Section Group Chats</span>
              </Link>
            </nav>
          </div>

          {/* Section 3: Administration & Library */}
          <div>
            <h3 className="px-6 text-[11px] font-bold uppercase tracking-wider text-[#707978] mb-3">
              Administration & Library
            </h3>
            <nav className="flex flex-col gap-1 px-3">
              <Link
                href="/admin/allocations"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">📋</span>
                <span>Staffing Ledger</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">📊</span>
                <span>Routine Intake</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">📚</span>
                <span>Digital Library</span>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header: Simplified Navigation */}
        <header className="h-16 px-8 bg-white border-b border-[#e5e7eb] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <h1 className="font-bold text-base md:text-lg text-[#191c1d] tracking-tight">
              ClassConnect: Academic Email Studio
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Core Essential Navigation Links */}
            <nav className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="relative py-5 text-sm font-semibold text-[#707978] hover:text-[#002626] transition-colors"
              >
                Routine
              </Link>
              <Link
                href="/notes"
                className="relative py-5 text-sm font-semibold text-[#707978] hover:text-[#002626] transition-colors"
              >
                Notes
              </Link>
              <Link
                href="/dashboard"
                className="relative py-5 text-sm font-semibold text-[#707978] hover:text-[#002626] transition-colors"
              >
                Chat
              </Link>
            </nav>

            <div className="flex items-center gap-4 pl-4 border-l border-[#e5e7eb]">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#191c1d] leading-none">{userName}</p>
                <p className="text-xs text-[#707978] mt-1">{userRole}</p>
              </div>
              {user?.image ? (
                <img src={user.image} alt={userName} className="w-9 h-9 rounded-full border border-[#c0c8c7] object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#dbe5df] border border-[#c0c8c7] flex items-center justify-center text-sm font-bold text-[#002626]">
                  {userName.charAt(0)}
                </div>
              )}

              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#dc2626] bg-[#fee2e2] hover:bg-[#fecaca] transition-colors"
                title="Sign out of ClassConnect"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          <EmailTemplateEngine />
        </main>
      </div>
    </div>
  );
}
