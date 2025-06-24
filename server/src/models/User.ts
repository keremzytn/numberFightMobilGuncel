import { MongoClient, ObjectId } from 'mongodb';
import { IUser, IUserRegistration } from '../types/user';

export class User {
    private static client: MongoClient;

    constructor(mongoUri: string) {
        User.client = new MongoClient(mongoUri);
    }

    static async findByEmailOrUsername(email: string, username: string): Promise<IUser | null> {
        try {
            await this.client.connect();
            const db = this.client.db('cardgame');
            const user = await db.collection('users').findOne({
                $or: [{ email }, { username }]
            });
            return user as IUser | null;
        } finally {
            await this.client.close();
        }
    }

    static async create(userData: IUserRegistration): Promise<ObjectId> {
        try {
            await this.client.connect();
            const db = this.client.db('cardgame');
            const result = await db.collection('users').insertOne({
                ...userData,
                createdAt: new Date()
            });
            return result.insertedId;
        } finally {
            await this.client.close();
        }
    }
} 