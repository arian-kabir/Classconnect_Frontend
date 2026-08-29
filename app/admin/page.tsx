"use client";

/**
 * app/admin/page.tsx  — System Administrator Portal
 * ─────────────────────────────────────────────────────────────────────────────
 * Accessible only to admin-role users (enforced by session check + redirect).
 * Houses the Spreadsheet Routine Intake panel and other admin tools.
 * Redesigned to match the Academic Nexus global design system.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import SpreadsheetIntakePanel from "@/components/SpreadsheetIntakePanel";
import StaffingLedger from "@/components/StaffingLedger";

type AdminTab = "intake" | "staffing" | "overview";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("intake");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8f9fa]">
        <div className="w-9 h-9 rounded-full border-[3px] border-[#002626] border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-[#51625b]">Loading Admin Portal…</p>
      </div>
    );
  }

  const user = session?.user as any;
  const userName = user?.name || "Administrator";
  const userEmail = user?.email || "";

  const pageTitle =
    activeTab === "staffing"
      ? "Cross-Role Section Staffing & Allocation Ledger"
      : activeTab === "intake"
      ? "Spreadsheet Routine Intake"
      : "System Overview";

  const pageBreadcrumb =
    activeTab === "staffing"
      ? "Staffing Ledger"
      : activeTab === "intake"
      ? "Routine Intake"
      : "Overview";

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] text-[#191c1d] font-sans selection:bg-[#002626] selection:text-white">

      {/* =========================================================
          LEFT SIDEBAR: COURSE NAVIGATOR & WORKSPACE TOOLS
          ========================================================= */}
      <aside className="w-64 bg-[#f3f4f5] border-r border-[#e5e7eb] flex flex-col flex-shrink-0 min-h-screen sticky top-0 h-screen">

        {/* Sidebar Header — Brand Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#e5e7eb]">
          <span className="text-2xl">🎓</span>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-base text-[#002626] tracking-tight">ClassConnect</span>
            <span className="text-[10px] font-semibold text-[#51625b] tracking-wider uppercase">Admin Portal</span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 py-6 flex flex-col gap-6 overflow-y-auto">

          {/* Section 1: Admin Tools */}
          <div>
            <h3 className="px-6 text-[11px] font-bold uppercase tracking-wider text-[#707978] mb-3">
              Admin Tools
            </h3>
            <nav className="flex flex-col gap-1 px-3">
              <button
                onClick={() => setActiveTab("intake")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                  activeTab === "intake"
                    ? "text-[#002626] bg-[#e2ede6] font-bold"
                    : "text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea]"
                }`}
              >
                <span className="text-base">📊</span>
                <span>Routine Intake</span>
                {activeTab === "intake" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#002626]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("staffing")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                  activeTab === "staffing"
                    ? "text-[#002626] bg-[#e2ede6] font-bold"
                    : "text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea]"
                }`}
              >
                <span className="text-base">📋</span>
                <span>Staffing Ledger</span>
                {activeTab === "staffing" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#002626]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                  activeTab === "overview"
                    ? "text-[#002626] bg-[#e2ede6] font-bold"
                    : "text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea]"
                }`}
              >
                <span className="text-base">🗂️</span>
                <span>System Overview</span>
                {activeTab === "overview" && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#002626]" />
                )}
              </button>
            </nav>
          </div>

          {/* Section 2: Portal Navigation */}
          <div>
            <h3 className="px-6 text-[11px] font-bold uppercase tracking-wider text-[#707978] mb-3">
              Portal Navigation
            </h3>
            <nav className="flex flex-col gap-1 px-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">🏠</span>
                <span>Student Dashboard</span>
              </Link>

              <Link
                href="/scheduler"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">⏱️</span>
                <span>Study Scheduler</span>
              </Link>

              <Link
                href="/email-hub"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#404848] hover:text-[#002626] hover:bg-[#e7e9ea] transition-all group"
              >
                <span className="text-base">✉️</span>
                <span>Email Engine</span>
              </Link>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: User Info + Sign Out */}
        <div className="border-t border-[#e5e7eb]">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#dbe5df] border border-[#c0c8c7] flex items-center justify-center text-sm font-bold text-[#002626] flex-shrink-0">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#191c1d] truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-[#707978] truncate">System Administrator</p>
            </div>
          </div>
          <div className="px-4 pb-4">
            <button
              id="admin-logout-btn"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-[#dc2626] bg-[#fee2e2] hover:bg-[#fecaca] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT AREA
          ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navigation Bar */}
        <header className="h-16 px-8 bg-white border-b border-[#e5e7eb] flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-bold text-base text-[#191c1d] tracking-tight leading-none">
                {pageTitle}
              </h1>
              <p className="text-xs text-[#707978] mt-0.5">
                Admin Portal / {pageBreadcrumb}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Admin Tab Pills in header */}
            <nav className="flex items-center gap-1 bg-[#f3f4f5] rounded-xl p-1">
              {(["intake", "staffing", "overview"] as AdminTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab
                      ? "bg-white text-[#002626] shadow-sm border border-[#e5e7eb]"
                      : "text-[#707978] hover:text-[#191c1d]"
                  }`}
                >
                  {tab === "intake" ? "📊 Intake" : tab === "staffing" ? "📋 Staffing" : "🗂️ Overview"}
                </button>
              ))}
            </nav>

            {/* Profile + Logout */}
            <div className="flex items-center gap-3 pl-4 border-l border-[#e5e7eb]">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-[#191c1d] leading-none">{userName}</p>
                <p className="text-xs text-[#707978] mt-1">System Administrator</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#dbe5df] border border-[#c0c8c7] flex items-center justify-center text-sm font-bold text-[#002626]">
                {userName.charAt(0)}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#dc2626] bg-[#fee2e2] hover:bg-[#fecaca] transition-colors"
                title="Sign out"
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
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === "staffing" && <StaffingLedger />}
          {activeTab === "intake" && <SpreadsheetIntakePanel />}
          {activeTab === "overview" && <OverviewPlaceholder />}
        </main>
      </div>
    </div>
  );
}

// ── Placeholder for future overview tab ──────────────────────────────────────
function OverviewPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-[#707978]">
      <span className="text-5xl">🔧</span>
      <div className="text-center">
        <p className="text-base font-bold text-[#191c1d]">More Admin Tools Coming Soon</p>
        <p className="text-sm text-[#51625b] mt-1">System analytics and overview will be available here.</p>
      </div>
    </div>
  );
}
