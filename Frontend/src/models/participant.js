// ============================================================
//  src/models/participant.js
//  ─────────────────────────────────────────────────────────
//  Internal Participant data model used throughout the website.
//
//  This model is intentionally decoupled from the external API
//  response shape. The participantMapper converts API responses
//  into this standard shape.
//
//  When the real API documentation arrives, update ONLY the
//  mapper (src/utils/participantMapper.js) — this model stays
//  stable and the rest of the UI continues to work unchanged.
// ============================================================

/**
 * Factory function to create a Participant object.
 *
 * All fields default to null so the UI can gracefully handle
 * missing data without crashing.
 *
 * @param {object} data - Raw field values
 * @returns {Participant}
 */
export const createParticipant = (data = {}) => ({
    /** Unique internal ID (may be the API's own id or registrationId) */
    id: data.id ?? null,

    /** Registration ID visible to the participant (e.g. "REG-2024-001") */
    registrationId: data.registrationId ?? null,

    /** Full name of the participant */
    name: data.name ?? null,

    /** Name of the participant's college / institution */
    college: data.college ?? null,

    /** Department / branch (e.g. "Computer Science") */
    department: data.department ?? null,

    /** Year of study (e.g. "3rd Year" or just "3") */
    year: data.year ?? null,

    /** Event or category the participant registered for */
    event: data.event ?? null,

    /**
     * Registration status.
     * Typical values: "confirmed" | "pending" | "waitlisted" | "cancelled"
     * Adjust to match actual API status values once known.
     */
    status: data.status ?? null,

    // ── Fields below are kept for flexibility ─────────────────────────────
    // Uncomment the ones the real API actually returns.

    // email:    data.email     ?? null,   // ← do NOT display publicly
    // phone:    data.phone     ?? null,   // ← do NOT display publicly
    // teamName: data.teamName  ?? null,
    // teamSize: data.teamSize  ?? null,
});

/**
 * Status badge labels and colour tokens.
 *
 * TODO: Replace keys with the actual status strings returned by the API.
 */
export const STATUS_LABELS = {
    confirmed: { label: 'Confirmed', color: 'status-confirmed' },
    pending: { label: 'Pending', color: 'status-pending' },
    waitlisted: { label: 'Waitlisted', color: 'status-waitlisted' },
    cancelled: { label: 'Cancelled', color: 'status-cancelled' },
};

/**
 * Returns the display label for a given status string.
 * Falls back gracefully if an unknown status is received.
 */
export const getStatusLabel = (status) =>
    STATUS_LABELS[status?.toLowerCase()] ?? { label: status ?? 'Unknown', color: 'status-unknown' };
