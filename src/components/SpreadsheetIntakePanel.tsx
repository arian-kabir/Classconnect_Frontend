"use client";

/**
 * SpreadsheetIntakePanel.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Admin Routine Intake & Bi-Directional Synchronization Panel.
 *
 * Provides two primary workflows:
 *  1. ✍️ In-App Routine Manager & Live Sync: Directly add/manage routines inside
 *     the app with instant auto-append to the linked master Google Sheet.
 *  2. 📥 Pull / Refresh from Google Sheet: Read the remote Google Sheet and
 *     batch import/update routines with dry-run previewing.
 *
 * Features:
 *  - Master Google Sheet URL persisted in localStorage across sessions.
 *  - High-contrast light Academic Nexus design system.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef } from "react";
import InAppRoutineManager from "./Admin/InAppRoutineManager";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedRow {
  sheetRowRef: number;
  courseCode: string;
  sectionCode: string;
  sectionId: number | null;
  teacherInitials: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface Warning {
  sheetRowRef: number;
  rawRow: string[];
  reason: string;
}

interface IntakeResult {
  success?: boolean;
  dryRun?: boolean;
  totalRawRows?: number;
  parsed?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  parsedRows?: ParsedRow[];
  warnings?: Warning[];
  errors?: Array<{ sheetRowRef: number; error: string }>;
  error?: string;
  hint?: string;
}

interface LastRun {
  log_id: number;
  spreadsheet_id: string;
  sheet_range: string;
  total_raw_rows: number;
  inserted: number;
  updated: number;
  skipped: number;
  warnings_count: number;
  errors_count: number;
  ran_at: string;
}

type IntakeMode = "in-app" | "pull";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "classconnect_intake_sheet_url";
const STORAGE_RANGE_KEY = "classconnect_intake_sheet_range";

function extractSheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : input.trim();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SpreadsheetIntakePanel() {
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("in-app");

  // Saved / persisted URL (shown as read-only with Edit button)
  const [savedUrl, setSavedUrl] = useState<string>("");
  const [savedRange, setSavedRange] = useState<string>("Sheet1!A2:F1000");

  // In-edit mode state
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [editUrlValue, setEditUrlValue] = useState("");
  const [editRangeValue, setEditRangeValue] = useState("Sheet1!A2:F1000");

  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "log">("preview");
  const logRef = useRef<HTMLDivElement>(null);

  // ── Load saved URL from localStorage on mount ─────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || "";
    const storedRange = localStorage.getItem(STORAGE_RANGE_KEY) || "Sheet1!A2:F1000";
    setSavedUrl(stored);
    setSavedRange(storedRange);
    setEditUrlValue(stored);
    setEditRangeValue(storedRange);
  }, []);

  // ── Load last run on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/routines/intake")
      .then((r) => r.json())
      .then((d) => setLastRun(d.lastRun ?? null))
      .catch(() => {});
  }, []);

  // Scroll log to bottom whenever result changes
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [result]);

  // ── Save URL changes ──────────────────────────────────────────────────────
  function handleSaveUrl() {
    if (!editUrlValue.trim()) return;
    localStorage.setItem(STORAGE_KEY, editUrlValue.trim());
    localStorage.setItem(STORAGE_RANGE_KEY, editRangeValue.trim());
    setSavedUrl(editUrlValue.trim());
    setSavedRange(editRangeValue.trim());
    setIsEditingUrl(false);
  }

  // ── Run pull intake ───────────────────────────────────────────────────────
  async function handleRunPull() {
    const urlToUse = savedUrl;
    const spreadsheetId = extractSheetId(urlToUse);
    if (!spreadsheetId) {
      setResult({ error: "Please save a valid Google Sheets URL or Spreadsheet ID first." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/routines/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadsheetId, range: savedRange, dryRun }),
      });
      const data: IntakeResult = await res.json();
      setResult(data);
      if (!dryRun && data.success) {
        fetch("/api/routines/intake")
          .then((r) => r.json())
          .then((d) => setLastRun(d.lastRun ?? null))
          .catch(() => {});
      }
      setActiveTab(dryRun ? "preview" : "log");
    } catch (err) {
      setResult({ error: "Network error — could not reach the API." });
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto font-sans text-[#191c1d] flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#002626] flex items-center justify-center text-2xl shadow-md flex-shrink-0">
            📊
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#191c1d] tracking-tight leading-none">
              Routine Intake & Master Timetable Sync
            </h2>
            <p className="text-xs text-[#51625b] mt-1">
              Add and manage university routines in-app with real-time Google Sheets auto-sync.
            </p>
          </div>
        </div>

        {/* Ingestion Mode Toggle Segment */}
        <div className="flex items-center gap-1 bg-[#e7e9ea] p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setIntakeMode("in-app")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              intakeMode === "in-app"
                ? "bg-white text-[#002626] shadow-sm"
                : "text-[#51625b] hover:text-[#191c1d]"
            }`}
          >
            <span>✍️</span> In-App Manager & Sync
          </button>
          <button
            onClick={() => setIntakeMode("pull")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              intakeMode === "pull"
                ? "bg-white text-[#002626] shadow-sm"
                : "text-[#51625b] hover:text-[#191c1d]"
            }`}
          >
            <span>📥</span> Pull from Google Sheet
          </button>
        </div>
      </div>

      {/* ── Linked Master Google Sheet Card ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-5">
        {!isEditingUrl && savedUrl ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#707978]">
                Linked Master Google Sheet
              </span>
              <button
                onClick={() => {
                  setEditUrlValue(savedUrl);
                  setEditRangeValue(savedRange);
                  setIsEditingUrl(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#002626] bg-[#e2ede6] hover:bg-[#d0e4d8] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Sheet Link
              </button>
            </div>

            <div className="flex items-center gap-3 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 text-[#1a7a4a] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-xs text-[#191c1d] font-mono truncate flex-1">{savedUrl}</span>
              <span className="text-[11px] font-mono text-[#002626] bg-[#e2ede6] px-2 py-0.5 rounded font-semibold">
                Range: {savedRange}
              </span>
              <span className="text-[11px] font-bold text-[#1a7a4a] bg-[#d4e7dd] px-2 py-0.5 rounded-full flex-shrink-0">
                ✓ Linked
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#707978]">
                {savedUrl ? "Update Master Google Sheet Link" : "Link Master Google Sheet"}
              </span>
              {savedUrl && (
                <button
                  onClick={() => setIsEditingUrl(false)}
                  className="text-xs font-semibold text-[#707978] hover:text-[#191c1d] transition-colors"
                >
                  ✕ Cancel
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/... or spreadsheet ID"
                  value={editUrlValue}
                  onChange={(e) => setEditUrlValue(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#c0c8c7] rounded-xl text-xs text-[#191c1d] placeholder-[#9ca3af] outline-none focus:border-[#002626] focus:ring-1 focus:ring-[#002626] font-mono"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Sheet1!A2:F1000"
                  value={editRangeValue}
                  onChange={(e) => setEditRangeValue(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#c0c8c7] rounded-xl text-xs text-[#191c1d] placeholder-[#9ca3af] outline-none focus:border-[#002626] focus:ring-1 focus:ring-[#002626] font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSaveUrl}
              disabled={!editUrlValue.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#002626] hover:bg-[#003535] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save & Link Master Google Sheet
            </button>
          </div>
        )}
      </div>

      {/* ── MODE 1: In-App Routine Manager & Live Sync ─────────────────────── */}
      {intakeMode === "in-app" && (
        <InAppRoutineManager
          spreadsheetUrl={savedUrl}
          onNavigateToPullTab={() => setIntakeMode("pull")}
        />
      )}

      {/* ── MODE 2: Pull / Refresh from Google Sheet ───────────────────────── */}
      {intakeMode === "pull" && (
        <div className="flex flex-col gap-5">
          {/* Last Run Badge */}
          {lastRun && (
            <div className="flex items-center gap-2 text-xs text-[#1a7a4a] bg-[#d4e7dd] border border-[#b3d4c0] rounded-xl px-4 py-2.5">
              <span className="w-2 h-2 rounded-full bg-[#1a7a4a] flex-shrink-0" />
              <span>
                Last pulled <strong>{fmtTime(lastRun.ran_at)}</strong> — {lastRun.inserted} inserted,{" "}
                {lastRun.updated} updated, {lastRun.skipped} skipped
              </span>
            </div>
          )}

          {/* Pull Controls */}
          <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
            <div className="border-b border-[#e5e7eb] pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#191c1d]">Batch Ingest from Google Sheet</h3>
              <p className="text-xs text-[#51625b]">
                Pull the external scheduling sheet and auto-populate / update all course timetables.
              </p>
            </div>

            {/* Dry-run toggle */}
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setDryRun((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  dryRun
                    ? "bg-[#f3f4f5] text-[#51625b] border-[#c0c8c7] hover:border-[#51625b]"
                    : "bg-[#002626] text-white border-[#002626] hover:bg-[#003535]"
                }`}
              >
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dryRun ? "bg-[#51625b]" : "bg-[#4ade80]"}`} />
                {dryRun ? "🔍 Preview Mode (no DB writes)" : "✅ Live Mode (writes to DB)"}
              </button>
              <span className="text-xs text-[#707978]">
                {dryRun
                  ? "Safe — shows parsed rows without touching the database."
                  : "Will UPSERT into section_schedules & student routines."}
              </span>
            </div>

            {/* Run button */}
            <button
              onClick={handleRunPull}
              disabled={loading || !savedUrl}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm tracking-wide transition-all ${
                loading || !savedUrl
                  ? "bg-[#c0c8c7] text-[#707978] cursor-not-allowed"
                  : dryRun
                  ? "bg-[#002626] hover:bg-[#003535] text-white shadow-md shadow-[#002626]/20"
                  : "bg-[#1a7a4a] hover:bg-[#166040] text-white shadow-md shadow-[#1a7a4a]/20"
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Pulling & Parsing Sheet…
                </>
              ) : !savedUrl ? (
                "⚠ Link a Google Sheet above first"
              ) : dryRun ? (
                "🔍 Preview Rows from Sheet"
              ) : (
                "⚡ Run Full Ingestion from Sheet"
              )}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
              {result.error && (
                <div className="bg-[#fff0f0] border border-[#ffdad6] rounded-xl px-4 py-3 text-sm text-[#93000a] font-semibold">
                  ❌ {result.error}
                  {result.hint && (
                    <p className="text-xs text-[#51625b] mt-1 font-normal">{result.hint}</p>
                  )}
                </div>
              )}

              {(result.success || result.dryRun) && (
                <>
                  <div className="flex flex-wrap gap-3 mb-5">
                    <StatChip label="Raw Rows" value={result.totalRawRows ?? 0} color="bg-[#002626] text-white" />
                    <StatChip label="Parsed" value={result.parsed ?? result.parsedRows?.length ?? 0} color="bg-[#51625b] text-white" />
                    {!result.dryRun && (
                      <>
                        <StatChip label="Inserted" value={result.inserted ?? 0} color="bg-[#1a7a4a] text-white" />
                        <StatChip label="Updated" value={result.updated ?? 0} color="bg-[#1e5799] text-white" />
                        <StatChip label="Skipped" value={result.skipped ?? 0} color="bg-[#7a5c1a] text-white" />
                      </>
                    )}
                    {(result.warnings?.length ?? 0) > 0 && (
                      <StatChip label="Warnings" value={result.warnings!.length} color="bg-[#b45309] text-white" />
                    )}
                    {(result.errors?.length ?? 0) > 0 && (
                      <StatChip label="Errors" value={result.errors!.length} color="bg-[#991b1b] text-white" />
                    )}
                  </div>

                  <div className="flex gap-2 mb-4 border-b border-[#e5e7eb] pb-3">
                    {result.dryRun && (
                      <TabBtn
                        label="📋 Preview Table"
                        active={activeTab === "preview"}
                        onClick={() => setActiveTab("preview")}
                      />
                    )}
                    <TabBtn
                      label="📜 Log"
                      active={activeTab === "log"}
                      onClick={() => setActiveTab("log")}
                    />
                  </div>

                  {activeTab === "preview" && result.parsedRows && (
                    <div className="overflow-x-auto rounded-xl border border-[#e5e7eb]">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#f3f4f5]">
                            {["Row", "Course", "Sec", "Section ID", "Day", "Start", "End", "Room", "Teacher", "Status"].map(
                              (h) => (
                                <th
                                  key={h}
                                  className="px-3 py-2.5 text-left font-bold text-[#51625b] uppercase tracking-wider text-[11px] whitespace-nowrap border-b border-[#e5e7eb]"
                                >
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {result.parsedRows.map((row, idx) => (
                            <tr
                              key={row.sheetRowRef}
                              className={idx % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]"}
                            >
                              <td className="px-3 py-2 text-[#707978] font-mono">{row.sheetRowRef}</td>
                              <td className="px-3 py-2 font-bold text-[#002626]">{row.courseCode}</td>
                              <td className="px-3 py-2 text-[#191c1d]">{row.sectionCode}</td>
                              <td className="px-3 py-2">
                                {row.sectionId !== null ? (
                                  <span className="bg-[#d4e7dd] text-[#1a7a4a] px-2 py-0.5 rounded-full text-[11px] font-bold">
                                    #{row.sectionId}
                                  </span>
                                ) : (
                                  <span className="bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded-full text-[11px] font-bold">
                                    Not found
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-[#191c1d]">{row.dayOfWeek}</td>
                              <td className="px-3 py-2 text-[#191c1d] font-mono">{row.startTime}</td>
                              <td className="px-3 py-2 text-[#191c1d] font-mono">{row.endTime}</td>
                              <td className="px-3 py-2 text-[#191c1d]">{row.room}</td>
                              <td className="px-3 py-2 text-[#51625b]">{row.teacherInitials || "—"}</td>
                              <td className="px-3 py-2">
                                {row.sectionId !== null ? (
                                  <span className="bg-[#d4e7dd] text-[#1a7a4a] px-2 py-0.5 rounded-full text-[11px] font-bold">
                                    ✓ Ready
                                  </span>
                                ) : (
                                  <span className="bg-[#fff0e6] text-[#b45309] px-2 py-0.5 rounded-full text-[11px] font-bold">
                                    ⚠ Unmatched
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "log" && (
                    <div
                      ref={logRef}
                      className="bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl p-4 max-h-72 overflow-y-auto font-mono text-xs leading-relaxed"
                    >
                      {result.warnings && result.warnings.length > 0 && (
                        <>
                          <p className="font-bold text-[#b45309] mb-2">
                            ⚠ Warnings ({result.warnings.length})
                          </p>
                          {result.warnings.map((w, i) => (
                            <div key={i} className="mb-1 text-[#404848]">
                              <span className="bg-[#e2ede6] text-[#002626] px-1.5 py-0.5 rounded text-[11px] font-bold mr-2">
                                Row {w.sheetRowRef}
                              </span>
                              <span className="text-[#b45309]">{w.reason}</span>
                            </div>
                          ))}
                        </>
                      )}
                      {result.errors && result.errors.length > 0 && (
                        <>
                          <p className="font-bold text-[#93000a] mb-2 mt-3">
                            ❌ Errors ({result.errors.length})
                          </p>
                          {result.errors.map((e, i) => (
                            <div key={i} className="mb-1 text-[#404848]">
                              <span className="bg-[#ffdad6] text-[#93000a] px-1.5 py-0.5 rounded text-[11px] font-bold mr-2">
                                Row {e.sheetRowRef}
                              </span>
                              <span className="text-[#93000a]">{e.error}</span>
                            </div>
                          ))}
                        </>
                      )}
                      {result.success && (
                        <div className="text-[#1a7a4a] font-semibold">
                          ✅ Intake complete — {result.inserted} inserted, {result.updated} updated,{" "}
                          {result.skipped} skipped.
                        </div>
                      )}
                      {result.warnings?.length === 0 &&
                        result.errors?.length === 0 &&
                        !result.success && (
                          <div className="text-[#707978]">No warnings or errors to display.</div>
                        )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`flex flex-col items-center px-4 py-2 rounded-xl min-w-[72px] ${color}`}>
      <span className="text-2xl font-extrabold leading-none">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 mt-0.5">{label}</span>
    </div>
  );
}

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? "bg-[#002626] text-white shadow-sm"
          : "text-[#707978] hover:text-[#191c1d] hover:bg-[#f3f4f5]"
      }`}
    >
      {label}
    </button>
  );
}
