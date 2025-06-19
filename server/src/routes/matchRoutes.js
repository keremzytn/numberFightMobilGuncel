const express = require('express');
const router = express.Router();
const { createMatch, getAllMatches, getUserMatches } = require('../controllers/matchController');

router.post('/', createMatch);
router.get('/', getAllMatches);
router.get('/user/:userId', getUserMatches);

module.exports = router; 