const Match = require('../models/Match');

exports.createMatch = async (req, res) => {
    try {
        const matchData = req.body;
        const result = await Match.create(matchData);
        res.status(201).json({ success: true, matchId: result.insertedId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAllMatches = async (req, res) => {
    try {
        const matches = await Match.findAll();
        res.status(200).json({ success: true, matches });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getUserMatches = async (req, res) => {
    try {
        const userId = req.params.userId;
        const matches = await Match.findAllByUser(userId);
        res.status(200).json({ success: true, matches });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}; 