import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import { IUser, IUserRegistration } from '../types/user';

export class UserService {
    private client: MongoClient;

    constructor(uri: string) {
        this.client = new MongoClient(uri);
    }

    async register(userData: IUserRegistration): Promise<void> {
        try {
            await this.client.connect();
            const db = this.client.db('cardgame');
            const users = db.collection('users');

            const existingUser = await users.findOne({
                $or: [{ email: userData.email }, { username: userData.username }]
            });

            if (existingUser) {
                throw new Error('Kullanıcı adı veya email zaten kullanımda');
            }

            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const user: IUser = {
                ...userData,
                password: hashedPassword,
                createdAt: new Date()
            };

            await users.insertOne(user);
        } finally {
            await this.client.close();
        }
    }

    async login(email: string, password: string): Promise<{ id: string; email: string; username: string }> {
        try {
            await this.client.connect();
            const db = this.client.db('cardgame');
            const users = db.collection('users');

            const user = await users.findOne({ $or: [{ email }, { username: email }] });

            if (!user) {
                throw new Error('Geçersiz email veya şifre');
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                throw new Error('Geçersiz email veya şifre');
            }

            return {
                id: user._id.toString(),
                email: user.email,
                username: user.username
            };
        } finally {
            await this.client.close();
        }
    }
} 