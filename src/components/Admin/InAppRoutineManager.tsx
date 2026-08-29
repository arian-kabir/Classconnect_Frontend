"use client";

/**
 * InAppRoutineManager.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin In-App Routine Manager & Bi-Directional Google Sheets Auto-Sync.
 *
 * Allows administrators to add, manage, and delete class routines directly
 * in the web application. New routines automatically update the database
 * (master schedule + student routines) AND append directly into the linked
 * master Google Sheet in real time.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MasterSchedule {
  schedule_id: number;
  section_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number: string;
  last_synced_at: string;
  course_id: number;
  course_code: string;
  course_name: string;
  section_code: string;
  semester: string;
  year: number;
  teacher_id: number | null;
  teacher_name: string | null;
  teacher_initials: string | null;
}

interface InAppRoutineManagerProps {
  spreadsheetUrl: string;
  onNavigateToPullTab?: () => void;
}

const PRESET_SLOTS = [
  { label: "08:00 - 09:20", start: "08:00", end: "09:20" },
  { label: "09:30 - 11:00", start: "09:30", end: "11:00" },
  { label: "11:10 - 12:30", start: "11:10", end: "12:30" },
  { label: "12:40 - 02:00", start: "12:40", end: "14:00" },
  { label: "02:10 - 03:30", start: "14:10", end: "15:30" },
  { label: "03:40 - 05:00", start: "15:40", end: "17:00" },
];

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function extractSheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input.trim();
}

export default function InAppRoutineManager({
  spreadsheetUrl,
  onNavigateToPullTab,
}: InAppRoutineManagerProps) {
  // ── Form State ────────────────────────────────────────────────────────────
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [sectionCode, setSectionCode] = useState("01");
  const [dayOfWeek, setDayOfWeek] = useState("Sunday");
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("11:00");
  const [roomNumber, setRoomNumber] = useState("");
  const [teacherInitials, setTeacherInitials] = useState("");
  const [syncToSheet, setSyncToSheet] = useState(true);

  // ── Action & Feedback State ───────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Schedules Ledger State ────────────────────────────────────────────────
  const [schedules, setSchedules] = useState<MasterSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDayFilter, setSelectedDayFilter] = useState("All");
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const spreadsheetId = extractSheetId(spreadsheetUrl);

  // ── Fetch Master Schedules ────────────────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoadingSchedules(true);
      const res = await fetch("/api/routines/in-app-sync");
      if (!res.ok) throw new Error("Failed to load master schedules");
      const data = await res.json();
      if (Array.isArray(data.schedules)) {
        setSchedules(data.schedules);
      }
    } catch (err: any) {
      console.error("Error fetching schedules:", err);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // ── Handle Add Routine Submission ─────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessResult(null);

    if (!courseCode.trim() || !sectionCode.trim() || !startTime || !endTime) {
      setErrorMessage("Please complete all required routine fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/routines/in-app-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId || undefined,
          sheetName: "Sheet1",
          courseCode: courseCode.trim(),
          courseName: courseName.trim() || undefined,
          sectionCode: sectionCode.trim(),
          dayOfWeek,
          startTime,
          endTime,
          roomNumber: roomNumber.trim() || "TBA",
          teacherInitials: teacherInitials.trim() || undefined,
          syncToGoogleSheet: syncToSheet && Boolean(spreadsheetId),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add routine");
      }

      setSuccessResult(data);
      // Reset form fields
      setCourseCode("");
      setCourseName("");
      setRoomNumber("");
      setTeacherInitials("");
      // Refresh ledger
      await fetchSchedules();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Handle Delete Master Schedule ─────────────────────────────────────────
  async function handleDeleteSchedule(scheduleId: number) {
    if (!confirm(`Are you sure you want to remove this schedule slot from the master database?`)) {
      return;
    }

    try {
      setIsDeletingId(scheduleId);
      const res = await fetch(`/api/routines/in-app-sync?scheduleId=${scheduleId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete schedule");
      }
      // Refresh ledger
      await fetchSchedules();
    } catch (err: any) {
      alert(`Error deleting schedule: ${err.message}`);
    } finally {
      setIsDeletingId(null);
    }
  }

  // ── Filtered Schedules ────────────────────────────────────────────────────
  const filteredSchedules = schedules.filter((s) => {
    const matchesDay = selectedDayFilter === "All" || s.day_of_week === selectedDayFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      s.course_code.toLowerCase().includes(q) ||
      s.course_name.toLowerCase().includes(q) ||
      s.section_code.toLowerCase().includes(q) ||
      s.room_number.toLowerCase().includes(q) ||
      (s.teacher_initials && s.teacher_initials.toLowerCase().includes(q)) ||
      (s.teacher_name && s.teacher_name.toLowerCase().includes(q));
    return matchesDay && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">

      {/* ── Top Master Sheet Status Banner ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002626] text-white flex items-center justify-center text-lg flex-shrink-0">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#191c1d]">Master Google Sheet Integration</h3>
              {spreadsheetId ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4e7dd] text-[#002626]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1a7a4a]" />
                  Auto-Sync Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffdad6] text-[#93000a]">
                  No Sheet Linked
                </span>
              )}
            </div>
            <p className="text-xs text-[#51625b] mt-0.5">
              {spreadsheetId ? (
                <>New routines added in this form will immediately update the database and auto-append to this Google Sheet.</>
              ) : (
                <>Link a Google Sheet in the header above to enable real-time cloud sheet updates.</>
              )}
            </p>
          </div>
        </div>

        {onNavigateToPullTab && (
          <button
            onClick={onNavigateToPullTab}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#002626] bg-[#e2ede6] hover:bg-[#d0e4d8] transition-colors whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Pull Existing Sheet Data
          </button>
        )}
      </div>

      {/* ── Add Routine Form ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
        <div className="border-b border-[#e5e7eb] pb-4 mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#191c1d] tracking-tight">Add Routine Slot & Sync</h3>
            <p className="text-xs text-[#51625b] mt-0.5">
              Directly insert a university class schedule without leaving the app.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#e2ede6] text-[#002626] px-2.5 py-1 rounded-lg">
            2-Way Sync Active
          </span>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div className="mb-5 p-4 rounded-xl bg-[#fff0f0] border border-[#ffdad6] text-xs font-semibold text-[#93000a] flex items-center gap-2">
            <span>❌</span> {errorMessage}
          </div>
        )}

        {successResult && (
          <div className="mb-5 p-4 rounded-xl bg-[#d4e7dd] border border-[#b3d4c0] text-xs text-[#002626] space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1a7a4a]">
              <span>✅</span> {successResult.message}
            </div>
            <div className="text-[11px] font-mono text-[#51625b] pl-6 space-y-0.5">
              <p>• Database: section_schedules updated & student routines fanned out.</p>
              {successResult.sheetSync?.ok && (
                <p className="text-[#1a7a4a] font-semibold">
                  • Google Sheet: Appended row to master spreadsheet successfully! ({successResult.sheetSync.updatedRange})
                </p>
              )}
              {successResult.sheetSync?.ok === false && (
                <p className="text-[#b45309]">
                  • Google Sheet note: {successResult.sheetSync.error} (database was saved successfully).
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Course Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#707978] mb-1.5">
                Course Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CSE471"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c0c8c7] rounded-xl text-sm font-bold text-[#002626] placeholder-[#9ca3af] outline-none focus:border-[#002626] focus:ring-2 focus:ring-[#002626]/10 transition-all font-mono"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#707978] mb-1.5">
                Course Name <span className="text-[10px] font-normal text-[#707978] lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. System Analysis and Design"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c0c8c7] rounded-xl text-sm text-[#191c1d] placeholder-[#9ca3af] outline-none focus:border-[#002626] focus:ring-2 focus:ring-[#002626]/10 transition-all"
              />
            </div>
          </div>

          {/* Row 2: Section, Room & Teacher */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#707978] mb-1.5">
                Section <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 01"
                value={sectionCode}
                onChange={(e) => setSectionCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c0c8c7] rounded-xl text-sm text-[#191c1d] placeholder-[#9ca3af] outline-none focus:border-[#002626] focus:ring-2 focus:ring-[#002626]/10 transition-all font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#707978] mb-1.5">
                Room Number
              </label>
              <input
                type="text"
                placeholder="e.g. UB80201 / Lab 3"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c0c8c7] rounded-xl text-sm text-[#191c1d] placeholder-[#9ca3af] outline-none focus:border-[#002626] focus:ring-2 focus:ring-[#002626]/10 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#707978] mb-1.5">
                Teacher Initials
              </label>
              <input
                type="text"
                placeholder="e.g. AQU / MSMA"
                value={teacherInitials}
                onChange={(e) => setTeacherInitials(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c0c8c7] rounded-xl text-sm font-bold text-[#002626] placeholder-[#9ca3af] outline-none focus:border-[#002626] focus:ring-2 focus:ring-[#002626]/10 transition-all font-mono"
              />
            </div>
          </div>

          {/* Row 3: Day & Time Range with Quick Slot Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#707978] mb-1.5">
                Day of the Week <span className="text-red-500">*</span>
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c0c8c7] rounded-xl text-sm font-semibold text-[#191c1d] outline-none focus:border-[#002626] focus:ring-2 focus:ring-[#002626]/10 transition-all cursor-pointer"
                required
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#707978] mb-1.5">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c0c8c7] rounded-xl text-sm font-mono text-[#191c1d] outline-none focus:border-[#002626] focus:ring-2 focus:ring-[#002626]/10 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#707978] mb-1.5">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#c0c8c7] rounded-xl text-sm font-mono text-[#191c1d] outline-none focus:border-[#002626] focus:ring-2 focus:ring-[#002626]/10 transition-all"
                required
              />
            </div>
          </div>

          {/* Quick Preset Slot Buttons */}
          <div>
            <span className="text-xs font-bold text-[#707978] uppercase tracking-wider mr-2">
              ⚡ Quick Slot Presets:
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_SLOTS.map((slot) => (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => {
                    setStartTime(slot.start);
                    setEndTime(slot.end);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    startTime === slot.start && endTime === slot.end
                      ? "bg-[#002626] text-white shadow-sm"
                      : "bg-[#f3f4f5] text-[#404848] hover:bg-[#e2ede6] hover:text-[#002626]"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sync Checkbox & Action Button */}
          <div className="pt-3 border-t border-[#e5e7eb] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#51625b] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncToSheet}
                onChange={(e) => setSyncToSheet(e.target.checked)}
                className="w-4 h-4 rounded text-[#002626] focus:ring-[#002626]"
              />
              <span>Auto-append new row directly into linked Google Sheet</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#002626] hover:bg-[#003535] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#002626]/20"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving & Syncing…
                </>
              ) : (
                <>
                  <span>⚡</span> Add Routine & Sync to Google Sheet
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Master Schedules Ledger ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e7eb] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#191c1d] tracking-tight">Active Master Schedule Ledger</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#e2ede6] text-[#002626]">
                {schedules.length} active slots
              </span>
            </div>
            <p className="text-xs text-[#51625b] mt-0.5">
              Live section timetables synchronized across all enrolled students and faculty.
            </p>
          </div>

          {/* Search & Day Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Search course, room, teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#c0c8c7] rounded-lg text-[#191c1d] placeholder-[#9ca3af] outline-none focus:border-[#002626] focus:ring-1 focus:ring-[#002626]"
            />

            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-[#f3f4f5] border border-[#c0c8c7] rounded-lg text-[#191c1d] outline-none cursor-pointer"
            >
              <option value="All">All Days</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              onClick={fetchSchedules}
              disabled={isLoadingSchedules}
              className="p-1.5 rounded-lg text-[#51625b] hover:text-[#002626] hover:bg-[#e2ede6] transition-colors"
              title="Refresh Ledger"
            >
              <svg
                className={`w-4 h-4 ${isLoadingSchedules ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        {isLoadingSchedules ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#51625b]">
            <div className="w-8 h-8 rounded-full border-[3px] border-[#002626] border-t-transparent animate-spin" />
            <p className="text-xs font-semibold">Loading master schedule ledger…</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-12 text-[#707978] bg-[#f8f9fa] rounded-xl border border-dashed border-[#c0c8c7] p-8">
            <span className="text-3xl">🗓️</span>
            <p className="text-sm font-bold text-[#191c1d] mt-2">No Schedule Slots Found</p>
            <p className="text-xs text-[#51625b] mt-1 max-w-sm mx-auto">
              Use the form above to add a routine or pull existing entries from the Google Sheet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#f3f4f5]">
                  {["Course", "Sec", "Day", "Time Slot", "Room", "Teacher", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-3.5 py-2.5 text-left font-bold text-[#51625b] uppercase tracking-wider text-[11px] whitespace-nowrap border-b border-[#e5e7eb]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((item, idx) => (
                  <tr
                    key={item.schedule_id}
                    className={`hover:bg-[#f3f4f5]/60 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]"
                    }`}
                  >
                    <td className="px-3.5 py-2.5">
                      <div className="font-bold text-[#002626] text-xs font-mono">{item.course_code}</div>
                      <div className="text-[11px] text-[#51625b] truncate max-w-[140px]">
                        {item.course_name}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 font-mono font-bold text-[#191c1d]">
                      {item.section_code}
                    </td>
                    <td className="px-3.5 py-2.5 font-medium text-[#191c1d]">
                      {item.day_of_week}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-[#002626]">
                      {item.start_time.substring(0, 5)} – {item.end_time.substring(0, 5)}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono font-medium text-[#191c1d]">
                      {item.room_number || "TBA"}
                    </td>
                    <td className="px-3.5 py-2.5">
                      {item.teacher_initials ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#e2ede6] text-[#002626] border border-[#c0c8c7]">
                          {item.teacher_initials}
                        </span>
                      ) : (
                        <span className="text-[#9ca3af] italic">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#d4e7dd] text-[#002626]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1a7a4a]" />
                        Active
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <button
                        onClick={() => handleDeleteSchedule(item.schedule_id)}
                        disabled={isDeletingId === item.schedule_id}
                        className="px-2.5 py-1 rounded text-[11px] font-bold text-[#dc2626] bg-[#fee2e2] hover:bg-[#fecaca] transition-colors disabled:opacity-50"
                        title="Delete slot"
                      >
                        {isDeletingId === item.schedule_id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
