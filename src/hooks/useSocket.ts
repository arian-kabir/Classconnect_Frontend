// frontend/src/hooks/useSocket.ts
'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

type SocketType = ReturnType<typeof io>;

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket(userId: number | null) {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    console.log('Connecting to Socket.IO:', SOCKET_URL);

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      console.log(
        'Socket connected:',
        socketInstance.id
      );

      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(
        'Socket disconnected:',
        reason
      );

      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error(
        'Socket connection error:',
        error.message
      );

      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      console.log('Closing socket');

      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, [userId]);

  return {
    socket,
    isConnected,
  };
}