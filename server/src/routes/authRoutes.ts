import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController(process.env.MONGODB_URI || '');

router.post('/register', authController.register);
router.post('/login', authController.login);

export default router; 