// frontend/src/lib/chat-client.ts

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001';

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    url,
    {
      ...options,
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error =
      await response.json().catch(
        () => ({})
      );

    throw new Error(
      error.message ||
      error.error ||
      `Request failed: ${response.status}`
    );
  }

  return response.json();
}

export const chatApi = {
  getRooms: (userId: number) =>
    request(
      `${API_BASE_URL}/api/chat/rooms?userId=${userId}`
    ),

  getMessages: (
    roomId: number,
    userId: number,
    limit = 50,
    offset = 0
  ) =>
    request(
      `${API_BASE_URL}/api/chat/messages?roomId=${roomId}&userId=${userId}&limit=${limit}&offset=${offset}`
    ),

  getRoomUsers: (roomId: number) =>
    request(
      `${API_BASE_URL}/api/chat/room-users?roomId=${roomId}`
    ),

  sendMessage: (data: any) =>
    request(
      `${API_BASE_URL}/api/chat/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(data),
      }
    ),
};