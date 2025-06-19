const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

router.post('/', async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        await client.connect();
        const db = client.db('cardgame');
        const users = db.collection('users');

        const existingUser = await users.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Kullanıcı adı veya email zaten kullanımda' });
        }

        await users.insertOne({
            username,
            email,
            password: hashedPassword,
            createdAt: new Date(),
        });

        res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    } finally {
        await client.close();
    }
});

module.exports = router; 