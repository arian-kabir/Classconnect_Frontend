// src/components/StudyScheduler/DeadlineAlertCenter.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface DeadlineReminderItem {
  reminder_id?: number;
  assignment_id?: number;
  session_id?: number;
  title: string;
  course_code?: string;
  message: string;
  due_at: string;
  hours_left: number;
  urgency: 'urgent' | 'approaching' | 'upcoming' | 'overdue';
  is_dismissed: boolean;
  submission_link?: string;
}

interface DeadlineAlertCenterProps {
  onScheduleForDeadline?: (deadline: DeadlineReminderItem) => void;
  compact?: boolean;
}

export default function DeadlineAlertCenter({
  onScheduleForDeadline,
  compact = false,
}: DeadlineAlertCenterProps) {
  const [reminders, setReminders] = useState<DeadlineReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(!compact);

  const fetchReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/reminders?userId=1&_t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to fetch deadline alerts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setReminders(data);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleDismiss = async (item: DeadlineReminderItem) => {
    const itemKey = item.reminder_id ? `r-${item.reminder_id}` : `a-${item.assignment_id}`;
    setDismissedIds((prev) => new Set(prev).add(itemKey));

    if (item.reminder_id) {
      try {
        await fetch('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'dismiss',
            userId: 1,
            reminderId: item.reminder_id,
          }),
        });
      } catch (e) {
        console.error('Dismiss API error:', e);
      }
    }
  };

  const activeReminders = reminders.filter((r) => {
    const key = r.reminder_id ? `r-${r.reminder_id}` : `a-${r.assignment_id}`;
    return !dismissedIds.has(key) && !r.is_dismissed;
  });

  if (isLoading) {
    return (
      <div className="bg-[#f0f4f2] border border-[#d2dfd8] rounded-xl p-4 animate-pulse flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-[#002626]/40" />
        <div className="h-4 bg-[#c2d5cb] rounded w-64" />
      </div>
    );
  }

  if (activeReminders.length === 0) {
    return null;
  }

  const urgentCount = activeReminders.filter((r) => r.urgency === 'urgent' || r.urgency === 'overdue').length;

  return (
    <section aria-label="Academic Deadline & Assignment Reminders" className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#51625b]">
            Remainder & Deadline Alert Board
          </h2>
          {urgentCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 animate-pulse">
              {urgentCount} URGENT
            </span>
          )}
        </div>

        {compact && activeReminders.length > 1 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-[#002626] hover:underline flex items-center gap-1"
          >
            <span>{isExpanded ? 'Show Less' : `View All (${activeReminders.length})`}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {(isExpanded ? activeReminders : activeReminders.slice(0, 1)).map((reminder, idx) => {
          const isUrgent = reminder.urgency === 'urgent' || reminder.urgency === 'overdue';
          const isApproaching = reminder.urgency === 'approaching';
          const uniqueKey = reminder.reminder_id
            ? `reminder-${reminder.reminder_id}`
            : reminder.assignment_id
            ? `assignment-${reminder.assignment_id}`
            : `deadline-idx-${idx}`;

          return (
            <div
              key={uniqueKey}
              className={`rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all ${
                isUrgent
                  ? 'bg-red-50/90 border-red-200 text-red-950 shadow-sm'
                  : isApproaching
                  ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                  : 'bg-[#ebeded] border-[#d9dadb] text-[#191c1d]'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${
                    isUrgent
                      ? 'bg-red-600 animate-ping'
                      : isApproaching
                      ? 'bg-amber-500'
                      : 'bg-[#002626]'
                  }`}
                />
                <div className="text-sm">
                  <span className="font-bold">{reminder.title}:</span>{' '}
                  <span className="opacity-90 font-medium">{reminder.message}</span>
                  {reminder.hours_left !== undefined && (
                    <span
                      className={`ml-2 inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-md ${
                        isUrgent
                          ? 'bg-red-200 text-red-900'
                          : isApproaching
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-[#d0e4d8] text-[#002626]'
                      }`}
                    >
                      {reminder.hours_left <= 0
                        ? 'Overdue'
                        : reminder.hours_left <= 24
                        ? `⏳ ${reminder.hours_left}h left`
                        : `⏳ ${Math.round(reminder.hours_left / 24)}d left`}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                {onScheduleForDeadline && (
                  <button
                    onClick={() => onScheduleForDeadline(reminder)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                      isUrgent
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-[#002626] text-white hover:bg-[#044343]'
                    }`}
                    title="Quick schedule a dedicated study block for this deadline"
                  >
                    <span>⚡</span>
                    <span>Plan Study Session</span>
                  </button>
                )}

                <button
                  onClick={() => handleDismiss(reminder)}
                  className="text-gray-500 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-black/5"
                  aria-label="Dismiss remainder alert"
                  title="Dismiss alert"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
