// frontend/app/chat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ChatRoom from '@/components/chatrooms';
import { chatApi } from '@/lib/chat-client';

interface ChatRoomData {
  room_id: number;
  room_name: string;
  section_id: number;
  last_message?: string;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoomData[]>([]);
  const [selectedRoom, setSelectedRoom] =
    useState<ChatRoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Temporary user ID for testing.
  // Replace this with the authenticated user's ID later.
  const userId = 1;

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await chatApi.getRooms(userId);

        if (Array.isArray(data)) {
          setRooms(data);

          if (data.length > 0) {
            setSelectedRoom(data[0]);
          }
        } else {
          setRooms([]);
          setError('Unable to load chat rooms.');
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError('Unable to load chat rooms. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [userId]);

  if (loading) {
    return (
      <div className="chat-loading-screen">
        <div className="chat-loading-card">
          <div className="chat-spinner" />
          <p>Loading your chats...</p>
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
    <div className="chat-page">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div>
            <p className="chat-eyebrow">Communication</p>
            <h1 className="chat-title">Chats</h1>
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
              <div className="chat-empty-icon">💬</div>

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
                  selectedRoom?.room_id === room.room_id;

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
            <div className="chat-room-header">
              <div className="chat-room-header-info">
                <div className="chat-header-icon">
                  💬
                </div>

                <div>
                  <h2>{selectedRoom.room_name}</h2>

                  <p>
                    Section {selectedRoom.section_id}
                  </p>
                </div>
              </div>

              <div className="chat-connection-status">
                <span className="chat-online-dot" />
                Active
              </div>
            </div>

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
  );
}