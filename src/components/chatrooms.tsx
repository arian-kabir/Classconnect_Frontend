// frontend/src/components/ChatRoom.tsx

'use client';

import {
  useState,
  useEffect,
  useRef
} from 'react';

import { useSocket } from '@/hooks/useSocket';
import { chatApi } from '@/lib/chat-client';

interface Message {
  message_id: number;
  message_text: string;
  sender_name: string;
  sender_id: number | string;
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
  roomName
}: ChatRoomProps) {

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const {
    socket,
    isConnected
  } = useSocket(userId);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);
    const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';
  
  
  const getFileUrl = (fileUrl: string) => {
  if (fileUrl.startsWith('http://') ||
      fileUrl.startsWith('https://')) {
    return fileUrl;
  }

  return `${API_BASE_URL}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
};

  /*
   * ------------------------------------------------------------
   * Reset messages when the room changes.
   * ------------------------------------------------------------
   */

  useEffect(() => {
    setInput('');
    setMessages([]);
  }, [roomId]);

  /*
   * ------------------------------------------------------------
   * Fetch existing messages.
   * ------------------------------------------------------------
   */

  useEffect(() => {

    const fetchMessages = async () => {

      try {

        setLoading(true);

        const data =
          await chatApi.getMessages(
            roomId,
            userId
          );

        const loadedMessages =
          Array.isArray(data.messages)
            ? data.messages
            : [];

        /*
         * Normalize sender IDs and remove duplicate
         * message IDs.
         */

        const uniqueMessages =
          loadedMessages
            .map((message: Message) => ({
              ...message,
              sender_id:
                Number(message.sender_id),
              message_id:
                Number(message.message_id)
            }))
            .filter(
              (message: Message, index: number, array: Message[]) =>
                array.findIndex(
                  item =>
                    item.message_id ===
                    message.message_id
                ) === index
            );

        /*
         * Always display oldest -> newest.
         */

        uniqueMessages.sort(
          (a: Message, b: Message) => {
            const timeDifference =
              new Date(a.sent_at).getTime() -
              new Date(b.sent_at).getTime();

            if (timeDifference !== 0) {
              return timeDifference;
            }

            return (
              Number(a.message_id) -
              Number(b.message_id)
            );
          }
        );

        setMessages(uniqueMessages);

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
   * ------------------------------------------------------------
   * Join the selected Socket.IO room.
   * ------------------------------------------------------------
   */

  useEffect(() => {

    if (!socket || !isConnected) {
      return;
    }

    socket.emit(
      'join-room',
      {
        roomId,
        userId
      }
    );

    return () => {

      socket.emit(
        'leave-room',
        {
          roomId,
          userId
        }
      );

    };

  }, [
    socket,
    isConnected,
    roomId,
    userId
  ]);

  /*
   * ------------------------------------------------------------
   * Listen for new messages.
   * ------------------------------------------------------------
   */

  useEffect(() => {

    if (!socket) {
      return;
    }

    const handleNewMessage =
      (data: { message: Message }) => {

        if (!data?.message) {
          return;
        }

        const newMessage = {
          ...data.message,

          sender_id:
            Number(data.message.sender_id),

          message_id:
            Number(data.message.message_id)
        };

        /*
         * Only add the message if it belongs to
         * the current room.
         */

        if (
          Number((newMessage as any).room_id) !==
            Number(roomId)
        ) {
          return;
        }

        setMessages(prev => {

          /*
           * Prevent duplicate messages.
           */

          const alreadyExists =
            prev.some(
              message =>
                Number(message.message_id) ===
                Number(newMessage.message_id)
            );

          if (alreadyExists) {
            return prev;
          }

          /*
           * Add the new message and sort again.
           */

          const updatedMessages = [
            ...prev,
            newMessage
          ];

          updatedMessages.sort(
            (a, b) => {

              const timeDifference =
                new Date(a.sent_at).getTime() -
                new Date(b.sent_at).getTime();

              if (timeDifference !== 0) {
                return timeDifference;
              }

              return (
                Number(a.message_id) -
                Number(b.message_id)
              );
            }
          );

          return updatedMessages;
        });
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

  }, [socket, roomId]);

  /*
   * ------------------------------------------------------------
   * Auto-scroll to newest message.
   * ------------------------------------------------------------
   */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });

  }, [messages]);

  /*
   * ------------------------------------------------------------
   * Send normal text message.
   * ------------------------------------------------------------
   */

  const sendMessage = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    const trimmedInput =
      input.trim();

    if (
      !trimmedInput ||
      !socket ||
      !isConnected
    ) {
      return;
    }

    socket.emit(
      'send-message',
      {
        roomId,
        senderId: userId,
        messageText: trimmedInput,
        messageType: 'text'
      }
    );

    setInput('');

  };

  /*
   * ------------------------------------------------------------
   * Upload attachment.
   * ------------------------------------------------------------
   */

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!isConnected) {
      console.error(
        'Cannot upload attachment: socket is offline.'
      );

      return;
    }

    try {

      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        'file',
        file
      );

      formData.append(
        'userId',
        String(userId)
      );

      formData.append(
        'roomId',
        String(roomId)
      );

      const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001';

    const response = await fetch(
      `${API_BASE_URL}/api/chat/uploads`,
      {
        method: 'POST',
        body: formData
      }
    );

      if (!response.ok) {

        throw new Error(
          `Upload failed: ${response.status}`
        );

      }

      const data =
        await response.json();

      if (!data.success || !data.message) {

        throw new Error(
          data.error ||
          'Upload failed'
        );

      }

      const uploadedMessage = {
        ...data.message,
        sender_id: Number(data.message.sender_id),
        message_id: Number(data.message.message_id)
      };

      setMessages(prev => {
        const alreadyExists = prev.some(
          message =>
            Number(message.message_id) ===
            Number(uploadedMessage.message_id)
        );

        if (alreadyExists) {
          return prev;
        }

        const updatedMessages = [
          ...prev,
          uploadedMessage
        ];

        updatedMessages.sort((a, b) => {
          const timeDifference =
            new Date(a.sent_at).getTime() -
            new Date(b.sent_at).getTime();

          if (timeDifference !== 0) {
            return timeDifference;
          }

          return (
            Number(a.message_id) -
            Number(b.message_id)
          );
        });

        return updatedMessages;
      });

    } catch (error) {

      console.error(
        'Upload error:',
        error
      );

    } finally {

      setUploading(false);

      /*
       * Clear the input so selecting the same
       * file again triggers onChange.
       */

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    }

  };

  /*
   * ------------------------------------------------------------
   * Loading state.
   * ------------------------------------------------------------
   */

  if (loading) {

    return (
      <div className="p-4 text-gray-500">
        Loading messages...
      </div>
    );

  }

  /*
   * ------------------------------------------------------------
   * Chat UI.
   * ------------------------------------------------------------
   */

  return (

    <div className="flex flex-col h-full border rounded-lg bg-white overflow-hidden">

      {/* Header */}

      <div className="p-4 border-b bg-gray-50 rounded-t-lg flex justify-between items-center">

        <div>

          <h3 className="font-semibold text-gray-900">
            {roomName}
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            {messages.length} message
            {messages.length !== 1 ? 's' : ''}
          </p>

        </div>

        <span
          className={`text-xs font-medium ${
            isConnected
              ? 'text-green-500'
              : 'text-red-500'
          }`}
        >
          {isConnected
            ? '● Online'
            : '● Offline'}
        </span>

      </div>

      {/* Messages */}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">

        {messages.length === 0 ? (

          <p className="text-gray-500 text-sm text-center py-8">
            No messages yet. Say hello!
          </p>

        ) : (

          messages.map((msg) => {

            /*
             * Convert both values to numbers.
             *
             * This is important because MySQL can return
             * sender_id as a string while userId is a number.
             */

            const isOwnMessage =
              Number(msg.sender_id) ===
              Number(userId);

            return (

              <div
                key={msg.message_id}
                className={`flex ${
                  isOwnMessage
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >

                <div
                  className={`p-3 rounded-lg max-w-[75%] ${
                    isOwnMessage
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >

                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1">
                      {msg.sender_name}
                    </p>
                  )}

                  {/* Image */}

                  {msg.message_type === 'image' &&
                    msg.file_url ? (

                      <div>
                        <a
                          href={getFileUrl(msg.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={getFileUrl(msg.file_url)}
                            alt={msg.message_text || 'Uploaded image'}
                            className="max-w-xs max-h-64 rounded-lg mt-1 cursor-pointer"
                          />
                        </a>

                        <p className="text-sm mt-1 break-words">
                          {msg.message_text}
                        </p>
                      </div>

                    ) : msg.file_url ? (

                    /* File */

                    <a
                      href={getFileUrl(msg.file_url)}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 underline ${
                        isOwnMessage
                          ? 'text-white'
                          : 'text-blue-600'
                      }`}
                    >
                      <span>📎</span>

                      <span>
                        {msg.message_text}
                      </span>
                    </a>

                  ) : (

                    /* Normal text */

                    <p className="break-words">
                      {msg.message_text}
                    </p>

                  )}

                  <p
                    className={`text-xs opacity-70 mt-1 ${
                      isOwnMessage
                        ? 'text-white'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(
                      msg.sent_at
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>

                </div>

              </div>

            );

          })

        )}

        <div ref={messagesEndRef} />

      </div>

      {/* Input */}

      <form
        onSubmit={sendMessage}
        className="p-4 border-t flex gap-2 bg-white"
      >

        {/* Attachment button */}

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={
            !isConnected ||
            uploading
          }
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Attach a file"
        >
          {uploading ? '...' : '📎'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Message input */}

        <input
          type="text"
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder={
            isConnected
              ? 'Type a message...'
              : 'Connecting...'
          }
          className="flex-1 min-w-0 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!isConnected}
        />

        {/* Send */}

        <button
          type="submit"
          disabled={
            !isConnected ||
            !input.trim()
          }
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>

      </form>

    </div>

  );
}
