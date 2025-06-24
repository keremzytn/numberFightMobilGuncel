import { Router } from 'express';
import { MatchController } from '../controllers/matchController';

const router = Router();
const matchController = new MatchController(process.env.MONGODB_URI || '');

router.post('/', matchController.createMatch);
router.get('/', matchController.getAllMatches);
router.get('/user/:userId', matchController.getUserMatches);

export default router; 