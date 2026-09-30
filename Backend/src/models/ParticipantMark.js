// ============================================================
//  Backend/src/models/ParticipantMark.js
//  Mongoose model — stores assigned marks by registrationId
// ============================================================

import mongoose from 'mongoose';

const participantMarkSchema = new mongoose.Schema(
    {
        registrationId: {
            type: String,
            required: true,
            unique: true
        },
        marks: {
            type: Map,
            of: Number,
            default: {}
        }
    },
    {
        timestamps: true,
    }
);

const ParticipantMark =
    mongoose.models.ParticipantMark ||
    mongoose.model('ParticipantMark', participantMarkSchema);

export default ParticipantMark;
