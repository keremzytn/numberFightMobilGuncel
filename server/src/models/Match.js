const client = require('../config/database');

class Match {
    static async create(matchData) {
        await client.connect();
        const db = client.db('cardgame');
        return await db.collection('matches').insertOne(matchData);
    }

    static async findAllByUser(userId) {
        await client.connect();
        const db = client.db('cardgame');
        return await db.collection('matches').find({
            $or: [
                { player1Id: userId },
                { player2Id: userId }
            ]
        }).toArray();
    }

    static async findAll() {
        await client.connect();
        const db = client.db('cardgame');
        return await db.collection('matches').find({}).toArray();
    }
}

module.exports = Match; 