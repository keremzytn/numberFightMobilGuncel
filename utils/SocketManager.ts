import { io, Socket } from 'socket.io-client';

export interface GameState {
  gameId: string;
  currentRound: number;
  player1Score: number;
  player2Score: number;
  status: string;
  roundStartTime: number;
  validCards: number[];
  forbiddenCards: number[];
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

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket', 'polling'],
          timeout: 5000,
        });

        this.socket.on('connect', () => {
          console.log('Connected to game server');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from game server');
          this.emit('disconnected');
        });

        // Set up event listeners
        this.setupEventListeners();

      } catch (error) {
        reject(error);
      }
    });
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('waitingForMatch', () => {
      this.emit('waitingForMatch');
    });

    this.socket.on('matchFound', (data) => {
      this.emit('matchFound', data);
    });

    this.socket.on('roundStart', (gameState: GameState) => {
      this.emit('roundStart', gameState);
    });

    this.socket.on('cardPlayed', (data) => {
      this.emit('cardPlayed', data);
    });

    this.socket.on('opponentPlayed', () => {
      this.emit('opponentPlayed');
    });

    this.socket.on('roundResult', (result: RoundResult) => {
      this.emit('roundResult', result);
    });

    this.socket.on('gameEnd', (result: GameEndResult) => {
      this.emit('gameEnd', result);
    });

    this.socket.on('opponentLeft', () => {
      this.emit('opponentLeft');
    });

    this.socket.on('opponentDisconnected', () => {
      this.emit('opponentDisconnected');
    });

    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
  }

  findMatch() {
    if (this.socket) {
      this.socket.emit('findMatch');
    }
  }

  playCard(gameId: string, cardNumber: number) {
    if (this.socket) {
      this.socket.emit('playCard', { gameId, cardNumber });
    }
  }

  leaveGame(gameId: string) {
    if (this.socket) {
      this.socket.emit('leaveGame', { gameId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
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
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const socketManager = new SocketManager();