export interface IUser {
    username: string;
    email: string;
    password: string;
    gold: number;
    createdAt: Date;
}

export interface IUserRegistration {
    username: string;
    email: string;
    password: string;
} 