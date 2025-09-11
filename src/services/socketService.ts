import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { Platform } from 'react-native';
import { SIGNALR_URL } from '../config/env';
import { authService } from './authService';

// WebSocket polyfill for React Native
if (Platform.OS !== 'web') {
    (global as any).WebSocket = require('react-native-websocket').default;
}

export interface GameState {
    gameId: string;
    currentRound: number;
    player1Score: number;
    player2Score: number;
    validCards: number[];
    forbiddenCards: number[];
    roundStartTime: string;
}

export interface RoundResult {
    round: number;
    player1Card: number;
    player2Card: number;
    winner: string | null;
    player1Score: number;
    player2Score: number;
}

export interface GameEndResult {
    gameId: string;
    player1Score: number;
    player2Score: number;
    winnerId: string | null;
    totalRounds: number;
}

class SocketService {
    private connection: HubConnection | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    async connect(): Promise<void> {
        try {
            const token = await authService.getToken();
            if (!token) throw new Error('Token bulunamadı');

            const userId = await this.getUserId();
            
            this.connection = new HubConnectionBuilder()
                .withUrl(`${SIGNALR_URL}?userId=${userId}&access_token=${token}`, {
                    skipNegotiation: true,
                    transport: Platform.OS === 'web' ? undefined : 1 // WebSockets only for mobile
                })
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Information)
                .build();

            await this.connection.start();
            this.setupConnectionEvents();
            console.log('SignalR bağlantısı başarılı');
        } catch (error) {
            console.error('SignalR bağlantı hatası:', error);
            throw error;
        }
    }

    private setupConnectionEvents(): void {
        if (!this.connection) return;

        this.connection.onreconnecting(() => {
            this.reconnectAttempts++;
            console.log(`Yeniden bağlanılıyor... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        });

        this.connection.onreconnected(() => {
            this.reconnectAttempts = 0;
            console.log('Bağlantı yeniden kuruldu');
        });

        this.connection.onclose(() => {
            console.log('Bağlantı kapandı');
        });
    }

    async findMatch(mode: 'bot' | 'online' = 'online'): Promise<void> {
        if (!this.connection) throw new Error('Bağlantı yok');

        const userId = await this.getUserId();
        await this.connection.invoke('FindMatch', userId, mode);
    }

    async playCard(gameId: string, cardNumber: number): Promise<void> {
        if (!this.connection) throw new Error('Bağlantı yok');

        const userId = await this.getUserId();
        await this.connection.invoke('PlayCard', gameId, userId, cardNumber);
    }

    async inviteFriend(friendUserId: string): Promise<void> {
        if (!this.connection) throw new Error('Bağlantı yok');
        await this.connection.invoke('InviteFriend', friendUserId);
    }

    async respondToInvitation(gameId: string, accept: boolean): Promise<void> {
        if (!this.connection) throw new Error('Bağlantı yok');
        await this.connection.invoke('RespondToInvitation', gameId, accept);
    }

    async getOnlineFriends(): Promise<void> {
        if (!this.connection) throw new Error('Bağlantı yok');
        await this.connection.invoke('GetOnlineFriends');
    }

    private async getUserId(): Promise<string> {
        const token = await authService.getToken();
        if (!token) throw new Error('Token bulunamadı');

        // Token'dan user ID'yi çıkar (JWT decode)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));

        const payload = JSON.parse(jsonPayload);
        return payload.sub; // JWT'de user ID 'sub' claim'inde
    }

    on<T>(event: string, callback: (data: T) => void): void {
        this.connection?.on(event, callback);
    }

    off(event: string): void {
        this.connection?.off(event);
    }

    disconnect(): void {
        this.connection?.stop();
        this.connection = null;
    }

    isConnected(): boolean {
        return this.connection?.state === 'Connected';
    }
}

export const socketService = new SocketService();