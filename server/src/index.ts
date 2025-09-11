import express from 'express';
import { connectDB } from './config/database';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import matchRoutes from './routes/matchRoutes';
import { initializeSocket } from './socket/gameSocket';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/match', matchRoutes);

const startServer = async () => {
    try {
        await connectDB();
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`Server running on port ${port}`);
        });
        initializeSocket(server);
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 