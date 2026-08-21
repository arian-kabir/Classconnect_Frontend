// src/components/StudyScheduler/StudySessionModal.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
}

interface StudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionCreated: () => void;
  initialDay?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialTitle?: string;
  initialCourseCode?: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const PRESET_COLORS = [
  { name: 'Deep Teal', hex: '#002626' },
  { name: 'Sage Forest', hex: '#044343' },
  { name: 'Muted Slate', hex: '#51625b' },
  { name: 'Charcoal', hex: '#2d3748' },
  { name: 'Crimson Focus', hex: '#991b1b' },
];

export default function StudySessionModal({
  isOpen,
  onClose,
  onSessionCreated,
  initialDay = 'Monday',
  initialStartTime = '14:00',
  initialEndTime = '15:30',
  initialTitle = '',
  initialCourseCode = '',
}: StudySessionModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState(initialDay);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [colorTag, setColorTag] = useState('#002626');

  // Conflict Checking State
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictState, setConflictState] = useState<{
    hasConflict: boolean;
    conflictType: string;
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync initial values when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      if (initialTitle) setTitle(initialTitle);
      if (initialDay) setDayOfWeek(initialDay);
      if (initialStartTime) setStartTime(initialStartTime);
      if (initialEndTime) setEndTime(initialEndTime);
      setSubmitError(null);
    }
  }, [isOpen, initialDay, initialStartTime, initialEndTime, initialTitle]);

  // Load available courses
  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses(data);
          if (initialCourseCode) {
            const matched = data.find((c) => c.course_code === initialCourseCode);
            if (matched) setCourseId(matched.course_id.toString());
          }
        }
      })
      .catch((err) => console.error('Failed to load courses:', err));
  }, [initialCourseCode]);

  // Live Conflict Evaluation with debounce
  useEffect(() => {
    if (!isOpen || !dayOfWeek || !startTime || !endTime) return;

    const timer = setTimeout(async () => {
      try {
        setIsCheckingConflict(true);
        const res = await fetch('/api/study-scheduler/check-conflict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 1,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
          }),
        });
        const data = await res.json();
        setConflictState(data);
      } catch (err) {
        console.error('Conflict check error:', err);
      } finally {
        setIsCheckingConflict(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, dayOfWeek, startTime, endTime]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, forceAllow = false) => {
    e.preventDefault();
    setSubmitError(null);

    if (!title.trim()) {
      setSubmitError('Please enter a session title or study topic.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/study-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          course_id: courseId ? parseInt(courseId, 10) : null,
          title: title.trim(),
          description: description.trim(),
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          priority,
          color_tag: colorTag,
          allow_conflict: forceAllow,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.conflict) {
          setSubmitError(`Collision Alert: ${data.message}`);
          return;
        }
        throw new Error(data.error || 'Failed to save study session');
      }

      onSessionCreated();
      onClose();
    } catch (err: any) {
      console.error('Error submitting study session:', err);
      setSubmitError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#c0c8c7] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#002626] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⏱️</span>
            <div>
              <h2 className="font-bold text-base tracking-tight">Schedule Custom Study Session</h2>
              <p className="text-xs text-[#a2b5af]">Place focused study blocks seamlessly around your class routine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 overflow-y-auto flex flex-col gap-4">
          {/* Live Conflict Warning / Status Pill */}
          {conflictState && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 transition-all ${
                conflictState.hasConflict
                  ? 'bg-rose-50 border border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              }`}
            >
              <span className="text-base flex-shrink-0">
                {conflictState.hasConflict ? '⚠️' : '✅'}
              </span>
              <div className="flex-1">
                <p className="font-bold">
                  {conflictState.hasConflict ? 'Timetable Collision Detected' : 'Open Study Window Clear'}
                </p>
                <p className="mt-0.5 opacity-90">{conflictState.message}</p>
              </div>
              {isCheckingConflict && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {submitError}
            </div>
          )}

          {/* Session Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#51625b] mb-1.5">
              Study Session / Topic Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CS201 Binary Search Trees Practice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#d9dadb] rounded-xl text-sm font-medium text-[#191c1d] focus:ring-2 focus:ring-[#002626] focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Course Association */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#51625b] mb-1.5">
              Associated Course (Optional)
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#d9dadb] rounded-xl text-sm font-medium text-[#191c1d] focus:ring-2 focus:ring-[#002626] outline-none"
            >
              <option value="">-- General / Independent Study --</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_code}: {c.course_name}
                </option>
              ))}
            </select>
          </div>

          {/* Day of the Week */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#51625b] mb-1.5">
              Day of the Week <span className="text-red-500">*</span>
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#d9dadb] rounded-xl text-sm font-medium text-[#191c1d] focus:ring-2 focus:ring-[#002626] outline-none"
              required
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#51625b] mb-1.5">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#d9dadb] rounded-xl text-sm font-medium text-[#191c1d] focus:ring-2 focus:ring-[#002626] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#51625b] mb-1.5">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#d9dadb] rounded-xl text-sm font-medium text-[#191c1d] focus:ring-2 focus:ring-[#002626] outline-none"
              />
            </div>
          </div>

          {/* Priority & Color Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#51625b] mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#d9dadb] rounded-xl text-sm font-medium text-[#191c1d] focus:ring-2 focus:ring-[#002626] outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">🔥 Urgent Exam / Deadline</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#51625b] mb-1.5">
                Color Tag
              </label>
              <div className="flex items-center gap-2 pt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setColorTag(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      colorTag === color.hex ? 'ring-2 ring-offset-2 ring-[#002626] scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description & Study Goals */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#51625b] mb-1.5">
              Study Notes & Objectives
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Read lecture slides 1-35, solve tutorial problems 4 and 5."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#f8f9fa] border border-[#d9dadb] rounded-xl text-sm font-medium text-[#191c1d] focus:ring-2 focus:ring-[#002626] outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-end gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#51625b] hover:bg-[#ebeded] transition-colors"
            >
              Cancel
            </button>

            {conflictState?.hasConflict && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors"
                title="Override conflict warning and force save"
              >
                Force Schedule
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (conflictState?.hasConflict && conflictState.conflictType === 'invalid_range')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#002626] hover:bg-[#044343] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Session...</span>
                </>
              ) : (
                <span>Save Study Session</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
