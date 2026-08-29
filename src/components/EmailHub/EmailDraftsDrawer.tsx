'use client';

import React from 'react';

export interface EmailDraftItem {
  draft_id: number;
  user_id: number;
  template_id?: number;
  template_title?: string;
  category?: string;
  recipient_email?: string;
  subject?: string;
  form_data: Record<string, any>;
  attachments: string[];
  updated_at: string;
}

interface EmailDraftsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: EmailDraftItem[];
  isLoading: boolean;
  onRestoreDraft: (draft: EmailDraftItem) => void;
  onDeleteDraft: (draftId: number) => void;
}

export default function EmailDraftsDrawer({
  isOpen,
  onClose,
  drafts,
  isLoading,
  onRestoreDraft,
  onDeleteDraft,
}: EmailDraftsDrawerProps) {
  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#002626]/30 backdrop-blur-xs transition-opacity animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Body */}
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft border-l border-[#c0c8c7]">
        {/* Header */}
        <div className="p-6 border-b border-[#e5e7eb] bg-[#f8f9fa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#51625b] text-white flex items-center justify-center shadow-xs">
              <span className="text-lg">💾</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#191c1d] tracking-tight">Saved Email Drafts</h2>
              <p className="text-xs text-[#51625b]">Resume composed applications or templates anytime</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#707978] hover:text-[#191c1d] hover:bg-[#e7e8e9] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#f8f9fa]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-[#51625b]">
              <div className="w-8 h-8 rounded-full border-3 border-[#002626] border-t-transparent animate-spin" />
              <p className="text-xs font-semibold">Loading saved drafts...</p>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-[#707978] bg-white rounded-xl border border-dashed border-[#c0c8c7] p-8 text-center">
              <span className="text-3xl">📝</span>
              <p className="text-sm font-bold text-[#191c1d]">No Saved Drafts</p>
              <p className="text-xs max-w-sm text-[#51625b]">
                Save work-in-progress email applications by clicking "Save Draft" in the editor studio to pick up where you left off.
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.draft_id}
                className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-xs hover:shadow-md transition-all flex flex-col gap-3 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#e2ede6] text-[#002626]">
                    {draft.template_title || 'Custom Email'}
                  </span>
                  <span className="text-[11px] text-[#707978] font-mono">Updated {formatDate(draft.updated_at)}</span>
                </div>

                <h3 className="text-sm font-bold text-[#191c1d]">
                  {draft.subject || draft.form_data?.subject || '(Untitled Subject)'}
                </h3>

                {draft.recipient_email && (
                  <p className="text-xs text-[#51625b]">
                    <span className="font-semibold">Recipient:</span> {draft.recipient_email}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[#f3f4f5] mt-1">
                  <span className="text-[11px] text-[#707978]">
                    {Object.keys(draft.form_data || {}).length} variables configured
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDeleteDraft(draft.draft_id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        onRestoreDraft(draft);
                        onClose();
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#002626] hover:bg-[#003d3d] transition-colors"
                    >
                      Resume Draft →
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
