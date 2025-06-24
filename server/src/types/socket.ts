import { Socket } from 'socket.io';
import { IGameState } from './gameRoom';

export interface IMatchFoundData {
    gameId: string;
    opponentId: string;
    isPlayer1: boolean;
}

export interface IPlayCardData {
    gameId: string;
    cardNumber: number;
}

export interface IGameStats {
    activeGames: number;
    waitingPlayers: number;
    connectedPlayers: number;
}

export interface IRoundStartData extends IGameState {
    validCards: number[];
    forbiddenCards: number[];
}

export interface IPlayerSocket extends Socket {
    gameId?: string;
} 