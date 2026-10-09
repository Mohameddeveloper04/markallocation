// ============================================================
//  Backend/src/routes/eventConfigs.js
//  API routes for managing dynamic mark allocation rounds
// ============================================================

import express from 'express';
import mongoose from 'mongoose';
import EventConfig from '../models/EventConfig.js';

const router = express.Router();
const inMemoryConfigs = new Map();

// GET /api/event-configs/:eventName
router.get('/:eventName', async (req, res) => {
    try {
        const { eventName } = req.params;

        if (mongoose.connection.readyState === 1) {
            const config = await EventConfig.findOne({ eventName });
            if (config) {
                inMemoryConfigs.set(eventName, config.rounds);
                return res.json({ success: true, rounds: config.rounds });
            }
        }

        const cached = inMemoryConfigs.get(eventName) || [];
        res.json({ success: true, rounds: cached });
    } catch (err) {
        console.error(`[GET /api/event-configs/${req.params.eventName}]`, err.message);
        const cached = inMemoryConfigs.get(req.params.eventName) || [];
        res.json({ success: true, rounds: cached });
    }
});

// POST /api/event-configs/:eventName
// Overwrites or creates the rounds configuration for the event
router.post('/:eventName', async (req, res) => {
    try {
        const { eventName } = req.params;
        const { rounds } = req.body; // expected: [{ roundName: 'x', maxMarks: 100 }]

        inMemoryConfigs.set(eventName, rounds || []);

        if (mongoose.connection.readyState === 1) {
            let config = await EventConfig.findOne({ eventName });
            if (config) {
                config.rounds = rounds;
                await config.save();
            } else {
                config = await EventConfig.create({ eventName, rounds });
            }
        }

        res.json({ success: true, rounds: rounds || [] });
    } catch (err) {
        console.error(`[POST /api/event-configs/${req.params.eventName}]`, err.message);
        res.json({ success: true, rounds: req.body?.rounds || [] });
    }
});

export default router;
