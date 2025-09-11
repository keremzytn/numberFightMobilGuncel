import { Router } from 'express';
import { MatchController } from '../controllers/matchController';

const router = Router();
const matchController = new MatchController('mongodb://127.0.0.1:27017/cardgame');

router.post('/', matchController.createMatch);
router.get('/', matchController.getAllMatches);
router.get('/user/:userId', matchController.getUserMatches);

export default router; 