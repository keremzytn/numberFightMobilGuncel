const GameRoom = require('../models/GameRoom');

class GameSocket {
    constructor(io) {
        this.io = io;
        this.games = new Map();
        this.waitingPlayers = [];
        this.playerSockets = new Map();
    }

    initialize() {
        this.io.on('connection', (socket) => {
            console.log('Player connected:', socket.id);

            socket.on('findMatch', () => this.handleFindMatch(socket));
            socket.on('playCard', (data) => this.handlePlayCard(socket, data));
            socket.on('leaveGame', (data) => this.handleLeaveGame(socket, data));
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    handleFindMatch(socket) {
        console.log('Player looking for match:', socket.id);
        this.playerSockets.set(socket.id, socket);

        if (this.waitingPlayers.length > 0) {
            const opponent = this.waitingPlayers.shift();
            const game = new GameRoom(opponent, socket.id);
            this.games.set(game.id, game);

            const opponentSocket = this.playerSockets.get(opponent);
            if (opponentSocket) {
                opponentSocket.emit('matchFound', {
                    gameId: game.id,
                    opponentId: socket.id,
                    isPlayer1: true
                });
            }

            socket.emit('matchFound', {
                gameId: game.id,
                opponentId: opponent,
                isPlayer1: false
            });

            setTimeout(() => {
                const gameState = game.startRound();
                this.emitRoundStart(game, gameState);
            }, 2000);
        } else {
            this.waitingPlayers.push(socket.id);
            socket.emit('waitingForMatch');
        }
    }

    handlePlayCard(socket, { gameId, cardNumber }) {
        console.log('Player played card:', socket.id, cardNumber);
        const game = this.games.get(gameId);
        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        try {
            game.playCard(socket.id, cardNumber);
            socket.emit('cardPlayed', { cardNumber });

            const opponentId = game.player1Id === socket.id ? game.player2Id : game.player1Id;
            const opponentSocket = this.playerSockets.get(opponentId);
            if (opponentSocket) {
                opponentSocket.emit('opponentPlayed');
            }

            const roundResult = game.resolveRound();
            if (roundResult) {
                this.emitRoundResult(game, roundResult);
            }
        } catch (error) {
            socket.emit('error', { message: error.message });
        }
    }

    handleLeaveGame(socket, { gameId }) {
        const game = this.games.get(gameId);
        if (game) {
            const opponentId = game.player1Id === socket.id ? game.player2Id : game.player1Id;
            const opponentSocket = this.playerSockets.get(opponentId);
            if (opponentSocket) {
                opponentSocket.emit('opponentLeft');
            }
            this.games.delete(gameId);
        }
    }

    handleDisconnect(socket) {
        console.log('Player disconnected:', socket.id);
        const waitingIndex = this.waitingPlayers.indexOf(socket.id);
        if (waitingIndex > -1) {
            this.waitingPlayers.splice(waitingIndex, 1);
        }

        for (const [gameId, game] of this.games.entries()) {
            if (game.player1Id === socket.id || game.player2Id === socket.id) {
                const opponentId = game.player1Id === socket.id ? game.player2Id : game.player1Id;
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

    emitRoundStart(game, gameState) {
        const player1Socket = this.playerSockets.get(game.player1Id);
        const player2Socket = this.playerSockets.get(game.player2Id);

        if (player1Socket) {
            player1Socket.emit('roundStart', {
                ...gameState,
                validCards: game.getValidCards(game.player1Id),
                forbiddenCards: game.player1ForbiddenCards
            });
        }

        if (player2Socket) {
            player2Socket.emit('roundStart', {
                ...gameState,
                validCards: game.getValidCards(game.player2Id),
                forbiddenCards: game.player2ForbiddenCards
            });
        }
    }

    emitRoundResult(game, roundResult) {
        const player1Socket = this.playerSockets.get(game.player1Id);
        const player2Socket = this.playerSockets.get(game.player2Id);

        if (player1Socket) {
            player1Socket.emit('roundResult', {
                ...roundResult,
                isWinner: roundResult.winner === game.player1Id,
                opponentCard: roundResult.player2Card
            });
        }

        if (player2Socket) {
            player2Socket.emit('roundResult', {
                ...roundResult,
                isWinner: roundResult.winner === game.player2Id,
                opponentCard: roundResult.player1Card
            });
        }
    }

    getGameStats() {
        return {
            activeGames: this.games.size,
            waitingPlayers: this.waitingPlayers.length,
            connectedPlayers: this.playerSockets.size
        };
    }
}

module.exports = GameSocket; 