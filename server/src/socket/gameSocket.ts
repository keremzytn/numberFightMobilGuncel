import { Server } from 'socket.io';
import { GameRoom } from '../models/GameRoom';
import {
    IMatchFoundData,
    IPlayCardData,
    IGameStats,
    IRoundStartData,
    IPlayerSocket
} from '../types/socket';
import { IGameState, IRoundResult } from '../types/gameRoom';

export class GameSocket {
    private io: Server;
    private games: Map<string, GameRoom>;
    private waitingPlayers: string[];
    private playerSockets: Map<string, IPlayerSocket>;

    constructor(io: Server) {
        this.io = io;
        this.games = new Map();
        this.waitingPlayers = [];
        this.playerSockets = new Map();
    }

    initialize(): void {
        this.io.on('connection', (socket: IPlayerSocket) => {
            console.log('Player connected:', socket.id);

            socket.on('findMatch', () => this.handleFindMatch(socket));
            socket.on('playCard', (data: IPlayCardData) => this.handlePlayCard(socket, data));
            socket.on('leaveGame', (data: { gameId: string }) => this.handleLeaveGame(socket, data));
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    private handleFindMatch(socket: IPlayerSocket): void {
        console.log('Player looking for match:', socket.id);
        this.playerSockets.set(socket.id, socket);

        if (this.waitingPlayers.length > 0) {
            const opponent = this.waitingPlayers.shift()!;
            const game = new GameRoom(opponent, socket.id);
            this.games.set(game.gameId, game);

            const opponentSocket = this.playerSockets.get(opponent);
            if (opponentSocket) {
                const matchData: IMatchFoundData = {
                    gameId: game.gameId,
                    opponentId: socket.id,
                    isPlayer1: true
                };
                opponentSocket.emit('matchFound', matchData);
            }

            const matchData: IMatchFoundData = {
                gameId: game.gameId,
                opponentId: opponent,
                isPlayer1: false
            };
            socket.emit('matchFound', matchData);

            setTimeout(() => {
                const gameState = game.startRound();
                this.emitRoundStart(game, gameState);
            }, 2000);
        } else {
            this.waitingPlayers.push(socket.id);
            socket.emit('waitingForMatch');
        }
    }

    private handlePlayCard(socket: IPlayerSocket, { gameId, cardNumber }: IPlayCardData): void {
        console.log('Player played card:', socket.id, cardNumber);
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
        console.log('Player disconnected:', socket.id);
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

    private emitRoundStart(game: GameRoom, gameState: IGameState): void {
        const player1Socket = this.playerSockets.get(game.firstPlayerId);
        const player2Socket = this.playerSockets.get(game.secondPlayerId);

        if (player1Socket) {
            const player1Data: IRoundStartData = {
                ...gameState,
                validCards: game.getValidCards(game.firstPlayerId),
                forbiddenCards: []  // Bu değer GameRoom'dan alınmalı
            };
            player1Socket.emit('roundStart', player1Data);
        }

        if (player2Socket) {
            const player2Data: IRoundStartData = {
                ...gameState,
                validCards: game.getValidCards(game.secondPlayerId),
                forbiddenCards: []  // Bu değer GameRoom'dan alınmalı
            };
            player2Socket.emit('roundStart', player2Data);
        }
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