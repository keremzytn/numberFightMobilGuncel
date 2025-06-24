export interface IMatch {
    player1Id: string;
    player2Id: string;
    winner?: string;
    score: {
        player1: number;
        player2: number;
    };
    createdAt: Date;
}

export interface IUserRegistration {
    username: string;
    email: string;
    password: string;
} 