// ============================================================
//  Backend/server.js  —  Express application entry point
// ============================================================

import 'dotenv/config';
import dns from 'dns';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import participantRoutes from './src/routes/participants.js';
import eventConfigRoutes from './src/routes/eventConfigs.js';

// Windows Node DNS fix for mongodb+srv:// SRV lookups
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    console.warn('Could not set custom DNS servers:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));

// ── Routes ────────────────────────────────────────────────
app.use('/api/participants', participantRoutes);
app.use('/api/event-configs', eventConfigRoutes);

app.get('/', (_req, res) => {
    res.json({ name: 'Pointers Backend', version: '1.0.0', status: 'running' });
});

// 404 fallback
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ── Connect to MongoDB then start server ──────────────────
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌  MONGODB_URI is not set in .env');
    process.exit(1);
}

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅  MongoDB connected');
        app.listen(PORT, () => {
            console.log(`✅  Backend running on http://localhost:${PORT}`);
            console.log(`    Participants API → GET  http://localhost:${PORT}/api/participants`);
            console.log(`    Sync endpoint   → POST http://localhost:${PORT}/api/participants/sync`);
        });
    })
    .catch((err) => {
        console.error('❌  MongoDB connection failed:', err.message);
        console.log('⚠️   Starting server anyway to serve external API data...');
        app.listen(PORT, () => {
            console.log(`✅  Backend running on http://localhost:${PORT} (without DB)`);
        });
    });
