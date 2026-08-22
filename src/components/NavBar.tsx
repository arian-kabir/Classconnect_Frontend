        // <header className="h-16 px-8 bg-white border-b border-[#e5e7eb] flex items-center justify-between sticky top-0 z-20">
        //   <div className="flex items-center gap-8">
        //     <h1 className="font-bold text-base md:text-lg text-[#191c1d] tracking-tight">
        //       ClassConnect: Academic Portal
        //     </h1>
        //   </div>

        //   {/* Center Tabs & Profile */}
        //   <div className="flex items-center gap-6">
        //     <nav className="flex items-center gap-5">
        //       <button
        //         onClick={() => setActiveTab('Routine')}
        //         className={`relative py-5 text-sm font-semibold transition-colors ${
        //           activeTab === 'Routine' ? 'text-[#191c1d]' : 'text-[#707978] hover:text-[#191c1d]'
        //         }`}
        //       >
        //         Routine
        //         {activeTab === 'Routine' && (
        //           <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#002626]" />
        //         )}
        //       </button>

        //       <button
        //         onClick={() => setActiveTab('Study Scheduler')}
        //         className={`relative py-5 text-sm font-semibold transition-colors ${
        //           activeTab === 'Study Scheduler' ? 'text-[#002626]' : 'text-[#707978] hover:text-[#191c1d]'
        //         }`}
        //       >
        //         <span>⏱️ Study Scheduler</span>
        //         {activeTab === 'Study Scheduler' && (
        //           <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#002626]" />
        //         )}
        //       </button>

        //       <Link
        //         href="/notes"
        //         onClick={() => setActiveTab('Notes')}
        //         className={`relative py-5 text-sm font-semibold transition-colors ${
        //           activeTab === 'Notes' ? 'text-[#191c1d]' : 'text-[#707978] hover:text-[#191c1d]'
        //         }`}
        //       >
        //         Notes
        //       </Link>

        //       <button
        //         onClick={() => setActiveTab('Chat')}
        //         className={`relative py-5 text-sm font-semibold transition-colors ${
        //           activeTab === 'Chat' ? 'text-[#191c1d]' : 'text-[#707978] hover:text-[#191c1d]'
        //         }`}
        //       >
        //         Chat
        //       </button>

        //       <Link
        //         href="/scheduler"
        //         className="text-xs font-bold text-[#002626] bg-[#e2ede6] hover:bg-[#d0e4d8] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
        //         title="Contextual Student Routine Builder & Study Scheduler"
        //       >
        //         <span>⏱️</span>
        //         <span>Study Matrix</span>
        //       </Link>

        //       <Link
        //         href="/admin/allocations"
        //         className="text-xs font-bold text-[#51625b] bg-[#ebeded] hover:bg-[#dbe0de] px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
        //         title="Cross-Role Section Staffing & Allocation Ledger"
        //       >
        //         <span>📋</span>
        //         <span>Staffing Ledger</span>
        //       </Link>
        //     </nav>

        //     {/* Profile Info & Logout */}
        //     <div className="flex items-center gap-4 pl-4 border-l border-[#e5e7eb]">
        //       <div className="text-right hidden sm:block">
        //         <p className="text-sm font-bold text-[#191c1d] leading-none">{userName}</p>
        //         <p className="text-xs text-[#707978] mt-1">{userRole}</p>
        //       </div>

        //       {user?.image ? (
        //         <img src={user.image} alt={userName} className="w-9 h-9 rounded-full border border-[#c0c8c7] object-cover" />
        //       ) : (
        //         <div className="w-9 h-9 rounded-full bg-[#dbe5df] border border-[#c0c8c7] flex items-center justify-center text-sm font-bold text-[#002626]">
        //           {userName.charAt(0)}
        //         </div>
        //       )}

        //       {/* Sign Out Button in Header */}
        //       <button
        //         onClick={() => signOut({ callbackUrl: '/auth/login' })}
        //         className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#dc2626] bg-[#fee2e2] hover:bg-[#fecaca] transition-colors"
        //         title="Sign out of ClassConnect"
        //       >
        //         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        //           <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        //         </svg>
        //         Logout
        //       </button>
        //     </div>
        //   </div>