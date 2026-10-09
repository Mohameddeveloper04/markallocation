// ============================================================
//  Backend/src/routes/participants.js
//  GET  /api/participants       — returns participants from MongoDB (or cache)
//  POST /api/participants/sync  — fetches from external API, stores participants & marks to MongoDB
//  PATCH /api/participants/:id/marks — updates participant marks in MongoDB
// ============================================================

import express from 'express';
import mongoose from 'mongoose';
import { fetchOnboardedFromAPI } from '../services/registrationApi.js';
import Participant from '../models/Participant.js';
import ParticipantMark from '../models/ParticipantMark.js';

const router = express.Router();

let cachedParticipants = [];

// ── Helpers ────────────────────────────────────────────────────────────────
const normalizeMarks = (marks) => {
    if (!marks) return {};
    if (marks instanceof Map) return Object.fromEntries(marks);
    if (typeof marks === 'object') return { ...marks };
    return {};
};

const mapToParticipant = (raw, marks = {}) => ({
    registrationId: raw.registrationId || raw._id || raw.teamName || raw.leader?.email,
    name: raw.leader?.name || raw.teamName || null,
    college: raw.college || raw.leader?.college || null,
    department: raw.department || raw.leader?.department || null,
    year: raw.year || raw.leader?.year || null,
    event: raw.eventName || raw.eventType || null,
    status: raw.status || 'confirmed',
    teamName: raw.teamName || null,
    teamSize: raw.teamSize || null,
    members: raw.members || [],
    marks: normalizeMarks(marks),
});

const formatDbParticipant = (p) => ({
    registrationId: p.registrationId,
    name: p.name,
    college: p.college,
    department: p.department,
    year: p.year,
    event: p.event,
    status: p.status || 'confirmed',
    teamName: p.teamName || null,
    teamSize: p.teamSize || null,
    members: p.members || [],
    marks: normalizeMarks(p.marks),
});

const unwrapArray = (data) =>
    Array.isArray(data)
        ? data
        : data?.data ?? data?.registrations ??
        data?.results ?? data?.participants ?? [];

// ── GET /api/participants ─────────────────────────────────────────────────
// Returns participants from MongoDB, with fallback to in-memory cache
router.get('/', async (_req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const dbParticipants = await Participant.find({}).sort({ createdAt: -1 }).lean();
            if (dbParticipants.length > 0) {
                // Ensure latest marks from ParticipantMark are combined
                const allMarks = await ParticipantMark.find({}).lean();
                const marksMap = {};
                for (const m of allMarks) {
                    marksMap[m.registrationId] = normalizeMarks(m.marks);
                }

                const participants = dbParticipants.map(p => ({
                    registrationId: p.registrationId,
                    name: p.name,
                    college: p.college,
                    department: p.department,
                    year: p.year,
                    event: p.event,
                    status: p.status || 'confirmed',
                    teamName: p.teamName || null,
                    teamSize: p.teamSize || null,
                    members: p.members || [],
                    marks: { ...normalizeMarks(p.marks), ...(marksMap[p.registrationId] || {}) },
                }));

                cachedParticipants = participants;
                return res.json({
                    success: true,
                    total: participants.length,
                    participants,
                });
            }
        }

        res.json({
            success: true,
            total: cachedParticipants.length,
            participants: cachedParticipants,
        });
    } catch (err) {
        console.error('[GET /api/participants] ERROR:', err.message);
        res.json({
            success: true,
            total: cachedParticipants.length,
            participants: cachedParticipants,
        });
    }
});

// ── POST /api/participants/sync ───────────────────────────────────────────
// Called when user clicks "Sync Now". Fetches live data from external API,
// stores participant details and marks in MongoDB.
router.post('/sync', async (req, res) => {
    try {
        const rawResponse = await fetchOnboardedFromAPI();
        const rawArray = unwrapArray(rawResponse);

        if (!rawArray.length) {
            return res.json({
                success: true,
                synced: 0,
                total: 0,
                message: 'No participants found in the registration API.',
                participants: [],
            });
        }

        // When DB is connected, fetch existing marks to preserve them
        const isDbConnected = mongoose.connection.readyState === 1;
        const markMap = {};

        if (isDbConnected) {
            const regIds = rawArray.map(r => r.registrationId || r._id || r.teamName || r.leader?.email).filter(Boolean);
            const [existingParticipants, existingMarks] = await Promise.all([
                Participant.find({ registrationId: { $in: regIds } }).lean(),
                ParticipantMark.find({ registrationId: { $in: regIds } }).lean(),
            ]);

            for (const ep of existingParticipants) {
                if (ep.registrationId) {
                    markMap[ep.registrationId] = normalizeMarks(ep.marks);
                }
            }
            for (const em of existingMarks) {
                if (em.registrationId) {
                    markMap[em.registrationId] = {
                        ...(markMap[em.registrationId] || {}),
                        ...normalizeMarks(em.marks),
                    };
                }
            }

            // Save/upsert all participants into MongoDB
            for (const raw of rawArray) {
                const regId = raw.registrationId || raw._id || raw.teamName || raw.leader?.email;
                if (!regId) continue;

                const currentMarks = markMap[regId] || {};

                await Participant.findOneAndUpdate(
                    { registrationId: regId },
                    {
                        $set: {
                            registrationId: regId,
                            name: raw.leader?.name || raw.teamName || null,
                            email: raw.leader?.email || null,
                            phone: raw.leader?.phone || null,
                            college: raw.college || raw.leader?.college || null,
                            department: raw.department || raw.leader?.department || null,
                            year: raw.year || raw.leader?.year || null,
                            event: raw.eventName || raw.eventType || null,
                            status: raw.status || 'confirmed',
                            teamName: raw.teamName || null,
                            teamSize: raw.teamSize || null,
                            members: raw.members || [],
                            rawData: raw,
                            marks: currentMarks,
                        },
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                // Also ensure ParticipantMark has a corresponding record
                await ParticipantMark.findOneAndUpdate(
                    { registrationId: regId },
                    { $set: { marks: currentMarks } },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            }

            // Fetch final stored list from MongoDB to ensure consistency
            const savedDbParticipants = await Participant.find({}).sort({ createdAt: -1 }).lean();
            const participants = savedDbParticipants.map(p => ({
                registrationId: p.registrationId,
                name: p.name,
                college: p.college,
                department: p.department,
                year: p.year,
                event: p.event,
                status: p.status || 'confirmed',
                teamName: p.teamName || null,
                teamSize: p.teamSize || null,
                members: p.members || [],
                marks: normalizeMarks(p.marks),
            }));

            cachedParticipants = participants;

            return res.json({
                success: true,
                synced: rawArray.length,
                total: participants.length,
                participants,
            });
        }

        // Fallback if DB is temporarily offline
        const participants = rawArray.map(r => mapToParticipant(r, {}));
        cachedParticipants = participants;

        res.json({
            success: true,
            synced: participants.length,
            total: participants.length,
            participants,
        });
    } catch (err) {
        console.error('[POST /api/participants/sync] ERROR:', err.message);
        console.error('  Code:', err.code);
        console.error('  Status:', err.response?.status);
        console.error('  Response data:', err.response?.data);
        const status = err.response?.status;
        if (status === 401 || status === 403) {
            return res.status(401).json({ success: false, message: 'Registration API authentication failed.' });
        }
        res.status(502).json({ success: false, message: 'Could not reach the registration API.' });
    }
});

// ── PATCH /api/participants/:id/marks ─────────────────────────────────────
// Saves participant marks to MongoDB (both Participant and ParticipantMark collections)
router.patch('/:id/marks', async (req, res) => {
    try {
        const registrationId = req.params.id;
        const { marks } = req.body;
        if (!registrationId) return res.status(400).json({ success: false, message: 'Missing ID' });

        let updatedMarks = { ...(marks || {}) };

        // Save to DB if connected
        if (mongoose.connection.readyState === 1) {
            // 1. Update or create ParticipantMark
            let pMark = await ParticipantMark.findOne({ registrationId });
            if (!pMark) pMark = new ParticipantMark({ registrationId, marks: {} });

            for (const [round, score] of Object.entries(marks || {})) {
                pMark.marks.set(round, score);
            }
            await pMark.save();
            updatedMarks = normalizeMarks(pMark.marks);

            // 2. Also update Participant collection's marks field
            await Participant.findOneAndUpdate(
                { registrationId },
                { $set: { marks: updatedMarks } },
                { upsert: false }
            );
        }

        // Keep in-memory cache updated as well
        const cached = cachedParticipants.find(p => p.registrationId === registrationId);
        if (cached) {
            cached.marks = { ...(cached.marks || {}), ...updatedMarks };
        }

        res.json({ success: true, marks: updatedMarks });
    } catch (err) {
        console.error('[PATCH /api/participants/:id/marks] ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Failed to update marks' });
    }
});

// ── DELETE /api/participants/:id ──────────────────────────────────────────
// Removes participant and their allocated marks from MongoDB
router.delete('/:id', async (req, res) => {
    try {
        const registrationId = req.params.id;
        if (!registrationId) return res.status(400).json({ success: false, message: 'Missing participant ID' });

        if (mongoose.connection.readyState === 1) {
            await Promise.all([
                Participant.deleteOne({ registrationId }),
                ParticipantMark.deleteOne({ registrationId }),
            ]);
        }

        // Remove from in-memory cache
        cachedParticipants = cachedParticipants.filter(p => p.registrationId !== registrationId);

        res.json({
            success: true,
            message: `Participant #${registrationId} removed from database`,
            registrationId,
        });
    } catch (err) {
        console.error('[DELETE /api/participants/:id] ERROR:', err.message);
        res.status(500).json({ success: false, message: 'Failed to remove participant from database' });
    }
});

export default router;
