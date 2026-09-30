// ============================================================
//  Backend/src/routes/eventConfigs.js
//  API routes for managing dynamic mark allocation rounds
// ============================================================

import express from 'express';
import EventConfig from '../models/EventConfig.js';

const router = express.Router();

// GET /api/event-configs/:eventName
router.get('/:eventName', async (req, res) => {
    try {
        const { eventName } = req.params;
        const config = await EventConfig.findOne({ eventName });

        if (!config) {
            return res.json({ success: true, rounds: [] });
        }

        res.json({ success: true, rounds: config.rounds });
    } catch (err) {
        console.error(`[GET /api/event-configs/${req.params.eventName}]`, err.message);
        res.status(500).json({ success: false, message: 'Server error fetching event config' });
    }
});

// POST /api/event-configs/:eventName
// Overwrites or creates the rounds configuration for the event
router.post('/:eventName', async (req, res) => {
    try {
        const { eventName } = req.params;
        const { rounds } = req.body; // expected: [{ roundName: 'x', maxMarks: 100 }]

        let config = await EventConfig.findOne({ eventName });

        if (config) {
            config.rounds = rounds;
            await config.save();
        } else {
            config = await EventConfig.create({ eventName, rounds });
        }

        res.json({ success: true, rounds: config.rounds });
    } catch (err) {
        console.error(`[POST /api/event-configs/${req.params.eventName}]`, err.message);
        res.status(500).json({ success: false, message: 'Server error saving event config' });
    }
});

export default router;
