// ============================================================
//  Backend/src/models/Participant.js
//  Mongoose model — stores onboarded participant data in MongoDB.
//  Fields are kept flexible; update them once the real API
//  response structure is confirmed.
// ============================================================

import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
    {
        // ── Identity ─────────────────────────────────────────────
        registrationId: { type: String, index: true },
        name: { type: String },
        email: { type: String }, // stored but NOT sent to frontend

        // ── Institution ──────────────────────────────────────────
        college: { type: String },
        department: { type: String },
        year: { type: String },

        // ── Event ────────────────────────────────────────────────
        event: { type: String },
        status: { type: String, default: 'confirmed' },

        // ── Marks ────────────────────────────────────────────────
        marks: {
            type: Map,
            of: Number,
            default: {}
        },

        // ── Raw API data (for debugging / future use) ────────────
        rawData: { type: mongoose.Schema.Types.Mixed },
    },
    {
        timestamps: true, // createdAt + updatedAt
    }
);

// Avoid model re-registration in hot-reload
const Participant =
    mongoose.models.Participant ||
    mongoose.model('Participant', participantSchema);

export default Participant;
