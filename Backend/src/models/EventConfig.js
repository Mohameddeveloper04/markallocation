// ============================================================
//  Backend/src/models/EventConfig.js
//  Mongoose model — stores dynamic round configuration per event.
// ============================================================

import mongoose from 'mongoose';

const eventConfigSchema = new mongoose.Schema(
    {
        eventName: {
            type: String,
            required: true,
            unique: true
        },
        rounds: [
            {
                roundName: { type: String, required: true },
                maxMarks: { type: Number, required: true }
            }
        ]
    },
    {
        timestamps: true,
    }
);

const EventConfig =
    mongoose.models.EventConfig ||
    mongoose.model('EventConfig', eventConfigSchema);

export default EventConfig;
