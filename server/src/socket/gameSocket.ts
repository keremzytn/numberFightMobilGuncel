import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { GameRoom } from '../models/GameRoom';
import {
    IMatchFoundData,
    IPlayCardData,
    IGameStats,
    IPlayerSocket
} from '../types/socket';
import { IGameState, IRoundResult, GameStatus } from '../types/gameRoom';

// Debug modu
const DEBUG = true;

function debugLog(message: string, data?: any) {
    if (DEBUG) {
        console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
}

export const initializeSocket = (server: HttpServer) => {
    debugLog('Initializing socket server');

    const io = new SocketServer(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket'],
        pingTimeout: 10000,
        pingInterval: 5000,
        connectTimeout: 10000,
        maxHttpBufferSize: 1e6,
        allowEIO3: true,
        upgradeTimeout: 10000,
        perMessageDeflate: {
            threshold: 1024
        }
    });

    debugLog('Socket server configuration:', {
        transports: ['websocket'],
        pingTimeout: 10000,
        pingInterval: 5000
    });

    new GameSocket(io);
};

export class GameSocket {
    private io: SocketServer;
    private games: Map<string, GameRoom>;
    private waitingPlayers: string[];
    private playerSockets: Map<string, IPlayerSocket>;
    private playerGameMap: Map<string, string>;

    constructor(io: SocketServer) {
        debugLog('Initializing GameSocket');
        this.io = io;
        this.games = new Map();
        this.waitingPlayers = [];
        this.playerSockets = new Map();
        this.playerGameMap = new Map();
        this.initialize();

        // Periyodik durum raporu
        setInterval(() => {
            this.logGameStatus();
        }, 5000);
    }

    private logGameStatus() {
        debugLog('Current game status:', {
            activeGames: this.games.size,
            waitingPlayers: this.waitingPlayers.length,
            connectedPlayers: this.playerSockets.size,
            games: Array.from(this.games.entries()).map(([id, game]) => ({
                id,
                player1: game.firstPlayerId,
                player2: game.secondPlayerId,
                status: game.getStatus(),
                readyPlayers: Array.from(game.getReadyPlayers())
            }))
        });
    }

    private initialize(): void {
        debugLog('Setting up connection handler');

        this.io.on('connection', (socket: IPlayerSocket) => {
            debugLog('New connection established', {
                socketId: socket.id,
                transport: socket.conn.transport.name,
                address: socket.handshake.address
            });

            this.handleNewConnection(socket);
        });

        // Periyodik temizlik işlemi
        setInterval(() => {
            debugLog('Running cleanup routine');
            this.cleanupInactiveGames();
        }, 30000);
    }

    private handleNewConnection(socket: IPlayerSocket): void {
        debugLog('Processing new connection', { socketId: socket.id });

        // Oyuncuyu kaydet
        this.playerSockets.set(socket.id, socket);

        // Event dinleyicilerini bağla
        this.setupSocketListeners(socket);

        // Yeniden bağlanma kontrolü
        this.handleReconnection(socket);

        // Bağlantı durumunu bildir
        socket.emit('connected', { socketId: socket.id });
    }

    private setupSocketListeners(socket: IPlayerSocket): void {
        debugLog('Setting up event listeners for socket', { socketId: socket.id });

        socket.on('findMatch', () => {
            debugLog('findMatch event received', { socketId: socket.id });
            this.handleFindMatch(socket);
        });

        socket.on('playerReady', (data: { gameId: string }) => {
            debugLog('playerReady event received', { socketId: socket.id, gameId: data.gameId });
            this.handlePlayerReady(socket, data);
        });

        socket.on('playCard', (data: IPlayCardData) => {
            debugLog('playCard event received', { socketId: socket.id, ...data });
            this.handlePlayCard(socket, data);
        });

        socket.on('leaveGame', (data: { gameId: string }) => {
            debugLog('leaveGame event received', { socketId: socket.id, gameId: data.gameId });
            this.handleLeaveGame(socket, data);
        });

        socket.on('disconnect', (reason) => {
            debugLog('disconnect event received', { socketId: socket.id, reason });
            this.handleDisconnect(socket);
        });

        socket.on('error', (error) => {
            debugLog('Socket error occurred', { socketId: socket.id, error });
        });
    }

    private handleReconnection(socket: IPlayerSocket): void {
        const gameId = this.playerGameMap.get(socket.id);
        if (gameId) {
            const game = this.games.get(gameId);
            if (game) {
                debugLog('Player reconnected to game:', {
                    socketId: socket.id,
                    gameId,
                    timestamp: new Date().toISOString()
                });

                const gameState = game.getGameState();
                this.emitRoundStart(game, gameState);
            } else {
                this.playerGameMap.delete(socket.id);
            }
        }
    }

    private cleanupInactiveGames(): void {
        debugLog('Running cleanupInactiveGames');
        const now = Date.now();
        for (const [gameId, game] of this.games.entries()) {
            const player1Socket = this.playerSockets.get(game.firstPlayerId);
            const player2Socket = this.playerSockets.get(game.secondPlayerId);

            if (!player1Socket?.connected || !player2Socket?.connected) {
                debugLog('Cleaning up inactive game:', {
                    gameId,
                    player1Connected: player1Socket?.connected,
                    player2Connected: player2Socket?.connected,
                    timestamp: new Date().toISOString()
                });

                this.handleGameEnd(game, 'cleanup');
            }
        }
    }

    private handleGameEnd(game: GameRoom, reason: string): void {
        debugLog('Game ended:', {
            gameId: game.gameId,
            reason,
            timestamp: new Date().toISOString()
        });

        // Oyuncuları bilgilendir
        const player1Socket = this.playerSockets.get(game.firstPlayerId);
        const player2Socket = this.playerSockets.get(game.secondPlayerId);

        if (player1Socket?.connected) {
            player1Socket.emit('gameEnd', { reason });
        }
        if (player2Socket?.connected) {
            player2Socket.emit('gameEnd', { reason });
        }

        // Temizlik
        this.playerGameMap.delete(game.firstPlayerId);
        this.playerGameMap.delete(game.secondPlayerId);
        this.games.delete(game.gameId);
    }

    private handlePlayerReady(socket: IPlayerSocket, { gameId }: { gameId: string }): void {
        debugLog('Processing playerReady:', {
            socketId: socket.id,
            gameId,
            timestamp: new Date().toISOString()
        });

        const game = this.games.get(gameId);
        if (!game) {
            debugLog('Game not found:', {
                gameId,
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
            socket.emit('error', {
                type: 'game',
                message: 'Game not found'
            });
            return;
        }

        // Oyuncunun bu oyuna ait olduğunu kontrol et
        if (game.firstPlayerId !== socket.id && game.secondPlayerId !== socket.id) {
            debugLog('Player not in this game:', {
                socketId: socket.id,
                gameId,
                timestamp: new Date().toISOString()
            });
            socket.emit('error', {
                type: 'game',
                message: 'You are not in this game'
            });
            return;
        }

        // Oyuncu zaten hazır mı kontrol et
        const readyPlayers = game.getReadyPlayers();
        if (readyPlayers.has(socket.id)) {
            debugLog('Player already ready:', {
                socketId: socket.id,
                gameId,
                timestamp: new Date().toISOString()
            });
            return;
        }

        debugLog('Current ready players:', {
            gameId,
            readyPlayers: Array.from(readyPlayers),
            timestamp: new Date().toISOString()
        });

        readyPlayers.add(socket.id);
        game.setReadyPlayers(readyPlayers);

        debugLog('Updated ready players:', {
            gameId,
            readyPlayers: Array.from(readyPlayers),
            timestamp: new Date().toISOString()
        });

        // Her iki oyuncu da hazır mı kontrol et
        if (readyPlayers.size === 2 && game.getStatus() === 'waiting') {
            debugLog('Both players ready, starting game:', {
                gameId,
                timestamp: new Date().toISOString()
            });

            // Her iki oyuncunun da bağlı olduğunu kontrol et
            const player1Socket = this.playerSockets.get(game.firstPlayerId);
            const player2Socket = this.playerSockets.get(game.secondPlayerId);

            if (!player1Socket?.connected || !player2Socket?.connected) {
                debugLog('One or both players disconnected before game start:', {
                    gameId,
                    player1Connected: player1Socket?.connected,
                    player2Connected: player2Socket?.connected,
                    timestamp: new Date().toISOString()
                });
                this.handleGameEnd(game, 'player_disconnected_before_start');
                return;
            }

            const gameState = game.startRound();
            debugLog('Game state after round start:', {
                gameId,
                gameState,
                timestamp: new Date().toISOString()
            });

            this.emitRoundStart(game, gameState);
        }
    }

    private handleFindMatch(socket: IPlayerSocket): void {
        debugLog('Processing findMatch:', {
            socketId: socket.id,
            waitingPlayers: this.waitingPlayers.length,
            timestamp: new Date().toISOString()
        });

        // Oyuncu zaten eşleşme listesinde mi kontrol et
        if (this.waitingPlayers.includes(socket.id)) {
            debugLog('Player already in waiting list:', socket.id);
            return;
        }

        // Oyuncu zaten bir oyunda mı kontrol et
        const existingGame = Array.from(this.games.values()).find(game =>
            game.firstPlayerId === socket.id || game.secondPlayerId === socket.id
        );

        if (existingGame) {
            debugLog('Player already in game:', {
                socketId: socket.id,
                gameId: existingGame.gameId
            });
            return;
        }

        this.playerSockets.set(socket.id, socket);

        if (this.waitingPlayers.length > 0) {
            const opponent = this.waitingPlayers.shift()!;
            const opponentSocket = this.playerSockets.get(opponent);

            // Rakip hala bağlı mı kontrol et
            if (!opponentSocket?.connected) {
                debugLog('Opponent disconnected, finding new match:', {
                    socketId: socket.id,
                    opponentId: opponent,
                    timestamp: new Date().toISOString()
                });
                this.handleFindMatch(socket);
                return;
            }

            debugLog('Found opponent:', {
                player1: opponent,
                player2: socket.id,
                timestamp: new Date().toISOString()
            });

            const game = new GameRoom(opponent, socket.id);
            this.games.set(game.gameId, game);
            debugLog('Created game room:', {
                gameId: game.gameId,
                player1: opponent,
                player2: socket.id,
                timestamp: new Date().toISOString()
            });

            // Rakibe eşleşme bilgisini gönder
            const matchData1: IMatchFoundData = {
                gameId: game.gameId,
                opponentId: socket.id,
                isPlayer1: true
            };
            debugLog('Sending matchFound to opponent:', {
                socketId: opponent,
                gameId: game.gameId,
                timestamp: new Date().toISOString()
            });
            opponentSocket.emit('matchFound', matchData1);

            // Oyuncuya eşleşme bilgisini gönder
            const matchData2: IMatchFoundData = {
                gameId: game.gameId,
                opponentId: opponent,
                isPlayer1: false
            };
            debugLog('Sending matchFound to player:', {
                socketId: socket.id,
                gameId: game.gameId,
                timestamp: new Date().toISOString()
            });
            socket.emit('matchFound', matchData2);

        } else {
            this.waitingPlayers.push(socket.id);
            debugLog('Added player to waiting list:', {
                socketId: socket.id,
                waitingPlayers: this.waitingPlayers.length,
                timestamp: new Date().toISOString()
            });
            socket.emit('waitingForMatch');
        }
    }

    private handlePlayCard(socket: IPlayerSocket, { gameId, cardNumber }: IPlayCardData): void {
        debugLog('Player played card:', {
            socketId: socket.id,
            gameId,
            cardNumber,
            timestamp: new Date().toISOString()
        });
        const game = this.games.get(gameId);
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        try {
            game.playCard(socket.id, cardNumber);
            socket.emit('cardPlayed', { cardNumber });

            const opponentId = game.firstPlayerId === socket.id ? game.secondPlayerId : game.firstPlayerId;
            const opponentSocket = this.playerSockets.get(opponentId);
            if (opponentSocket) {
                opponentSocket.emit('opponentPlayed');
            }

            const roundResult = game.resolveRound();
            if (roundResult) {
                this.emitRoundResult(game, roundResult);
            }
        } catch (error) {
            socket.emit('error', { message: error instanceof Error ? error.message : 'Unknown error' });
        }
    }

    private handleLeaveGame(socket: IPlayerSocket, { gameId }: { gameId: string }): void {
        const game = this.games.get(gameId);
        if (game) {
            const opponentId = game.firstPlayerId === socket.id ? game.secondPlayerId : game.firstPlayerId;
            const opponentSocket = this.playerSockets.get(opponentId);
            if (opponentSocket) {
                opponentSocket.emit('opponentLeft');
            }
            this.games.delete(gameId);
        }
    }

    private handleDisconnect(socket: IPlayerSocket): void {
        debugLog('Player disconnected:', socket.id);
        const waitingIndex = this.waitingPlayers.indexOf(socket.id);
        if (waitingIndex > -1) {
            this.waitingPlayers.splice(waitingIndex, 1);
        }

        for (const [gameId, game] of this.games.entries()) {
            if (game.firstPlayerId === socket.id || game.secondPlayerId === socket.id) {
                const opponentId = game.firstPlayerId === socket.id ? game.secondPlayerId : game.firstPlayerId;
                const opponentSocket = this.playerSockets.get(opponentId);
                if (opponentSocket) {
                    opponentSocket.emit('opponentDisconnected');
                }
                this.games.delete(gameId);
                break;
            }
        }
        this.playerSockets.delete(socket.id);
    }

    private handleGameError(game: GameRoom, errorMessage: string): void {
        debugLog('Game error:', {
            gameId: game.gameId,
            error: errorMessage,
            timestamp: new Date().toISOString()
        });

        const player1Socket = this.playerSockets.get(game.firstPlayerId);
        const player2Socket = this.playerSockets.get(game.secondPlayerId);

        if (player1Socket) {
            player1Socket.emit('error', { type: 'game', message: errorMessage });
        }
        if (player2Socket) {
            player2Socket.emit('error', { type: 'game', message: errorMessage });
        }

        this.games.delete(game.gameId);
    }

    private emitRoundStart(game: GameRoom, gameState: IGameState): void {
        debugLog('Emitting round start:', {
            gameId: game.gameId,
            gameState,
            timestamp: new Date().toISOString()
        });

        const player1Socket = this.playerSockets.get(game.firstPlayerId);
        const player2Socket = this.playerSockets.get(game.secondPlayerId);

        if (!player1Socket?.connected || !player2Socket?.connected) {
            debugLog('One or both players disconnected during round start:', {
                gameId: game.gameId,
                player1Connected: player1Socket?.connected,
                player2Connected: player2Socket?.connected,
                player1Id: game.firstPlayerId,
                player2Id: game.secondPlayerId
            });
            this.handleGameEnd(game, 'player_disconnected');
            return;
        }

        // Oyuncu-oyun eşleşmesini kaydet
        this.playerGameMap.set(game.firstPlayerId, game.gameId);
        this.playerGameMap.set(game.secondPlayerId, game.gameId);

        const baseGameState = {
            gameId: gameState.gameId,
            currentRound: gameState.currentRound,
            player1Score: gameState.player1Score,
            player2Score: gameState.player2Score,
            status: 'playing' as GameStatus,
            roundStartTime: Date.now()
        };

        // Player 1 için oyun durumu
        const player1Data: IGameState = {
            ...baseGameState,
            validCards: game.getValidCards(game.firstPlayerId),
            forbiddenCards: game.getForbiddenCards(game.firstPlayerId),
            opponentId: game.secondPlayerId
        };

        // Player 2 için oyun durumu
        const player2Data: IGameState = {
            ...baseGameState,
            validCards: game.getValidCards(game.secondPlayerId),
            forbiddenCards: game.getForbiddenCards(game.secondPlayerId),
            opponentId: game.firstPlayerId
        };

        debugLog('Sending game state to player 1:', {
            socketId: game.firstPlayerId,
            gameState: player1Data
        });
        player1Socket.emit('roundStart', player1Data);

        debugLog('Sending game state to player 2:', {
            socketId: game.secondPlayerId,
            gameState: player2Data
        });
        player2Socket.emit('roundStart', player2Data);

        // Oyun durumunu güncelle
        game.setStatus('playing');
    }

    private emitRoundResult(game: GameRoom, roundResult: IRoundResult): void {
        const player1Socket = this.playerSockets.get(game.firstPlayerId);
        const player2Socket = this.playerSockets.get(game.secondPlayerId);

        if (player1Socket) {
            player1Socket.emit('roundResult', {
                ...roundResult,
                isWinner: roundResult.winner === game.firstPlayerId,
                opponentCard: roundResult.player2Card
            });
        }

        if (player2Socket) {
            player2Socket.emit('roundResult', {
                ...roundResult,
                isWinner: roundResult.winner === game.secondPlayerId,
                opponentCard: roundResult.player1Card
            });
        }
    }

    getGameStats(): IGameStats {
        return {
            activeGames: this.games.size,
            waitingPlayers: this.waitingPlayers.length,
            connectedPlayers: this.playerSockets.size
        };
    }
} 