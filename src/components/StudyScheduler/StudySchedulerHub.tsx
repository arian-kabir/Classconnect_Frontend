// src/components/StudyScheduler/StudySchedulerHub.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import StudySessionModal from './StudySessionModal';
import DeadlineAlertCenter, { DeadlineReminderItem } from './DeadlineAlertCenter';

interface ClassItem {
  type: 'class';
  id: number;
  course_code: string;
  course_name: string;
  section_code: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number: string;
  teacher_name: string;
}

interface StudyItem {
  type: 'study_session';
  id: number;
  course_id?: number | null;
  course_code: string;
  course_name: string;
  title: string;
  description?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'completed' | 'skipped';
  duration_minutes: number;
  color_tag: string;
}

interface FreeGapItem {
  type: 'free_slot';
  day_of_week: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  label: string;
}

interface DaySchedule {
  day_of_week: string;
  items: (ClassItem | StudyItem)[];
  free_slots: FreeGapItem[];
  total_class_minutes: number;
  total_study_minutes: number;
  total_free_minutes: number;
}

interface SchedulerResponse {
  days: Record<string, DaySchedule>;
  stats: {
    totalClassHours: number;
    totalStudyHours: number;
    totalFreeHours: number;
    studySessionCount: number;
    classCount: number;
  };
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

export default function StudySchedulerHub() {
  const [data, setData] = useState<SchedulerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [filterView, setFilterView] = useState<'all' | 'classes' | 'study'>('all');

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState<{
    day?: string;
    startTime?: string;
    endTime?: string;
    title?: string;
    courseCode?: string;
  }>({});

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data: session } = useSession();
  const user = session?.user as any;
  const activeUserId = user?.id || user?.user_id || 9;
  const activeEmail = user?.email || undefined;

  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const query = activeEmail ? `email=${encodeURIComponent(activeEmail)}` : `userId=${activeUserId}`;
      const res = await fetch(`/api/study-scheduler?${query}&_t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to load study schedule');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error loading schedule:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId, activeEmail]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenModal = (preset?: {
    day?: string;
    startTime?: string;
    endTime?: string;
    title?: string;
    courseCode?: string;
  }) => {
    setModalInitialData(preset || { day: selectedDay });
    setIsModalOpen(true);
  };

  const handleScheduleForDeadline = (deadline: DeadlineReminderItem) => {
    handleOpenModal({
      day: selectedDay,
      title: `Assignment Prep: ${deadline.title}`,
      courseCode: deadline.course_code,
      startTime: '16:00',
      endTime: '17:30',
    });
  };

  const handleToggleSessionStatus = async (sessionItem: StudyItem) => {
    const nextStatus = sessionItem.status === 'completed' ? 'scheduled' : 'completed';
    try {
      const res = await fetch('/api/study-scheduler', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          email: activeEmail,
          sessionId: sessionItem.id,
          status: nextStatus,
        }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(nextStatus === 'completed' ? '🎉 Study session marked complete!' : 'Study session set to scheduled.');
      fetchSchedule();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!confirm('Remove this scheduled study session?')) return;
    try {
      const query = activeEmail ? `email=${encodeURIComponent(activeEmail)}` : `userId=${activeUserId}`;
      const res = await fetch(`/api/study-scheduler?${query}&sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete session');
      showToast('Study session removed.');
      fetchSchedule();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatPrettyTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hStr, mStr] = timeStr.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
    } catch {
      return timeStr.slice(0, 5);
    }
  };

  const currentDayData = data?.days?.[selectedDay] || {
    day_of_week: selectedDay,
    items: [],
    free_slots: [],
    total_class_minutes: 0,
    total_study_minutes: 0,
    total_free_minutes: 0,
  };

  const filteredItems = currentDayData.items.filter((item) => {
    if (filterView === 'classes') return item.type === 'class';
    if (filterView === 'study') return item.type === 'study_session';
    return true;
  });

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#002626] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-slideUp">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP DEADLINE REMINDER BANNER */}
      <DeadlineAlertCenter onScheduleForDeadline={handleScheduleForDeadline} compact={false} />

      {/* 2. STATS & ANALYTICS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Class Load */}
        <div className="bg-white rounded-2xl p-5 border border-[#e5e7eb] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#707978]">Class Hours</p>
            <p className="text-2xl font-black text-[#191c1d] mt-1">
              {data?.stats?.totalClassHours || 0} <span className="text-xs font-semibold text-[#707978]">hrs/wk</span>
            </p>
            <p className="text-[11px] text-[#51625b] mt-0.5">{data?.stats?.classCount || 0} scheduled classes</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#e2ede6] text-[#002626] flex items-center justify-center text-xl font-bold">
            🎓
          </div>
        </div>

        {/* Metric 2: Study Sessions */}
        <div className="bg-white rounded-2xl p-5 border border-[#e5e7eb] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#707978]">Study Sessions</p>
            <p className="text-2xl font-black text-[#002626] mt-1">
              {data?.stats?.totalStudyHours || 0} <span className="text-xs font-semibold text-[#707978]">hrs/wk</span>
            </p>
            <p className="text-[11px] text-[#51625b] mt-0.5">{data?.stats?.studySessionCount || 0} active study blocks</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#002626] text-white flex items-center justify-center text-xl font-bold">
            ⏱️
          </div>
        </div>

        {/* Metric 3: Open Study Windows */}
        <div className="bg-white rounded-2xl p-5 border border-[#e5e7eb] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#707978]">Free Gap Slots</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {data?.stats?.totalFreeHours || 0} <span className="text-xs font-semibold text-[#707978]">hrs free</span>
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Available for focused prep</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl font-bold">
            💡
          </div>
        </div>

        {/* Metric 4: Quick Action CTA */}
        <div className="bg-gradient-to-br from-[#002626] to-[#044343] rounded-2xl p-5 text-white shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#a2b5af]">Study Engine</p>
            <p className="text-sm font-bold mt-0.5">Contextual Scheduler</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="w-full mt-3 py-2 px-3 bg-white text-[#002626] hover:bg-[#e2ede6] font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>➕</span>
            <span>Schedule Study Session</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTEXTUAL SCHEDULER BOARD */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden flex flex-col">
        {/* Header & Controls */}
        <div className="p-6 border-b border-[#e5e7eb] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#fbfcfc]">
          <div>
            <h2 className="text-lg font-bold text-[#191c1d] tracking-tight flex items-center gap-2">
              <span>📅</span>
              <span>Weekly Academic Routine & Study Matrix</span>
            </h2>
            <p className="text-xs text-[#707978] mt-0.5">
              Live collision-guarded schedule synchronizing university lecture routine with your self-directed study blocks
            </p>
          </div>

          {/* View Filter Switcher */}
          <div className="flex items-center gap-2 bg-[#ebeded] p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setFilterView('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterView === 'all' ? 'bg-white text-[#002626] shadow-sm' : 'text-[#51625b] hover:text-[#191c1d]'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterView('classes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterView === 'classes' ? 'bg-white text-[#002626] shadow-sm' : 'text-[#51625b] hover:text-[#191c1d]'
              }`}
            >
              Classes Only
            </button>
            <button
              onClick={() => setFilterView('study')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterView === 'study' ? 'bg-white text-[#002626] shadow-sm' : 'text-[#51625b] hover:text-[#191c1d]'
              }`}
            >
              Study Sessions
            </button>
          </div>
        </div>

        {/* 7-DAY NAVIGATION TABS */}
        <div className="flex border-b border-[#e5e7eb] overflow-x-auto scrollbar-none bg-[#f8f9fa]">
          {DAYS_OF_WEEK.map((day) => {
            const dayMeta = data?.days?.[day];
            const isCurrent = selectedDay === day;
            const classCount = dayMeta?.items.filter((i) => i.type === 'class').length || 0;
            const studyCount = dayMeta?.items.filter((i) => i.type === 'study_session').length || 0;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 min-w-[120px] py-3.5 px-4 text-center border-b-2 transition-all relative ${
                  isCurrent
                    ? 'border-[#002626] bg-white text-[#002626] font-bold'
                    : 'border-transparent text-[#707978] hover:text-[#191c1d] hover:bg-[#f3f4f5] font-medium'
                }`}
              >
                <p className="text-xs uppercase tracking-wider">{day.slice(0, 3)}</p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  {classCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#002626]" title={`${classCount} classes`} />
                  )}
                  {studyCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600" title={`${studyCount} study sessions`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* DAY TIMELINE & SLOTS DISPLAY */}
        <div className="p-6 flex flex-col gap-5 min-h-[400px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#51625b] flex items-center gap-2">
              <span>{selectedDay} Schedule</span>
              <span className="text-xs font-normal text-[#707978]">
                ({Math.round(currentDayData.total_class_minutes / 60)}h classes · {Math.round(currentDayData.total_study_minutes / 60)}h study)
              </span>
            </h3>

            <button
              onClick={() => handleOpenModal({ day: selectedDay })}
              className="text-xs font-bold text-[#002626] bg-[#e2ede6] hover:bg-[#d0e4d8] px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <span>➕</span>
              <span>Add Study Session</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-[#002626] border-t-transparent animate-spin" />
              <p className="text-xs font-medium text-[#707978]">Loading contextual timeline...</p>
            </div>
          ) : filteredItems.length === 0 && currentDayData.free_slots.length === 0 ? (
            <div className="py-16 text-center text-[#707978] flex flex-col items-center justify-center">
              <span className="text-3xl mb-2">🌴</span>
              <p className="font-semibold text-sm">No classes or study sessions scheduled for {selectedDay}.</p>
              <button
                onClick={() => handleOpenModal({ day: selectedDay })}
                className="mt-3 px-4 py-2 bg-[#002626] text-white text-xs font-bold rounded-xl hover:bg-[#044343] transition-colors"
              >
                Plan First Study Session
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Chronological Unified Timeline */}
              {filteredItems.map((item) => {
                if (item.type === 'class') {
                  return (
                    <div
                      key={`class-${item.id}`}
                      className="bg-white border-l-4 border-l-[#002626] border border-[#e5e7eb] rounded-xl p-5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#e2ede6] text-[#002626] flex items-center justify-center font-bold text-lg flex-shrink-0">
                          🎓
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-[#002626] text-white text-xs font-extrabold rounded-md uppercase tracking-wider">
                              {item.course_code}
                            </span>
                            <span className="text-xs font-bold text-[#51625b]">
                              Section {item.section_code}
                            </span>
                            <span className="text-[10px] font-semibold bg-[#ebeded] text-[#51625b] px-2 py-0.5 rounded-full">
                              University Lecture
                            </span>
                          </div>
                          <h4 className="font-bold text-[#191c1d] text-base mt-1">{item.course_name}</h4>
                          <p className="text-xs text-[#707978] mt-0.5 flex items-center gap-2">
                            <span>👤 {item.teacher_name}</span>
                            <span>·</span>
                            <span>📍 Room {item.room_number}</span>
                          </p>
                        </div>
                      </div>

                      <div className="sm:text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#191c1d]">
                          {formatPrettyTime(item.start_time)} - {formatPrettyTime(item.end_time)}
                        </p>
                        <p className="text-xs font-semibold text-[#002626] mt-0.5">🔒 Routine Slot</p>
                      </div>
                    </div>
                  );
                }

                // Study Session Card
                const isCompleted = item.status === 'completed';
                return (
                  <div
                    key={`study-${item.id}`}
                    style={{ borderLeftColor: item.color_tag || '#044343' }}
                    className={`bg-white border-l-4 border border-[#e5e7eb] rounded-xl p-5 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCompleted ? 'opacity-70 bg-[#f9fafb]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggleSessionStatus(item)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-all flex-shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                        title={isCompleted ? 'Mark as scheduled' : 'Mark as completed'}
                      >
                        {isCompleted ? '✓' : '⏱️'}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            style={{ backgroundColor: item.color_tag || '#002626' }}
                            className="px-2.5 py-0.5 text-white text-xs font-extrabold rounded-md uppercase tracking-wider"
                          >
                            {item.course_code}
                          </span>

                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              item.priority === 'urgent'
                                ? 'bg-red-100 text-red-800'
                                : item.priority === 'high'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-50 text-blue-800'
                            }`}
                          >
                            {item.priority}
                          </span>

                          {isCompleted && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              ✓ Completed
                            </span>
                          )}
                        </div>

                        <h4 className={`font-bold text-base mt-1 ${isCompleted ? 'line-through text-gray-500' : 'text-[#191c1d]'}`}>
                          {item.title}
                        </h4>

                        {item.description && (
                          <p className="text-xs text-[#51625b] mt-0.5 max-w-xl">{item.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 flex-shrink-0">
                      <div>
                        <p className="text-sm font-bold text-[#191c1d]">
                          {formatPrettyTime(item.start_time)} - {formatPrettyTime(item.end_time)}
                        </p>
                        <p className="text-xs text-[#707978] sm:text-right mt-0.5">
                          {item.duration_minutes} mins focus block
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={() => handleToggleSessionStatus(item)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#ebeded] text-[#191c1d] hover:bg-[#dbe0de] transition-colors"
                        >
                          {isCompleted ? 'Undo' : 'Complete'}
                        </button>
                        <button
                          onClick={() => handleDeleteSession(item.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete study session"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}


            </div>
          )}
        </div>
      </div>

      {/* MODAL DIALOG */}
      <StudySessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSessionCreated={() => {
          showToast('Study session added to your schedule!');
          fetchSchedule();
        }}
        initialDay={modalInitialData.day}
        initialStartTime={modalInitialData.startTime}
        initialEndTime={modalInitialData.endTime}
        initialTitle={modalInitialData.title}
        initialCourseCode={modalInitialData.courseCode}
      />
    </div>
  );
}
