const bcrypt = require('bcrypt');
const User = require('../models/User');

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await User.findByEmailOrUsername(email, username);
        if (existingUser) {
            return res.status(400).json({ message: 'Kullanıcı adı veya email zaten kullanımda' });
        }

        await User.create({
            username,
            email,
            password: hashedPassword,
            createdAt: new Date(),
        });

        res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmailOrUsername(email, email);

        if (!user) {
            return res.status(401).json({ message: 'Geçersiz email veya şifre' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Geçersiz email veya şifre' });
        }

        res.json({ message: 'Giriş başarılı', user: { id: user._id, email: user.email, username: user.username } });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatası' });
    }
};

module.exports = {
    register,
    login
}; 