import { API_URL } from '../config/env';
import { authService } from './authService';

export interface FriendDto {
    id: string;
    userId: string;
    friendUserId: string;
    status: string;
    requestedAt: string;
    acceptedAt?: string;
    user: UserDto;
    friendUser: UserDto;
}

export interface UserDto {
    id: string;
    username: string;
    email: string;
    isOnline?: boolean;
    lastSeenAt?: string;
}

export interface FriendRequestDto {
    friendUserId: string;
}

export interface FriendResponseDto {
    friendRequestId: string;
    accept: boolean;
}

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await authService.getToken();
    if (!token) {
        throw new Error('Token bulunamadı');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return response;
};

class FriendService {
    async getFriends(status?: string): Promise<FriendDto[]> {
        const url = status
            ? `${API_URL}/api/Friends?status=${encodeURIComponent(status)}`
            : `${API_URL}/api/Friends`;

        const response = await fetchWithAuth(url);
        return response.json();
    }

    async getPendingRequests(): Promise<FriendDto[]> {
        const response = await fetchWithAuth(`${API_URL}/api/Friends/pending-requests`);
        return response.json();
    }

    async getSentRequests(): Promise<FriendDto[]> {
        const response = await fetchWithAuth(`${API_URL}/api/Friends/sent-requests`);
        return response.json();
    }

    async sendFriendRequest(friendUserId: string): Promise<FriendDto> {
        const response = await fetchWithAuth(`${API_URL}/api/Friends/send-request`, {
            method: 'POST',
            body: JSON.stringify({ friendUserId }),
        });
        return response.json();
    }

    async respondToFriendRequest(friendRequestId: string, accept: boolean): Promise<FriendDto> {
        const response = await fetchWithAuth(`${API_URL}/api/Friends/respond`, {
            method: 'POST',
            body: JSON.stringify({ friendRequestId, accept }),
        });
        return response.json();
    }

    async searchUsers(searchTerm: string): Promise<UserDto[]> {
        if (searchTerm.length < 2) {
            return [];
        }

        const response = await fetchWithAuth(
            `${API_URL}/api/Friends/search?searchTerm=${encodeURIComponent(searchTerm)}`
        );
        return response.json();
    }

    async deleteFriendship(friendUserId: string): Promise<{ success: boolean; message: string }> {
        const response = await fetchWithAuth(`${API_URL}/api/Friends/${friendUserId}`, {
            method: 'DELETE',
        });
        return response.json();
    }
}

export const friendService = new FriendService();