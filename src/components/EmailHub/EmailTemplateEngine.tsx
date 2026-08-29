'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import EmailHistoryDrawer, { EmailLogItem } from './EmailHistoryDrawer';
import EmailDraftsDrawer, { EmailDraftItem } from './EmailDraftsDrawer';

export interface EmailVariableDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'select_course' | 'user_profile';
  required: boolean;
  default?: string;
  options?: string[];
  placeholder?: string;
}

export interface EmailTemplate {
  template_id: number;
  category: 'sickness_leave' | 'quiz_makeup' | 'consultation' | 'assignment_extension' | 'recommendation' | 'custom';
  title: string;
  description: string;
  default_subject: string;
  body_template: string;
  required_variables: EmailVariableDefinition[];
  is_system: boolean;
}

export interface RecipientOption {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  role_label: string;
  course_code: string;
  course_name: string;
  section_code: string;
  section_id: number;
}

export default function EmailTemplateEngine() {
  const { data: session } = useSession();
  const user = session?.user as any;

  // States
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Form State
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption | null>(null);
  const [customRecipientEmail, setCustomRecipientEmail] = useState<string>('');
  const [customRecipientName, setCustomRecipientName] = useState<string>('');
  const [formVariables, setFormVariables] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string; type: string }>>([]);

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [highlightVariables, setHighlightVariables] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);

  // History & Draft Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<EmailLogItem[]>([]);
  const [savedDrafts, setSavedDrafts] = useState<EmailDraftItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

  // Status Toast / Modal
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [sentSuccessModal, setSentSuccessModal] = useState<{
    recipient: string;
    subject: string;
    deliveryMode: string;
    mailToUrl: string;
  } | null>(null);

  // Load initial templates & recipients
  useEffect(() => {
    fetchTemplates();
    fetchRecipients();
    fetchHistory();
    fetchDrafts();
  }, [user?.id, user?.email]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/emails/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        if (data.templates && data.templates.length > 0 && !selectedTemplate) {
          selectTemplate(data.templates[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const fetchRecipients = async () => {
    try {
      const activeId = user?.id || user?.user_id;
      const url = activeId ? `/api/emails/recipients?userId=${activeId}` : '/api/emails/recipients';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.recipients || []);
      }
    } catch (err) {
      console.error('Failed to load recipients:', err);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const activeId = user?.id || user?.user_id;
      const activeEmail = user?.email;
      const params = new URLSearchParams();
      if (activeId) params.set('userId', String(activeId));
      if (activeEmail) params.set('email', activeEmail);

      const res = await fetch(`/api/emails/history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load email history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchDrafts = async () => {
    setIsLoadingDrafts(true);
    try {
      const activeId = user?.id || user?.user_id;
      const params = new URLSearchParams();
      if (activeId) params.set('userId', String(activeId));

      const res = await fetch(`/api/emails/drafts?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSavedDrafts(data.drafts || []);
        }
      } catch (err) {
        console.error('Failed to load drafts:', err);
      } finally {
        setIsLoadingDrafts(false);
      }
    };

  // Switch Active Template
  const selectTemplate = (tpl: EmailTemplate) => {
    setSelectedTemplate(tpl);
    setActiveDraftId(null);

    // Populate initial default variables
    const initialVars: Record<string, string> = {};
    tpl.required_variables.forEach((v) => {
      if (v.key === 'student_name') {
        initialVars[v.key] = user?.name || v.default || 'Arian Kabir';
      } else if (v.key === 'student_email') {
        initialVars[v.key] = user?.email || v.default || 'arian.kabir@university.edu';
      } else if (v.key === 'student_id') {
        initialVars[v.key] = '23201295';
      } else if (v.key === 'department') {
        initialVars[v.key] = 'Computer Science & Engineering';
      } else {
        initialVars[v.key] = v.default || '';
      }
    });

    setFormVariables(initialVars);

    // Auto-match recipient if default course is CSE471 / CS101
    const defaultCourse = initialVars['course_code'] || 'CSE471';
    const matchedRecipient = recipients.find((r) => r.course_code === defaultCourse);
    if (matchedRecipient) {
      setSelectedRecipient(matchedRecipient);
      setCustomRecipientEmail(matchedRecipient.email);
      setCustomRecipientName(matchedRecipient.full_name);
    }
  };

  // Variable Change Handler
  const handleVariableChange = (key: string, value: string) => {
    setFormVariables((prev) => {
      const updated = { ...prev, [key]: value };

      // If course_code changed, auto-update recipient & section
      if (key === 'course_code') {
        const matched = recipients.find((r) => r.course_code === value);
        if (matched) {
          setSelectedRecipient(matched);
          setCustomRecipientEmail(matched.email);
          setCustomRecipientName(matched.full_name);
          updated['section_number'] = matched.section_code || '1';
          updated['recipient_name'] = matched.full_name;
        }
      }

      return updated;
    });
  };

  // Recipient Dropdown Handler
  const handleRecipientSelect = (recipientEmail: string) => {
    const matched = recipients.find((r) => r.email === recipientEmail);
    if (matched) {
      setSelectedRecipient(matched);
      setCustomRecipientEmail(matched.email);
      setCustomRecipientName(matched.full_name);
      setFormVariables((prev) => ({
        ...prev,
        recipient_name: matched.full_name,
        course_code: matched.course_code,
        section_number: matched.section_code || prev.section_number,
      }));
    } else {
      setSelectedRecipient(null);
      setCustomRecipientEmail(recipientEmail);
    }
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchesCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
      const matchesSearch =
        tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tpl.default_subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  // Compute Live Rendered Subject and Body
  const { renderedSubject, renderedBody } = useMemo(() => {
    if (!selectedTemplate) return { renderedSubject: '', renderedBody: '' };

    let subj = selectedTemplate.default_subject;
    let body = selectedTemplate.body_template;

    Object.entries(formVariables).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      const safeVal = val !== undefined && val !== null && val !== '' ? String(val) : `[${key}]`;
      subj = subj.replace(regex, safeVal);
      body = body.replace(regex, safeVal);
    });

    return { renderedSubject: subj, renderedBody: body };
  }, [selectedTemplate, formVariables]);

  // Compute mailto URL
  const mailToUrl = useMemo(() => {
    const emailTo = customRecipientEmail || selectedRecipient?.email || '';
    return `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(
      renderedSubject
    )}&body=${encodeURIComponent(renderedBody)}`;
  }, [customRecipientEmail, selectedRecipient, renderedSubject, renderedBody]);

  // Handle Local Attachment Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        name: f.name,
        size: (f.size / 1024).toFixed(1) + ' KB',
        type: f.type,
      }));
      setAttachments((prev) => [...prev, ...newFiles]);

      // Auto update attachment variable in template if present
      if (newFiles.length > 0) {
        if (selectedTemplate?.category === 'sickness_leave') {
          handleVariableChange('medical_doc_name', newFiles[0].name);
        } else if (selectedTemplate?.category === 'quiz_makeup') {
          handleVariableChange('supporting_doc_name', newFiles[0].name);
        } else if (selectedTemplate?.category === 'assignment_extension') {
          handleVariableChange('draft_file_name', newFiles[0].name);
        }
      }

      showToast('success', `Attached ${newFiles.length} file(s) successfully.`);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Toast Helper
  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Copy to Clipboard
  const handleCopyToClipboard = async () => {
    try {
      const fullText = `Subject: ${renderedSubject}\n\n${renderedBody}`;
      await navigator.clipboard.writeText(fullText);
      setCopyFeedback(true);
      showToast('success', 'Email subject & body copied to clipboard!');
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch (err) {
      showToast('error', 'Failed to copy to clipboard.');
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch('/api/emails/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 1,
          draft_id: activeDraftId || undefined,
          template_id: selectedTemplate.template_id,
          recipient_email: customRecipientEmail,
          subject: renderedSubject,
          form_data: formVariables,
          attachments: attachments.map((a) => a.name),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.draft_id) setActiveDraftId(data.draft_id);
        fetchDrafts();
        showToast('success', 'Email draft saved successfully.');
      } else {
        showToast('error', 'Failed to save draft.');
      }
    } catch (err) {
      showToast('error', 'Error saving draft.');
    }
  };

  // Restore Draft
  const handleRestoreDraft = (draft: EmailDraftItem) => {
    const tpl = templates.find((t) => t.template_id === draft.template_id);
    if (tpl) {
      setSelectedTemplate(tpl);
      setActiveDraftId(draft.draft_id);
      setFormVariables(draft.form_data || {});
      setCustomRecipientEmail(draft.recipient_email || '');
      if (draft.attachments && draft.attachments.length > 0) {
        setAttachments(draft.attachments.map((name) => ({ name, size: 'Saved', type: 'application/pdf' })));
      }
      showToast('info', `Restored draft: "${tpl.title}"`);
    }
  };

  // Send Email via In-App Engine
  const handleSendEmail = async () => {
    const targetEmail = customRecipientEmail || selectedRecipient?.email;
    if (!targetEmail) {
      showToast('error', 'Please provide a valid recipient email address.');
      return;
    }

    setIsSending(true);
    try {
      const activeId = user?.id || user?.user_id || 1;
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeId,
          template_id: selectedTemplate?.template_id,
          recipient_email: targetEmail,
          recipient_name: customRecipientName || selectedRecipient?.full_name,
          course_code: formVariables['course_code'],
          subject: renderedSubject,
          body_content: renderedBody,
          category: selectedTemplate?.category || 'general',
          variables: formVariables,
          attachments: attachments,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchHistory();
        setSentSuccessModal({
          recipient: targetEmail,
          subject: renderedSubject,
          deliveryMode: data.delivery_mode,
          mailToUrl: data.mailToUrl,
        });
        showToast('success', data.message);
      } else {
        showToast('error', data.error || 'Failed to dispatch email.');
      }
    } catch (err) {
      showToast('error', 'Network error while dispatching email.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 transition-all animate-bounceIn ${
            toastMessage.type === 'success'
              ? 'bg-[#002626] text-white border-[#356666]'
              : toastMessage.type === 'error'
              ? 'bg-[#ba1a1a] text-white border-[#ffdad6]'
              : 'bg-[#51625b] text-white border-[#c0c8c7]'
          }`}
        >
          <span className="text-lg">
            {toastMessage.type === 'success' ? '✓' : toastMessage.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* =========================================================
          1. HEADER & ACTION TOOLBAR (Academic Nexus)
          ========================================================= */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#002626] text-white flex items-center justify-center shadow-xs">
            <span className="text-2xl">✉️</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#191c1d] tracking-tight">Structured Email Template Engine</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#d4e7dd] text-[#002626] border border-[#b9cbc2]">
                Module 3 • Faria
              </span>
            </div>
            <p className="text-xs text-[#51625b] mt-0.5">
              Compose university-standard academic emails with dynamic variables, auto-resolved faculty contacts, and delivery audit logs.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              fetchDrafts();
              setIsDraftsOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#51625b] bg-[#edeeef] hover:bg-[#e1e3e4] transition-colors flex items-center gap-1.5"
          >
            <span>💾</span>
            <span>Saved Drafts</span>
            {savedDrafts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#51625b] text-white font-bold">
                {savedDrafts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              fetchHistory();
              setIsHistoryOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#002626] bg-[#e2ede6] hover:bg-[#d0e4d8] transition-colors flex items-center gap-1.5"
          >
            <span>📜</span>
            <span>Delivery Ledger</span>
            {historyLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#002626] text-white font-bold">
                {historyLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================
          2. CATEGORY PILLS & TEMPLATE CAROUSEL
          ========================================================= */}
      <div className="flex flex-col gap-4">
        {/* Category Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Templates', icon: '📂' },
              { id: 'sickness_leave', label: 'Medical & Leaves', icon: '🏥' },
              { id: 'quiz_makeup', label: 'Quizzes & Make-ups', icon: '📝' },
              { id: 'consultation', label: 'Faculty Office Hours', icon: '💬' },
              { id: 'assignment_extension', label: 'Assignment Appeals', icon: '⏳' },
              { id: 'recommendation', label: 'Recommendations', icon: '🎓' },
              { id: 'custom', label: 'General / Custom', icon: '✨' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#002626] text-white shadow-xs'
                    : 'bg-white text-[#51625b] border border-[#e5e7eb] hover:bg-[#f3f4f5]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search email templates..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white border border-[#e5e7eb] focus:border-[#002626] focus:ring-1 focus:ring-[#002626] outline-none text-[#191c1d]"
            />
            <svg
              className="w-4 h-4 text-[#707978] absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredTemplates.map((tpl) => {
            const isSelected = selectedTemplate?.template_id === tpl.template_id;
            return (
              <div
                key={tpl.template_id}
                onClick={() => selectTemplate(tpl)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left ${
                  isSelected
                    ? 'bg-[#e2ede6] border-[#002626] shadow-sm ring-1 ring-[#002626]'
                    : 'bg-white border-[#e5e7eb] hover:border-[#b9cbc2] hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#51625b] font-mono">
                      {tpl.category.replace(/_/g, ' ')}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#002626] animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#191c1d] leading-snug">{tpl.title}</h3>
                  <p className="text-xs text-[#51625b] mt-1 line-clamp-2 leading-relaxed">{tpl.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#d4e7dd]/60 text-[11px] text-[#707978]">
                  <span>{tpl.required_variables.length} Dynamic Fields</span>
                  <span className="font-semibold text-[#002626]">
                    {isSelected ? '✓ Active in Studio' : 'Select Template →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          3. SPLIT-SCREEN EMAIL STUDIO (STUDIO & LIVE PREVIEW)
          ========================================================= */}
      {selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ─────────────────────────────────────────────────────────
              LEFT COLUMN: DYNAMIC FORM & RECIPIENT RESOLVER (5 Cols)
              ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e5e7eb] shadow-xs p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#191c1d] uppercase tracking-wider">
                  1. Configure Variables & Recipient
                </h2>
                <p className="text-xs text-[#51625b]">Auto-populated with your student profile & course details</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#e2ede6] text-[#002626]">
                {selectedTemplate.required_variables.length} slots
              </span>
            </div>

            {/* Recipient Selector (Auto-Matched) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#191c1d] flex items-center justify-between">
                <span>Select Course Instructor / Recipient</span>
                <span className="text-[10px] font-normal text-[#51625b]">Auto-matches course</span>
              </label>
              <select
                value={customRecipientEmail}
                onChange={(e) => handleRecipientSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f8f9fa] border border-[#c0c8c7] rounded-xl focus:border-[#002626] focus:ring-1 focus:ring-[#002626] outline-none text-[#191c1d] font-medium"
              >
                <option value="">-- Choose Instructor or Peer Tutor --</option>
                {recipients.map((r, idx) => (
                  <option key={idx} value={r.email}>
                    [{r.course_code} - Sec {r.section_code}] {r.full_name} ({r.role_label}) — {r.email}
                  </option>
                ))}
              </select>

              {/* Or manual email override */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <label className="text-[10px] font-bold text-[#707978]">Recipient Name</label>
                  <input
                    type="text"
                    value={customRecipientName || formVariables['recipient_name'] || ''}
                    onChange={(e) => {
                      setCustomRecipientName(e.target.value);
                      handleVariableChange('recipient_name', e.target.value);
                    }}
                    placeholder="e.g. Dr. Sarah Chen"
                    className="w-full px-2.5 py-1.5 text-xs bg-[#f8f9fa] border border-[#e5e7eb] rounded-lg focus:border-[#002626] outline-none text-[#191c1d]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#707978]">Recipient Email</label>
                  <input
                    type="email"
                    value={customRecipientEmail}
                    onChange={(e) => setCustomRecipientEmail(e.target.value)}
                    placeholder="sarah.chen@university.edu"
                    className="w-full px-2.5 py-1.5 text-xs bg-[#f8f9fa] border border-[#e5e7eb] rounded-lg focus:border-[#002626] outline-none text-[#191c1d]"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Template Variables Form */}
            <div className="flex flex-col gap-3 pt-2 border-t border-[#f3f4f5]">
              <span className="text-[11px] font-bold text-[#707978] uppercase tracking-wider">
                Template Variables
              </span>

              {selectedTemplate.required_variables
                .filter((v) => !['recipient_name', 'student_email'].includes(v.key))
                .map((v) => (
                  <div key={v.key} className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#191c1d] flex items-center justify-between">
                      <span>{v.label}</span>
                      {v.required && <span className="text-[#ba1a1a] text-[10px] font-bold">*Required</span>}
                    </label>

                    {v.type === 'select_course' ? (
                      <select
                        value={formVariables[v.key] || ''}
                        onChange={(e) => handleVariableChange(v.key, e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#f8f9fa] border border-[#c0c8c7] rounded-xl focus:border-[#002626] focus:ring-1 focus:ring-[#002626] outline-none text-[#191c1d]"
                      >
                        <option value="CSE471">CSE471: Architecture</option>
                        <option value="CS101">CS101: Programming</option>
                        <option value="MAT202">MAT202: Calculus</option>
                      </select>
                    ) : v.type === 'select' ? (
                      <select
                        value={formVariables[v.key] || ''}
                        onChange={(e) => handleVariableChange(v.key, e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#f8f9fa] border border-[#c0c8c7] rounded-xl focus:border-[#002626] focus:ring-1 focus:ring-[#002626] outline-none text-[#191c1d]"
                      >
                        {v.options?.map((opt, i) => (
                          <option key={i} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : v.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={formVariables[v.key] || ''}
                        onChange={(e) => handleVariableChange(v.key, e.target.value)}
                        placeholder={v.placeholder || `Enter ${v.label.toLowerCase()}...`}
                        className="w-full px-3 py-2 text-xs bg-[#f8f9fa] border border-[#c0c8c7] rounded-xl focus:border-[#002626] focus:ring-1 focus:ring-[#002626] outline-none text-[#191c1d] leading-relaxed resize-y"
                      />
                    ) : v.type === 'date' ? (
                      <input
                        type="date"
                        value={formVariables[v.key] || ''}
                        onChange={(e) => handleVariableChange(v.key, e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#f8f9fa] border border-[#c0c8c7] rounded-xl focus:border-[#002626] focus:ring-1 focus:ring-[#002626] outline-none text-[#191c1d]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={formVariables[v.key] || ''}
                        onChange={(e) => handleVariableChange(v.key, e.target.value)}
                        placeholder={v.placeholder || `Enter ${v.label.toLowerCase()}...`}
                        className="w-full px-3 py-2 text-xs bg-[#f8f9fa] border border-[#c0c8c7] rounded-xl focus:border-[#002626] focus:ring-1 focus:ring-[#002626] outline-none text-[#191c1d]"
                      />
                    )}
                  </div>
                ))}
            </div>

            {/* Attachments Section */}
            <div className="flex flex-col gap-2 pt-2 border-t border-[#f3f4f5]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#707978] uppercase tracking-wider">
                  Attachments & Proof Documents
                </span>
                <span className="text-[10px] text-[#51625b]">PDF, PNG, JPG up to 10MB</span>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-[#c0c8c7] hover:border-[#002626] bg-[#f8f9fa] rounded-xl p-3.5 text-center cursor-pointer transition-colors flex flex-col items-center gap-1 group">
                <span className="text-xl group-hover:scale-110 transition-transform">📎</span>
                <span className="text-xs font-bold text-[#191c1d]">Click to attach file or medical certificate</span>
                <span className="text-[10px] text-[#707978]">Attach local file or platform document</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
              </label>

              {/* Attachment Pill List */}
              {attachments.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#e2ede6] border border-[#c0c8c7] text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span>📄</span>
                        <span className="font-semibold text-[#002626] truncate">{att.name}</span>
                        <span className="text-[10px] text-[#51625b] font-mono">({att.size})</span>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-[#ba1a1a] hover:text-[#93000a] p-1 font-bold text-xs"
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Footer Action: Save Draft */}
            <div className="pt-2 border-t border-[#f3f4f5] flex justify-end">
              <button
                onClick={handleSaveDraft}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#51625b] hover:text-[#002626] hover:bg-[#edeeef] transition-colors flex items-center gap-1.5"
              >
                <span>💾</span>
                <span>Save Progress as Draft</span>
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────
              RIGHT COLUMN: LIVE EMAIL STUDIO & DISPATCHER (7 Cols)
              ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Live Preview Card */}
            <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-md flex flex-col overflow-hidden">
              {/* Studio Header Bar */}
              <div className="p-4 bg-[#f8f9fa] border-b border-[#e5e7eb] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ba1a1a]" />
                  <div className="w-3 h-3 rounded-full bg-[#ca8a04]" />
                  <div className="w-3 h-3 rounded-full bg-[#15803d]" />
                  <span className="text-xs font-mono font-bold text-[#51625b] ml-2">Live Email Studio</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHighlightVariables(!highlightVariables)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      highlightVariables
                        ? 'bg-[#002626] text-white'
                        : 'bg-[#edeeef] text-[#51625b] hover:bg-[#e1e3e4]'
                    }`}
                  >
                    {highlightVariables ? '✓ Highlighting Variables' : 'Plain View'}
                  </button>
                </div>
              </div>

              {/* Email Envelope Metadata */}
              <div className="p-5 border-b border-[#e5e7eb] flex flex-col gap-2.5 bg-white">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-16 font-bold text-[#707978]">To:</span>
                  <span className="font-semibold text-[#191c1d] bg-[#f3f4f5] px-2.5 py-1 rounded-md border border-[#e5e7eb] font-mono">
                    {customRecipientEmail || selectedRecipient?.email || '(Recipient Email Required)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="w-16 font-bold text-[#707978]">From:</span>
                  <span className="text-[#51625b] font-mono">
                    {formVariables['student_name'] || user?.name || 'Arian Kabir'} &lt;
                    {formVariables['student_email'] || user?.email || 'arian.kabir@university.edu'}&gt;
                  </span>
                </div>

                <div className="flex items-start gap-2 text-xs pt-1 border-t border-[#f3f4f5]">
                  <span className="w-16 font-bold text-[#707978] pt-0.5">Subject:</span>
                  <span className="font-bold text-[#191c1d] text-sm leading-snug">{renderedSubject}</span>
                </div>
              </div>

              {/* Rendered Email Body */}
              <div className="p-6 bg-white min-h-[340px] text-xs md:text-sm text-[#191c1d] leading-relaxed whitespace-pre-wrap font-sans selection:bg-[#d4e7dd]">
                {renderedBody}
              </div>

              {/* Attachments Preview in Email */}
              {attachments.length > 0 && (
                <div className="p-4 bg-[#f8f9fa] border-t border-[#e5e7eb] flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#707978]">Attachments ({attachments.length}):</span>
                  {attachments.map((att, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[#e2ede6] text-[#002626] border border-[#c0c8c7] flex items-center gap-1"
                    >
                      <span>📎</span>
                      <span>{att.name}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Studio Dispatch Toolbar */}
              <div className="p-4 bg-[#f8f9fa] border-t border-[#e5e7eb] flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#191c1d] bg-white border border-[#c0c8c7] hover:bg-[#f3f4f5] transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>{copyFeedback ? '✓' : '📋'}</span>
                    <span>{copyFeedback ? 'Copied!' : 'Copy Subject & Body'}</span>
                  </button>

                  <a
                    href={mailToUrl}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#51625b] bg-white border border-[#c0c8c7] hover:bg-[#f3f4f5] transition-colors flex items-center gap-1.5 shadow-xs"
                    title="Launch native mail app (Outlook, Apple Mail, etc.)"
                  >
                    <span>✉️</span>
                    <span>Open in Mail App</span>
                  </a>
                </div>

                <button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#002626] hover:bg-[#003d3d] transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Send Email via In-App Engine</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          4. SUCCESS CONFIRMATION MODAL
          ========================================================= */}
      {sentSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#002626]/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-[#c0c8c7] max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-[#d4e7dd] text-[#002626] flex items-center justify-center text-2xl shadow-xs">
              ✓
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#191c1d]">Communication Successfully Dispatched</h3>
              <p className="text-xs text-[#51625b] mt-1">
                Your structured email has been prepared and logged into the university communication ledger.
              </p>
            </div>

            <div className="bg-[#f8f9fa] rounded-xl p-4 border border-[#e5e7eb] flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#707978]">Recipient:</span>
                <span className="font-bold text-[#191c1d]">{sentSuccessModal.recipient}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#707978]">Subject:</span>
                <span className="font-bold text-[#191c1d] truncate max-w-[280px]">
                  {sentSuccessModal.subject}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#707978]">Delivery Engine:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e2ede6] text-[#002626]">
                  {sentSuccessModal.deliveryMode.toUpperCase()} API
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f3f4f5]">
              <a
                href={sentSuccessModal.mailToUrl}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#51625b] bg-[#f3f4f5] hover:bg-[#e7e8e9] transition-colors flex items-center gap-1"
              >
                <span>✉️</span>
                <span>Open in Desktop Mail</span>
              </a>
              <button
                onClick={() => setSentSuccessModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#002626] hover:bg-[#003d3d] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          5. DRAWERS FOR HISTORY AND DRAFTS
          ========================================================= */}
      <EmailHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        logs={historyLogs}
        isLoading={isLoadingHistory}
        onRefresh={fetchHistory}
      />

      <EmailDraftsDrawer
        isOpen={isDraftsOpen}
        onClose={() => setIsDraftsOpen(false)}
        drafts={savedDrafts}
        isLoading={isLoadingDrafts}
        onRestoreDraft={handleRestoreDraft}
        onDeleteDraft={async (draftId) => {
          await fetch(`/api/emails/drafts?draftId=${draftId}`, { method: 'DELETE' });
          fetchDrafts();
          showToast('info', 'Draft deleted.');
        }}
      />
    </div>
  );
}
