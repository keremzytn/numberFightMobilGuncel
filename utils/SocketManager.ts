import { io, Socket } from 'socket.io-client';
import { API_URL } from '@/src/config/env';

// Debug modu
const DEBUG = true;

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[${new Date().toISOString()}] [Socket] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

export interface GameState {
  gameId: string;
  currentRound: number;
  player1Score: number;
  player2Score: number;
  status: string;
  roundStartTime: number;
  validCards: number[];
  forbiddenCards: number[];
  opponentId?: string;
}

export interface RoundResult {
  round: number;
  player1Card: number;
  player2Card: number;
  winner: string | null;
  player1Score: number;
  player2Score: number;
  isWinner: boolean;
  opponentCard: number;
}

export interface GameEndResult {
  winner: string | null;
  player1Score: number;
  player2Score: number;
  totalRounds: number;
  isWinner: boolean;
}

export class SocketManager {
  private socket: Socket | null = null;
  private serverUrl: string;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private autoReconnect: boolean = true;
  private connectionPromise: Promise<void> | null = null;
  private isConnecting: boolean = false;
  private lastGameId: string | null = null;

  constructor(serverUrl: string = API_URL) {
    debugLog('Initializing SocketManager', { serverUrl });
    this.serverUrl = serverUrl;
  }

  connect(): Promise<void> {
    debugLog('Attempting to connect', {
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts
    });

    // Eğer zaten bağlıysak veya bağlanma işlemi devam ediyorsa, mevcut promise'i döndür
    if (this.isConnected()) {
      debugLog('Already connected');
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectionPromise) {
      debugLog('Connection attempt already in progress');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        debugLog('Creating new socket connection');

        // Önceki soketi temizle
        if (this.socket) {
          debugLog('Cleaning up existing socket');
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }

        this.socket = io(this.serverUrl, {
          transports: ['websocket'],
          timeout: 10000,
          reconnection: false,
          forceNew: true,
          auth: {
            timestamp: Date.now()
          }
        });

        // Temel event dinleyicileri
        this.socket.on('connect', () => {
          debugLog('Socket connected', {
            socketId: this.socket?.id,
            attempt: this.reconnectAttempts + 1
          });
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.emit('connected');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          debugLog('Connection error', {
            message: error.message,
            attempt: this.reconnectAttempts + 1
          });

          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.emit('reconnecting', { attempt: this.reconnectAttempts });
            setTimeout(() => {
              debugLog('Attempting to reconnect', { attempt: this.reconnectAttempts });
              this.connectionPromise = null;
              this.isConnecting = false;
              this.connect().catch(() => { });
            }, this.reconnectDelay * this.reconnectAttempts);
          } else {
            debugLog('Max reconnection attempts reached');
            this.isConnecting = false;
            this.emit('error', {
              type: 'connection',
              message: 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
              details: error.message
            });
            reject(error);
          }
        });

        this.socket.on('disconnect', (reason) => {
          debugLog('Socket disconnected', { reason, lastGameId: this.lastGameId });
          this.emit('disconnected', { reason });

          if (this.autoReconnect && reason !== 'io client disconnect') {
            setTimeout(() => {
              debugLog('Attempting to reconnect after disconnect');
              this.connectionPromise = null;
              this.isConnecting = false;
              this.connect().catch(() => { });
            }, this.reconnectDelay);
          }
        });

        // Oyun event dinleyicileri
        this.setupGameEventListeners();

      } catch (error) {
        debugLog('Socket creation error', error);
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private setupGameEventListeners() {
    if (!this.socket) {
      debugLog('Cannot setup listeners - no socket');
      return;
    }

    const gameEvents = [
      'waitingForMatch',
      'matchFound',
      'roundStart',
      'cardPlayed',
      'opponentPlayed',
      'roundResult',
      'gameEnd',
      'opponentLeft',
      'opponentDisconnected'
    ];

    gameEvents.forEach(event => {
      this.socket?.on(event, (data) => {
        debugLog(`Game event received: ${event}`, {
          data,
          socketId: this.socket?.id
        });
        this.emit(event, data);

        // Oyun ID'sini takip et
        if (event === 'matchFound' && data?.gameId) {
          this.lastGameId = data.gameId;
        }
      });
    });
  }

  findMatch() {
    if (!this.isConnected()) {
      debugLog('Cannot find match - not connected');
      return;
    }
    debugLog('Sending findMatch request');
    this.socket?.emit('findMatch');
  }

  sendPlayerReady(gameId: string) {
    if (!this.isConnected()) {
      debugLog('Cannot send ready signal - not connected');
      return;
    }
    if (!gameId) {
      debugLog('Cannot send ready signal - no gameId');
      return;
    }
    debugLog('Sending playerReady signal', { gameId });
    this.socket?.emit('playerReady', { gameId });
  }

  playCard(gameId: string, cardNumber: number) {
    if (!this.isConnected() || !gameId) {
      debugLog('Cannot play card', {
        connected: this.isConnected(),
        gameId,
        cardNumber
      });
      return;
    }
    debugLog('Playing card', { gameId, cardNumber });
    this.socket?.emit('playCard', { gameId, cardNumber });
  }

  leaveGame(gameId: string) {
    if (this.socket?.connected && gameId) {
      debugLog('Leaving game', { gameId });
      this.socket.emit('leaveGame', { gameId });
      this.lastGameId = null;
    }
  }

  disconnect() {
    debugLog('Disconnecting socket');
    this.autoReconnect = false;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.isConnecting = false;
    this.connectionPromise = null;
    this.lastGameId = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public reconnect(): void {
    if (this.isConnecting) {
      debugLog('Reconnection already in progress');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      debugLog('Max reconnection attempts reached');
      return;
    }

    debugLog('Attempting to reconnect', {
      attempt: this.reconnectAttempts + 1,
      maxAttempts: this.maxReconnectAttempts
    });

    this.disconnect();
    this.connect();
    this.reconnectAttempts++;
  }

  on(event: string, callback: Function) {
    debugLog('Adding event listener', { event });
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    debugLog('Removing event listener', { event });
    if (!this.listeners.has(event)) return;

    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, data?: any) {
    debugLog('Emitting event', { event, data });
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// Singleton instance
export const socketManager = new SocketManager();