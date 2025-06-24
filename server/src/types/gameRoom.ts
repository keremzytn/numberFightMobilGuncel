export interface IGameState {
    gameId: string;
    currentRound: number;
    player1Score: number;
    player2Score: number;
    status: GameStatus;
    roundStartTime: number | null;
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