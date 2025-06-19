const client = require('../config/database');

class User {
    static async findByEmailOrUsername(email, username) {
        await client.connect();
        const db = client.db('cardgame');
        return await db.collection('users').findOne({ $or: [{ email }, { username }] });
    }

    static async create(userData) {
        await client.connect();
        const db = client.db('cardgame');
        return await db.collection('users').insertOne(userData);
    }
}

module.exports = User; 