import { MongoClient, ObjectId, WithId, Document } from 'mongodb';
import { IMatch } from '../types/match';

export class Match {
    private static client: MongoClient;

    constructor(mongoUri: string) {
        Match.client = new MongoClient(mongoUri);
    }

    static async create(matchData: Omit<IMatch, 'createdAt'>): Promise<ObjectId> {
        try {
            await this.client.connect();
            const db = this.client.db('cardgame');
            const result = await db.collection('matches').insertOne({
                ...matchData,
                createdAt: new Date()
            });
            return result.insertedId;
        } finally {
            await this.client.close();
        }
    }

    static async findAllByUser(userId: string): Promise<IMatch[]> {
        try {
            await this.client.connect();
            const db = this.client.db('cardgame');
            const matches = await db.collection('matches').find({
                $or: [
                    { player1Id: userId },
                    { player2Id: userId }
                ]
            }).toArray();
            return matches.map((match: WithId<Document>) => ({
                ...match,
                _id: match._id.toString()
            })) as unknown as IMatch[];
        } finally {
            await this.client.close();
        }
    }

    static async findAll(): Promise<IMatch[]> {
        try {
            await this.client.connect();
            const db = this.client.db('cardgame');
            const matches = await db.collection('matches').find({}).toArray();
            return matches.map((match: WithId<Document>) => ({
                ...match,
                _id: match._id.toString()
            })) as unknown as IMatch[];
        } finally {
            await this.client.close();
        }
    }
} 