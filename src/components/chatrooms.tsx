// frontend/src/components/ChatRooms.tsx
'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useSocket } from '@/hooks/useSocket';
import { chatApi } from '@/lib/chat-client';

interface Message {
  message_id: number;
  message_text: string;
  sender_name: string;
  sender_id: number;
  sent_at: string;
  message_type?: string;
  file_url?: string;
}

interface ChatRoomProps {
  roomId: number;
  userId: number;
  roomName: string;
}

export default function ChatRoom({
  roomId,
  userId,
  roomName,
}: ChatRoomProps) {
  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const {
    socket,
    isConnected,
  } = useSocket(userId);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  /*
   * Reset the chat state whenever
   * the selected room changes.
   */
  useEffect(() => {
    setInput('');
    setMessages([]);
  }, [roomId]);

   /* Load existing messages from the database.*/
  useEffect(() => {
  const fetchMessages = async () => {
    try {
      setLoading(true);

      const data =
        await chatApi.getMessages(
          roomId,
          userId
        );

      const loadedMessages: Message[] =
        Array.isArray(data.messages)
          ? data.messages
              .map((message: Message) => ({
                ...message,
                message_id: Number(
                  message.message_id
                ),
                sender_id: Number(
                  message.sender_id
                ),
              }))
              .sort(
                (a, b) =>
                  new Date(
                    a.sent_at
                  ).getTime() -
                  new Date(
                    b.sent_at
                  ).getTime()
              )
          : [];

      setMessages(loadedMessages);
    } catch (error) {
      console.error(
        'Error fetching messages:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  fetchMessages();
}, [roomId, userId]);

  /*
   * Join the selected Socket.IO room.
   */
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    console.log(
      `Joining chat room ${roomId}`
    );

    socket.emit('join-room', {
      roomId,
      userId,
    });

    return () => {
      console.log(
        `Leaving chat room ${roomId}`
      );

      socket.emit('leave-room', {
        roomId,
        userId,
      });
    };
  }, [
    socket,
    isConnected,
    roomId,
    userId,
  ]);

  /*
   * Listen for incoming messages.
   */
  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleNewMessage = (
  data: { message: Message }
) => {
  if (!data?.message) {
    return;
  }

    const newMessage: Message = {
      ...data.message,
      message_id: Number(
        data.message.message_id
      ),
      sender_id: Number(
        data.message.sender_id
      ),
    };

    setMessages((previous) => [
      ...previous,
      newMessage,
    ]);
  };

    socket.on(
      'new-message',
      handleNewMessage
    );

    return () => {
      socket.off(
        'new-message',
        handleNewMessage
      );
    };
  }, [socket]);

  /*
   * Automatically scroll to the newest message.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  /*
   * Send a normal text message.
   */
  const sendMessage = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const text = input.trim();

    if (
      !text ||
      !socket ||
      !isConnected
    ) {
      return;
    }

    socket.emit('send-message', {
      roomId,
      senderId: userId,
      messageText: text,
    });

    setInput('');
  };

  /*
   * Upload an image/file.
   */
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!socket || !isConnected) {
      console.error(
        'Cannot upload file: socket is offline'
      );

      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append(
        'file',
        file
      );

      formData.append(
        'userId',
        userId.toString()
      );

      formData.append(
        'roomId',
        roomId.toString()
      );

     const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001';

    const response = await fetch(
      `${API_BASE_URL}/api/chat/uploads`,
      {
        method: 'POST',
        body: formData,
      }
    );

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status}`
        );
      }

      const data =
        await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            'File upload failed'
        );
      }

      const isImage =
        file.type.startsWith('image/');

      socket.emit('send-message', {
        roomId,
        senderId: userId,
        messageText: isImage
          ? `[Image] ${file.name}`
          : `[File] ${file.name}`,
        messageType: isImage
          ? 'image'
          : 'file',
        fileUrl:
          data.message.file_url,
      });

    } catch (error) {
      console.error(
        'Upload error:',
        error
      );
    } finally {
      setUploading(false);

      /*
       * Reset the input so selecting
       * the same file again triggers
       * onChange.
       */
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="chat-messages-loading">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="chat-component">

      {/* Messages */}
      <div className="chat-messages">

        {messages.length === 0 ? (
          <div className="chat-no-messages">
            <div className="chat-no-messages-icon">
              💬
            </div>

            <h3>
              No messages yet
            </h3>

            <p>
              Start the conversation
              by sending a message.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const ownMessage =
              Number(msg.sender_id) === Number(userId);

            return (
              <div
                key={msg.message_id}
                className={`chat-message-row ${
                  ownMessage
                    ? 'chat-message-row-own'
                    : ''
                }`}
              >
                <div
                  className={`chat-message ${
                    ownMessage
                      ? 'chat-message-own'
                      : 'chat-message-other'
                  }`}
                >
                  {!ownMessage && (
                    <div className="chat-message-sender">
                      {msg.sender_name}
                    </div>
                  )}

                  {msg.file_url &&
                  msg.message_type ===
                    'image' ? (
                    <div>
                      <img
                        src={msg.file_url}
                        alt={
                          msg.message_text
                        }
                        className="chat-image"
                      />

                      <p className="chat-file-name">
                        {msg.message_text}
                      </p>
                    </div>
                  ) : msg.file_url ? (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="chat-file-link"
                    >
                      <span>
                        📎
                      </span>

                      <span>
                        {msg.message_text}
                      </span>
                    </a>
                  ) : (
                    <p className="chat-message-text">
                      {msg.message_text}
                    </p>
                  )}

                  <div className="chat-message-time">
                    {new Date(
                      msg.sent_at
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={sendMessage}
        className="chat-composer"
      >
        <button
          type="button"
          className="chat-attachment-button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={
            !isConnected ||
            uploading
          }
          title="Attach a file"
        >
          {uploading
            ? '⏳'
            : '📎'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={
            handleFileUpload
          }
        />

        <input
          type="text"
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder={
            isConnected
              ? 'Type a message...'
              : 'Connecting to chat...'
          }
          disabled={!isConnected}
          className="chat-message-input"
        />

        <button
          type="submit"
          disabled={
            !isConnected ||
            !input.trim()
          }
          className="chat-send-button"
        >
          <span>Send</span>
          <span>➤</span>
        </button>
      </form>

    </div>
  );
}