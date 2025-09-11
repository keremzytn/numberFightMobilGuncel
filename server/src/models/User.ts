import mongoose from 'mongoose';
import { IUser } from '../types/user';

const userSchema = new mongoose.Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gold: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', userSchema);