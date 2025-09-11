import mongoose from 'mongoose';

export const MONGODB_URI = 'mongodb://127.0.0.1:27017/cardgame';

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error('Veritabanına bağlanılamadı. Lütfen MongoDB servisinin çalıştığından emin olun.');
    }
}; 