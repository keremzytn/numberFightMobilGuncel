export interface IGameState {
    gameId: string;
    currentRound: number;
    player1Score: number;
    player2Score: number;
    status: GameStatus;
    roundStartTime: number | null;
    opponentId: string;
    validCards: number[];
    forbiddenCards: number[];
}

export interface IRoundResult {
    round: number;
    player1Card: number | null;
    player2Card: number | null;
    winner: string | null;
    player1Score: number;
    player2Score: number;
}

export interface IGameResult {
    winner: string | null;
    player1Score: number;
    player2Score: number;
    totalRounds: number;
}

export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface IGameRoom {
    id: string;
    players: string[];
    currentRound: number;
    playerStates: {
        [playerId: string]: {
            gold: number;
            cards: string[];
            score: number;
        }
    };
    status: 'waiting' | 'playing' | 'finished';
    createdAt: Date;
} 