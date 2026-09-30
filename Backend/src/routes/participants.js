// ============================================================
//  Backend/src/routes/participants.js
//  Exposes:
//    GET  /api/participants       — all onboarded participants
//    POST /api/participants/sync  — force-sync from registration API
// ============================================================

import express from 'express';
import { fetchOnboardedFromAPI } from '../services/registrationApi.js';
import ParticipantMark from '../models/ParticipantMark.js';

const router = express.Router();

// ── Helper: map raw API data → Participant fields ──────────────────────────
const mapToParticipant = (raw) => {
    return {
        registrationId: raw._id || raw.teamName || raw.leader?.email,
        name: raw.leader?.name || raw.teamName || null,
        email: raw.leader?.email || null,
        college: null,
        department: null,
        year: null,
        event: raw.eventName || raw.eventType || null,
        status: 'confirmed',
        rawData: raw,
    };
};

const unwrapArray = (data) =>
    Array.isArray(data)
        ? data
        : data?.data ?? data?.registrations ??
        data?.results ?? data?.participants ?? [];

// ── Helper: merge marks from DB ───────────────────────────────────────────
const mergeMarks = async (participantsList) => {
    const regIds = participantsList.map(p => p.registrationId);
    const marksData = await ParticipantMark.find({ registrationId: { $in: regIds } });
    const markMap = {};
    marksData.forEach(m => { markMap[m.registrationId] = Object.fromEntries(m.marks); });

    return participantsList.map(p => ({
        ...p,
        marks: markMap[p.registrationId] || {}
    }));
};

// ── GET /api/participants ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const rawResponse = await fetchOnboardedFromAPI();
        const rawArray = unwrapArray(rawResponse);

        let participants = rawArray.map(raw => {
            const p = mapToParticipant(raw);
            delete p.email;
            delete p.rawData;
            return p;
        });

        participants = await mergeMarks(participants);

        res.json({
            success: true,
            total: participants.length,
            participants,
        });
    } catch (err) {
        console.error('[GET /api/participants]', err.message);
        res.status(502).json({
            success: false,
            message: 'Unable to load participants from registration API.',
        });
    }
});

// ── POST /api/participants/sync ───────────────────────────────────────────
router.post('/sync', async (req, res) => {
    try {
        const rawResponse = await fetchOnboardedFromAPI();
        const rawArray = unwrapArray(rawResponse);

        if (!rawArray.length) {
            return res.json({
                success: true,
                synced: 0,
                message: 'No participants found in the registration API.',
                participants: [],
            });
        }

        let participants = rawArray.map(raw => {
            const p = mapToParticipant(raw);
            delete p.email;
            delete p.rawData;
            return p;
        });

        participants = await mergeMarks(participants);

        res.json({
            success: true,
            synced: participants.length,
            total: participants.length,
            participants,
        });
    } catch (err) {
        console.error('[POST /api/participants/sync]', err.message);
        const status = err.response?.status;
        if (status === 401 || status === 403) {
            return res.status(502).json({ success: false, message: 'Registration API authentication failed.' });
        }
        res.status(502).json({ success: false, message: 'Could not reach the registration API.' });
    }
});

// ── PATCH /api/participants/:id/marks ─────────────────────────────────────
router.patch('/:id/marks', async (req, res) => {
    try {
        const registrationId = req.params.id;
        const { marks } = req.body;
        if (!registrationId) return res.status(400).json({ success: false, message: 'Missing ID' });

        let pMark = await ParticipantMark.findOne({ registrationId });
        if (!pMark) pMark = new ParticipantMark({ registrationId, marks: {} });

        // Merge or overwrite marks
        for (const [round, score] of Object.entries(marks || {})) {
            pMark.marks.set(round, score);
        }
        await pMark.save();

        res.json({ success: true, marks: Object.fromEntries(pMark.marks) });
    } catch (err) {
        console.error('[PATCH /api/participants/:id/marks]', err.message);
        res.status(500).json({ success: false, message: 'Failed to update marks' });
    }
});

export default router;
