'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import RoutineOrchestrator from '@/components/RoutineOrchestrator';
import StaffingLedger from '@/components/StaffingLedger';
import StudySchedulerHub from '@/components/StudyScheduler/StudySchedulerHub';
import DeadlineAlertCenter from '@/components/StudyScheduler/DeadlineAlertCenter';
import EmailTemplateEngine from '@/components/EmailHub/EmailTemplateEngine';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Routine' | 'Study Scheduler' | 'Email Hub' | 'Notes' | 'Chat'>('Routine');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#002626] border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-[#404848]">Loading Academic Portal...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as any;
  const userName = user?.name || 'Dr. Sarah Chen';
  const userRole = user?.role === 'teacher' ? 'Lead Instructor' : (user?.role === 'admin' ? 'System Administrator' : (user?.role === 'student_tutor' ? 'Student Tutor' : 'Lead Instructor'));

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-[#191c1d] font-sans selection:bg-[#002626] selection:text-white">
      {/* =========================================================
          LEFT SIDEBAR: COURSE NAVIGATOR & WORKSPACE TOOLS
          ========================================================= */}
      <aside className="w-64 bg-[#f3f4f5] border-r border-[#e5e7eb] flex flex-col flex-shrink-0 min-h-screen">
        {/* Sidebar Header — Brand Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#e5e7eb]">
          <span className="text-2xl">🎓</span>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-base text-[#002626] tracking-tight">ClassConnect</span>
            <span className="text-[10px] font-semibold text-[#51625b] tracking-wider uppercase">Academic Portal</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 py-6 flex flex-col gap-6 overflow-y-auto">
          {/* Section 1: My Courses */}
          <div>
            <h3 className="px-6 text-[11px] font-bold uppercase tracking-wider text-[#707978] mb-3">
              My Courses
            </h3>
            <nav className="flex flex-col gap-1 px-3">
              <Link
                href="#"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="w-5 flex justify-center text-xs font-mono font-bold text-[#707978] group-hover:text-[#002626]">&lt;&gt;</span>
                <span>CS101: Programming</span>
              </Link>

              <Link
                href="#"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <svg className="w-4 h-4 text-[#707978] group-hover:text-[#002626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span>CSE471: Architecture</span>
              </Link>

              <Link
                href="#"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="w-5 flex justify-center text-sm font-serif font-bold text-[#707978] group-hover:text-[#002626]">Σ</span>
                <span>MAT202: Calculus</span>
              </Link>
            </nav>
          </div>

          {/* Section 2: Academic Modules & Tools */}
          <div>
            <h3 className="px-6 text-[11px] font-bold uppercase tracking-wider text-[#707978] mb-3">
              Modules & Tools
            </h3>
            <nav className="flex flex-col gap-1 px-3">
              <Link
                href="/scheduler"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">⏱️</span>
                <span>Study Scheduler </span>
              </Link>
              <Link
                href="/email-hub"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#002626] bg-[#e2ede6] hover:bg-[#d0e4d8] transition-all group"
              >
                <span className="text-base">✉️</span>
                <span>Email Engine </span>
              </Link>

              

              <Link
                href="/notes"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">📖</span>
                <span>Notes & Canvas</span>
              </Link>

              <button
                onClick={() => setActiveTab('Chat')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group text-left"
              >
                <span className="text-base">💬</span>
                <span>Section Group Chats</span>
              </button>
            </nav>
          </div>

          {/* Section 3: Administrative & Management */}
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
                <span>Routine Intake (Admin)</span>
              </Link>

              <Link
                href="#"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">📚</span>
                <span>Digital Library</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Quick Sign Out */}
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

      {/* =========================================================
          MAIN PORTAL CONTENT AREA
          ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar: Simplified to Essential Core Tabs */}
        <header className="h-16 px-8 bg-white border-b border-[#e5e7eb] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-8">
            <h1 className="font-bold text-base md:text-lg text-[#191c1d] tracking-tight">
              ClassConnect: Academic Portal
            </h1>
          </div>

          {/* Essential Center Tabs & Profile */}
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('Routine')}
                className={`relative py-5 text-sm font-semibold transition-colors ${
                  activeTab === 'Routine' ? 'text-[#002626]' : 'text-[#707978] hover:text-[#191c1d]'
                }`}
              >
                Routine
                {activeTab === 'Routine' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#002626]" />
                )}
              </button>

              <Link
                href="/notes"
                className="relative py-5 text-sm font-semibold text-[#707978] hover:text-[#191c1d] transition-colors"
              >
                Notes
              </Link>

              <button
                onClick={() => setActiveTab('Chat')}
                className={`relative py-5 text-sm font-semibold transition-colors ${
                  activeTab === 'Chat' ? 'text-[#002626]' : 'text-[#707978] hover:text-[#191c1d]'
                }`}
              >
                Chat
                {activeTab === 'Chat' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#002626]" />
                )}
              </button>
            </nav>

            {/* Profile Info & Logout */}
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

              {/* Sign Out Button in Header */}
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

        {/* Page Main Content */}
        <main className="p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
          {/* =========================================================
              1. 5 ACTION / MODULE CARDS
              ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Card 1: Class Schedule */}
            <div
              onClick={() => setActiveTab('Routine')}
              className={`rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:shadow-md transition-all cursor-pointer group min-h-[170px] ${
                activeTab === 'Routine' ? 'bg-[#d0e4d8] ring-2 ring-[#002626]' : 'bg-[#e5ece8]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-[#191c1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-[#191c1d]">Class Schedule</span>
            </div>

            {/* Card 2: Email Hub (Module 3) */}
            <div
              onClick={() => setActiveTab('Email Hub')}
              className={`rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:shadow-md transition-all cursor-pointer group min-h-[170px] ${
                activeTab === 'Email Hub' ? 'bg-[#d0e4d8] ring-2 ring-[#002626]' : 'bg-[#e5ece8]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <span className="text-xl">✉️</span>
              </div>
              <span className="font-semibold text-xs text-[#191c1d]">Email Engine (M3)</span>
            </div>

            {/* Card 3: Study Scheduler (Module 3) */}
            <div
              onClick={() => setActiveTab('Study Scheduler')}
              className={`rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:shadow-md transition-all cursor-pointer group min-h-[170px] ${
                activeTab === 'Study Scheduler' ? 'bg-[#d0e4d8] ring-2 ring-[#002626]' : 'bg-[#e5ece8]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <span className="text-xl">⏱️</span>
              </div>
              <span className="font-semibold text-xs text-[#191c1d]">Study Scheduler</span>
            </div>

            {/* Card 4: Canvas / Notes */}
            <Link
              href="/notes"
              className="bg-[#e5ece8] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:shadow-md transition-all cursor-pointer group min-h-[170px]"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-[#191c1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-[#191c1d]">Notes & Canvas</span>
            </Link>

            {/* Card 5: Group Chats */}
            <div className="bg-[#e5ece8] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 hover:shadow-md transition-all cursor-pointer group min-h-[170px]">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-[#191c1d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="font-semibold text-xs text-[#191c1d]">Group Chats</span>
            </div>
          </div>

          {/* =========================================================
              2. DYNAMIC DEADLINE REMAINDER BOARD BANNER
              ========================================================= */}
          <DeadlineAlertCenter compact={true} />

          {/* =========================================================
              3. TAB VIEW 1: ROUTINE ORCHESTRATOR & TIMETABLE DISPLAY
              ========================================================= */}
          {activeTab === 'Routine' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#191c1d] tracking-tight">Academic Routine & Class Schedule</h2>
                  <p className="text-xs text-[#707978]">Weekly timetable synchronized from university intake</p>
                </div>
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#002626] bg-[#e2ede6] hover:bg-[#d0e4d8] transition-colors"
                >
                  <span>📊</span>
                  <span>Sync Spreadsheet Routine</span>
                </Link>
              </div>
              <RoutineOrchestrator />
            </div>
          )}

          {/* =========================================================
              4. TAB VIEW 2: EMAIL HUB (MODULE 3)
              ========================================================= */}
          {activeTab === 'Email Hub' && (
            <div className="flex flex-col gap-4">
              <EmailTemplateEngine />
            </div>
          )}

          {/* =========================================================
              5. TAB VIEW 3: STUDY SCHEDULER (MODULE 3)
              ========================================================= */}
          {activeTab === 'Study Scheduler' && (
            <div className="flex flex-col gap-4">
              <StudySchedulerHub />
            </div>
          )}

          {/* =========================================================
              6. STAFFING & ALLOCATION LEDGER (DYNAMIC COMPONENT)
              ========================================================= */}
          <StaffingLedger />
        </main>
      </div>
    </div>
  );
}

