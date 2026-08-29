'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface EmailLogItem {
  log_id: number;
  user_id: number;
  recipient_email: string;
  recipient_name: string;
  course_code?: string;
  subject: string;
  body_content: string;
  category: string;
  template_id?: number;
  status: 'sent' | 'simulated' | 'draft' | 'failed';
  attachments: string[];
  error_message?: string | null;
  sent_at: string;
}

interface EmailHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: EmailLogItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function EmailHistoryDrawer({
  isOpen,
  onClose,
  logs,
  isLoading,
  onRefresh,
}: EmailHistoryDrawerProps) {
  const [expandedLog, setExpandedLog] = useState<EmailLogItem | null>(null);

  // Close expanded popup on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedLog) {
          setExpandedLog(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expandedLog, onClose]);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (expandedLog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [expandedLog]);

  const closeExpanded = useCallback(() => setExpandedLog(null), []);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#d4e7dd] text-[#002626]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#002626]" />
            Delivered
          </span>
        );
      case 'simulated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e2ede6] text-[#356666]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#356666]" />
            Sandbox Logged
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffdad6] text-[#93000a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#e1e3e4] text-[#404848]">
            {status}
          </span>
        );
    }
  };

  const getCategoryLabel = (cat: string) =>
    cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const getCategoryEmoji = (cat: string) => {
    const map: Record<string, string> = {
      sickness_leave: '🤒',
      quiz_makeup: '📝',
      consultation: '📅',
      assignment_extension: '📋',
      recommendation: '🏆',
      custom: '✉️',
      general: '📧',
    };
    return map[cat] || '✉️';
  };

  return (
    <>
      {/* =====================================================
          DRAWER
         ===================================================== */}
      <div className="fixed inset-0 z-50 flex justify-end bg-[#002626]/30 backdrop-blur-sm transition-opacity animate-fadeIn">
        {/* Backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Drawer Body */}
        <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#c0c8c7]">
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#002626] text-white flex items-center justify-center shadow-sm">
                <span className="text-lg">📜</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#191c1d] tracking-tight">Delivery Audit Ledger</h2>
                <p className="text-xs text-[#51625b]">
                  Click any email to view the full message
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#002626] bg-[#e2ede6] hover:bg-[#d0e4d8] transition-colors flex items-center gap-1"
              >
                <svg
                  className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-[#707978] hover:text-[#191c1d] hover:bg-[#e7e8e9] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#f8f9fa]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#51625b]">
                <div className="w-8 h-8 rounded-full border-[3px] border-[#002626] border-t-transparent animate-spin" />
                <p className="text-xs font-semibold">Loading delivery audit records...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-[#707978] bg-white rounded-xl border border-dashed border-[#c0c8c7] p-8 text-center">
                <span className="text-3xl">📫</span>
                <p className="text-sm font-bold text-[#191c1d]">No Sent Emails Yet</p>
                <p className="text-xs max-w-sm text-[#51625b]">
                  When you prepare and dispatch emails using the Structured Email Engine, official audit logs will be permanently recorded here.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <button
                  key={log.log_id}
                  onClick={() => setExpandedLog(log)}
                  className="w-full text-left bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm hover:shadow-md hover:border-[#002626]/30 hover:ring-1 hover:ring-[#002626]/10 transition-all flex flex-col gap-3 group cursor-pointer"
                >
                  {/* Top Row: Category & Status & Time */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      {log.course_code && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#e7e9ea] text-[#191c1d]">
                          {log.course_code}
                        </span>
                      )}
                      <span className="text-[11px] font-bold text-[#51625b] uppercase tracking-wider">
                        {getCategoryEmoji(log.category)} {getCategoryLabel(log.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#707978] font-mono">{formatDate(log.sent_at)}</span>
                      {/* "View full" hint */}
                      <span className="hidden group-hover:flex items-center gap-1 text-[11px] font-bold text-[#002626] bg-[#e2ede6] px-2 py-0.5 rounded-full transition-all">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View full
                      </span>
                    </div>
                  </div>

                  {/* Subject */}
                  <h3 className="text-sm font-bold text-[#191c1d] leading-snug group-hover:text-[#002626] transition-colors text-left">
                    {log.subject}
                  </h3>

                  {/* Recipient */}
                  <div className="flex items-center gap-2 text-xs text-[#51625b]">
                    <span className="font-semibold text-[#191c1d]">To:</span>
                    <span>{log.recipient_name ? `${log.recipient_name} <${log.recipient_email}>` : log.recipient_email}</span>
                  </div>

                  {/* Body Preview — truncated */}
                  <div className="bg-[#f8f9fa] rounded-lg p-3 border border-[#e5e7eb] text-xs text-[#404848] leading-relaxed line-clamp-3 whitespace-pre-line font-normal text-left">
                    {log.body_content}
                  </div>

                  {/* Attachments */}
                  {log.attachments && log.attachments.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#f3f4f5]">
                      <span className="text-[11px] font-bold text-[#707978]">📎 Attachments:</span>
                      {log.attachments.map((att, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#e2ede6] text-[#002626] border border-[#c0c8c7]"
                        >
                          {att}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-[#e5e7eb] bg-white flex items-center justify-between">
            <span className="text-xs text-[#707978] font-semibold">
              {logs.length} email{logs.length !== 1 ? 's' : ''} in audit log
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-[#191c1d] bg-[#f3f4f5] hover:bg-[#e7e9ea] transition-colors"
            >
              Close Audit Ledger
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          FULL EMAIL POPUP / MODAL
         ===================================================== */}
      {expandedLog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={closeExpanded}
        >
          {/* Modal Card — stop click propagation so clicking inside doesn't close */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#c0c8c7] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 p-6 border-b border-[#e5e7eb] bg-[#f8f9fa]">
              <div className="flex-1 min-w-0">
                {/* Status + Category row */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {getStatusBadge(expandedLog.status)}
                  {expandedLog.course_code && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#e7e9ea] text-[#191c1d]">
                      {expandedLog.course_code}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-[#51625b] uppercase tracking-wider">
                    {getCategoryEmoji(expandedLog.category)} {getCategoryLabel(expandedLog.category)}
                  </span>
                  <span className="text-[11px] text-[#707978] font-mono ml-auto">
                    {formatDate(expandedLog.sent_at)}
                  </span>
                </div>

                {/* Subject */}
                <h2 className="text-base font-bold text-[#191c1d] leading-snug break-words">
                  {expandedLog.subject}
                </h2>
              </div>

              {/* Close button */}
              <button
                onClick={closeExpanded}
                className="flex-shrink-0 p-2 rounded-lg text-[#707978] hover:text-[#191c1d] hover:bg-[#e7e9ea] transition-colors"
                title="Close (Esc)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Email Metadata */}
            <div className="px-6 py-3 border-b border-[#e5e7eb] bg-white">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-[#51625b]">
                  <span className="font-bold text-[#191c1d] w-8">To:</span>
                  <span className="font-mono text-[#002626]">
                    {expandedLog.recipient_name
                      ? `${expandedLog.recipient_name} <${expandedLog.recipient_email}>`
                      : expandedLog.recipient_email}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#51625b]">
                  <span className="font-bold text-[#191c1d] w-16">Log ID:</span>
                  <span className="font-mono">#{expandedLog.log_id}</span>
                </div>
              </div>
            </div>

            {/* Full Email Body — scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-[#f8f9fa] rounded-xl border border-[#e5e7eb] p-5 text-sm text-[#191c1d] leading-relaxed whitespace-pre-wrap font-sans min-h-[200px]">
                {expandedLog.body_content}
              </div>

              {/* Attachments */}
              {expandedLog.attachments && expandedLog.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                  <p className="text-xs font-bold text-[#707978] mb-2">📎 Attached Files</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {expandedLog.attachments.map((att, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#e2ede6] text-[#002626] border border-[#c0c8c7]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {att}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {expandedLog.error_message && (
                <div className="mt-4 p-3 rounded-lg bg-[#fff0f0] border border-[#ffdad6] text-xs text-[#93000a] font-semibold">
                  ⚠️ Error Note: {expandedLog.error_message}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between gap-4">
              <p className="text-[11px] text-[#707978]">
                Click outside or press <kbd className="px-1 py-0.5 rounded bg-[#e7e9ea] border border-[#c0c8c7] font-mono text-[10px]">Esc</kbd> to close
              </p>
              <button
                onClick={closeExpanded}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#002626] hover:bg-[#003636] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
