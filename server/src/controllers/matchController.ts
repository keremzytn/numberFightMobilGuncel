import { Request, Response } from 'express';
import { Match } from '../models/Match';

export class MatchController {
    private match: Match;

    constructor(mongoUri: string) {
        this.match = new Match(mongoUri);
    }

    createMatch = async (req: Request, res: Response): Promise<void> => {
        try {
            const matchData = req.body;
            const result = await Match.create(matchData);
            res.status(201).json({ success: true, matchId: result.toString() });
        } catch (error) {
            res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' });
        }
    };

    getAllMatches = async (_req: Request, res: Response): Promise<void> => {
        try {
            const matches = await Match.findAll();
            res.status(200).json({ success: true, matches });
        } catch (error) {
            res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' });
        }
    };

    getUserMatches = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.params.userId;
            const matches = await Match.findAllByUser(userId);
            res.status(200).json({ success: true, matches });
        } catch (error) {
            res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' });
        }
    };
} 