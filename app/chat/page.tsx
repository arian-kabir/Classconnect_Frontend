// frontend/app/chat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

import ChatRoom from '@/components/chatrooms';
import { chatApi } from '@/lib/chat-client';

interface ChatRoomData {
  room_id: number;
  room_name: string;
  section_id: number;
  last_message?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();

  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [selectedRoom, setSelectedRoom] =
    useState<ChatRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('Chat');

  // const userId = 1;
  const userId = session?.user?.id
    ? Number(session.user.id)
    : null;

  const userName =
    session?.user?.name || 'User';

  const userRole =
    (session?.user as any)?.role || 'Student';

  const userImage =
    session?.user?.image || null;

  /*
   * Load chat rooms belonging to the logged-in user.
   */
  useEffect(() => {
    if (!userId) {
      if (status !== 'loading') {
        setLoading(false);
      }
      return;
    }

    const loadRooms = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await chatApi.getRooms(userId);

        if (Array.isArray(data)) {
          setRooms(data);

          if (data.length > 0) {
            setSelectedRoom(data[0]);
          } else {
            setSelectedRoom(null);
          }
        } else {
          setRooms([]);
          setSelectedRoom(null);
          setError('Unable to load chat rooms.');
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError(
          'Unable to load chat rooms. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [userId, status]);

  /*
   * Wait for NextAuth to finish loading before showing
   * the page.
   */
  if (status === 'loading' || loading) {
    return (
      <div className="chat-loading-screen">
        <div className="chat-loading-card">
          <div className="chat-spinner" />
          <p>Loading your chats...</p>
        </div>
      </div>
    );
  }

  /*
   * If there is no authenticated user, don't attempt to
   * call the chat API with a fake ID.
   *
   * Keep the temporary user ID above available for testing.
   */
  if (!userId) {
    return (
      <div className="chat-loading-screen">
        <div className="chat-error-card">
          <div className="chat-error-icon">!</div>

          <h2>Authentication required</h2>

          <p>
            Please sign in before accessing chat.
          </p>

          <Link
            href="/auth/login"
            className="chat-retry-button"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-loading-screen">
        <div className="chat-error-card">
          <div className="chat-error-icon">!</div>

          <h2>Unable to load chats</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="chat-retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* ======================================================
          TOP NAVIGATION HEADER
          ====================================================== */}

      <header className="h-16 px-8 bg-white border-b border-[#e5e7eb] flex items-center justify-between sticky top-0 z-20">

        <div className="flex items-center gap-8">
          <h1 className="font-bold text-base md:text-lg text-[#191c1d] tracking-tight">
            ClassConnect: Academic Portal
          </h1>
        </div>

        <div className="flex items-center gap-6">

          <nav className="flex items-center gap-5">

            <button
              onClick={() => setActiveTab('Routine')}
              className={`relative py-5 text-sm font-semibold transition-colors ${
                activeTab === 'Routine'
                  ? 'text-[#191c1d]'
                  : 'text-[#707978] hover:text-[#191c1d]'
              }`}
            >
              Routine

              {activeTab === 'Routine' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#002626]" />
              )}
            </button>

            <Link
              href="/chat"
              onClick={() => setActiveTab('Chat')}
              className={`relative py-5 text-sm font-semibold transition-colors ${
                activeTab === 'Chat'
                  ? 'text-[#191c1d]'
                  : 'text-[#707978] hover:text-[#191c1d]'
              }`}
            >
              Chat
            </Link>
          </nav>

          {/* Profile */}
          <div className="flex items-center gap-4 pl-4 border-l border-[#e5e7eb]">

            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#191c1d] leading-none">
                {userName}
              </p>

              <p className="text-xs text-[#707978] mt-1">
                {userRole}
              </p>
            </div>

            {userImage ? (
              <img
                src={userImage}
                alt={userName}
                className="w-9 h-9 rounded-full border border-[#c0c8c7] object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#dbe5df] border border-[#c0c8c7] flex items-center justify-center text-sm font-bold text-[#002626]">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}

            <button
              onClick={() =>
                signOut({
                  callbackUrl: '/auth/login'
                })
              }
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#dc2626] bg-[#fee2e2] hover:bg-[#fecaca] transition-colors"
              title="Sign out of ClassConnect"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>

              Logout
            </button>

          </div>
        </div>
      </header>

      {/* ======================================================
          CHAT PAGE
          ====================================================== */}

      <div className="chat-page">

        {/* Sidebar */}
        <aside className="chat-sidebar">

          <div className="chat-sidebar-header">
            <div>
              <p className="chat-eyebrow">
                Communication
              </p>

              <h1 className="chat-title">
                Chats
              </h1>
            </div>

            <div className="chat-room-count">
              {rooms.length}
            </div>
          </div>

          <div className="chat-room-section">

            <div className="chat-section-heading">
              <span>Rooms</span>

              <span className="chat-section-count">
                {rooms.length}
              </span>
            </div>

            {rooms.length === 0 ? (
              <div className="chat-empty-rooms">
                <div className="chat-empty-icon">
                  💬
                </div>

                <h3>No chat rooms</h3>

                <p>
                  There are currently no chat rooms
                  available for you.
                </p>
              </div>
            ) : (
              <div className="chat-room-list">

                {rooms.map((room) => {
                  const isSelected =
                    selectedRoom?.room_id ===
                    room.room_id;

                  return (
                    <button
                      key={room.room_id}
                      type="button"
                      onClick={() =>
                        setSelectedRoom(room)
                      }
                      className={`chat-room-card ${
                        isSelected
                          ? 'chat-room-card-selected'
                          : ''
                      }`}
                    >
                      <div className="chat-room-icon">
                        💬
                      </div>

                      <div className="chat-room-info">

                        <div className="chat-room-name">
                          {room.room_name}
                        </div>

                        <div className="chat-room-preview">
                          {room.last_message ||
                            'No messages yet'}
                        </div>

                      </div>

                      {isSelected && (
                        <div className="chat-room-active-dot" />
                      )}

                    </button>
                  );
                })}

              </div>
            )}

          </div>

          <div className="chat-sidebar-footer">
            <span className="chat-online-dot" />
            <span>Chat workspace</span>
          </div>

        </aside>

        {/* Main chat area */}
        <main className="chat-workspace">

          {selectedRoom ? (

            <div className="chat-room-container">

              <div className="chat-room-body">

                <ChatRoom
                  roomId={selectedRoom.room_id}
                  userId={userId}
                  roomName={selectedRoom.room_name}
                />

              </div>

            </div>

          ) : (

            <div className="chat-empty-workspace">

              <div className="chat-empty-workspace-icon">
                💬
              </div>

              <h2>Select a chat room</h2>

              <p>
                Choose a room from the sidebar to start
                chatting with your classmates.
              </p>

            </div>

          )}

        </main>

      </div>

    </div>
  );
}

