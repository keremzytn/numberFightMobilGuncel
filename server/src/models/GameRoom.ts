import { v4 as uuidv4 } from 'uuid';
import { Match } from './Match';
import { IGameState, IRoundResult, IGameResult, GameStatus } from '../types/gameRoom';

export class GameRoom {
    private id: string;
    private player1Id: string;
    private player2Id: string;
    private currentRound: number;
    private player1Score: number;
    private player2Score: number;
    private player1UsedCards: number[];
    private player2UsedCards: number[];
    private player1ForbiddenCards: number[];
    private player2ForbiddenCards: number[];
    private player1Card: number | null;
    private player2Card: number | null;
    private roundTimer: NodeJS.Timeout | null;
    private status: GameStatus;
    private winner: string | null;
    private roundStartTime: number | null;
    private readyPlayers: Set<string>;

    get gameId(): string {
        return this.id;
    }

    get firstPlayerId(): string {
        return this.player1Id;
    }

    get secondPlayerId(): string {
        return this.player2Id;
    }

    getStatus(): GameStatus {
        return this.status;
    }

    setStatus(status: GameStatus): void {
        this.status = status;
    }

    constructor(player1Id: string, player2Id: string) {
        this.id = uuidv4();
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.currentRound = 1;
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1UsedCards = [];
        this.player2UsedCards = [];
        this.player1ForbiddenCards = [];
        this.player2ForbiddenCards = [];
        this.player1Card = null;
        this.player2Card = null;
        this.roundTimer = null;
        this.status = 'waiting';
        this.winner = null;
        this.roundStartTime = null;
        this.readyPlayers = new Set<string>();
    }

    getReadyPlayers(): Set<string> {
        return this.readyPlayers;
    }

    setReadyPlayers(players: Set<string>): void {
        this.readyPlayers = players;
    }

    getValidCards(playerId: string): number[] {
        const usedCards = playerId === this.player1Id ? this.player1UsedCards : this.player2UsedCards;
        const forbiddenCards = playerId === this.player1Id ? this.player1ForbiddenCards : this.player2ForbiddenCards;
        const allCards = [1, 2, 3, 4, 5, 6, 7];
        if (this.currentRound === 7) {
            return allCards.filter(card => !usedCards.includes(card));
        }
        return allCards.filter(card => !usedCards.includes(card) && !forbiddenCards.includes(card));
    }

    getForbiddenCards(playerId: string): number[] {
        return playerId === this.player1Id ? this.player1ForbiddenCards : this.player2ForbiddenCards;
    }

    playCard(playerId: string, cardNumber: number): void {
        if (this.status !== 'playing') {
            throw new Error('Game is not in playing state');
        }

        const validCards = this.getValidCards(playerId);
        if (!validCards.includes(cardNumber)) {
            throw new Error('Invalid card selection');
        }

        if (playerId === this.player1Id) {
            this.player1Card = cardNumber;
        } else {
            this.player2Card = cardNumber;
        }

        if (this.player1Card !== null && this.player2Card !== null) {
            this.resolveRound();
        }
    }

    resolveRound(): IRoundResult {
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }

        let roundWinner: string | null = null;
        if (this.player1Card !== null && this.player2Card !== null) {
            if (this.player1Card > this.player2Card) {
                roundWinner = this.player1Id;
                this.player1Score++;
            } else if (this.player2Card > this.player1Card) {
                roundWinner = this.player2Id;
                this.player2Score++;
            }

            this.player1UsedCards.push(this.player1Card);
            this.player2UsedCards.push(this.player2Card);

            this.updateForbiddenCards(this.player1Id, this.player1Card);
            this.updateForbiddenCards(this.player2Id, this.player2Card);

            // Reset cards and increment round
            this.player1Card = null;
            this.player2Card = null;
            this.currentRound++;
        }

        const roundResult: IRoundResult = {
            round: this.currentRound - 1,
            player1Card: this.player1Card,
            player2Card: this.player2Card,
            winner: roundWinner,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
        };

        return roundResult;
    }

    private updateForbiddenCards(playerId: string, lastPlayedCard: number): void {
        const forbiddenCards: number[] = [];
        if (lastPlayedCard > 1) {
            forbiddenCards.push(lastPlayedCard - 1);
        }
        if (lastPlayedCard < 7) {
            forbiddenCards.push(lastPlayedCard + 1);
        }

        const usedCards = playerId === this.player1Id ? this.player1UsedCards : this.player2UsedCards;
        const validForbiddenCards = forbiddenCards.filter(card => !usedCards.includes(card));

        if (playerId === this.player1Id) {
            this.player1ForbiddenCards = validForbiddenCards;
        } else {
            this.player2ForbiddenCards = validForbiddenCards;
        }
    }

    startRound(): IGameState {
        this.status = 'playing';
        this.roundStartTime = Date.now();
        return this.getGameState();
    }

    handleTimeOut(): IRoundResult | null {
        if (this.player1Card === null) {
            const validCards = this.getValidCards(this.player1Id);
            if (validCards.length > 0) {
                this.player1Card = Math.min(...validCards);
            }
        }

        if (this.player2Card === null) {
            const validCards = this.getValidCards(this.player2Id);
            if (validCards.length > 0) {
                this.player2Card = Math.min(...validCards);
            }
        }

        if (this.player1Card !== null && this.player2Card !== null) {
            return this.resolveRound();
        }
        return null;
    }

    async endGame(): Promise<IGameResult> {
        this.status = 'finished';

        if (this.player1Score > this.player2Score) {
            this.winner = this.player1Id;
        } else if (this.player2Score > this.player1Score) {
            this.winner = this.player2Id;
        } else {
            this.winner = null;
        }

        await Match.create({
            player1Id: this.player1Id,
            player2Id: this.player2Id,
            score: {
                player1: this.player1Score,
                player2: this.player2Score
            },
            winner: this.winner || undefined
        });

        return {
            winner: this.winner,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            totalRounds: 7
        };
    }

    getGameState(): IGameState {
        return {
            gameId: this.id,
            currentRound: this.currentRound,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            status: this.status,
            roundStartTime: this.roundStartTime,
            validCards: [],
            forbiddenCards: [],
            opponentId: ''
        };
    }
} 