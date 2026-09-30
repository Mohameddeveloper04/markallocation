// ============================================================
//  src/utils/participantMapper.js
//  ─────────────────────────────────────────────────────────
//  Data-mapping layer: converts raw API responses into the
//  internal Participant model used by the UI.
//
//  ★ THIS IS THE ONLY FILE YOU NEED TO EDIT ONCE YOU HAVE
//    THE REAL API RESPONSE STRUCTURE. ★
//
//  Steps after receiving real API docs:
//  1. Replace the field names in mapParticipant() to match
//     the actual JSON keys returned by the registration API.
//  2. Adjust mapParticipants() if the array is nested inside
//     a wrapper (e.g. response.data.registrations).
//  3. UI components and services do NOT need to change.
// ============================================================

import { createParticipant } from '../models/participant';

/**
 * Maps a single raw API participant object → internal Participant model.
 *
 * TODO: Replace the right-hand side field names (e.g. raw.participant_name)
 *       with the actual field names from the real API response.
 *
 * Example – if the API returns:
 * {
 *   "reg_id": "R-001",
 *   "full_name": "Arjun Kumar",
 *   "institution": "Coimbatore Engineering College",
 *   "dept": "CSE",
 *   "study_year": "3",
 *   "event_name": "Hackathon",
 *   "reg_status": "confirmed"
 * }
 *
 * … update the mapping below accordingly.
 *
 * @param {object} raw - A single participant object from the API
 * @returns {Participant}
 */
export const mapParticipant = (raw = {}) => {
    if (!raw || typeof raw !== 'object') return null;

    return createParticipant({
        // ── REPLACE FIELD NAMES BELOW ONCE API DOCS ARE AVAILABLE ──────────

        id: raw.id ?? raw._id ?? raw.reg_id ?? null,
        registrationId: raw.registrationId ?? raw.registration_id ?? raw.reg_id ?? null,
        name: raw.name ?? raw.full_name ?? raw.participant_name ?? null,
        college: raw.college ?? raw.institution ?? raw.college_name ?? null,
        department: raw.department ?? raw.dept ?? raw.branch ?? null,
        year: raw.year ?? raw.study_year ?? raw.year_of_study ?? null,
        event: raw.event ?? raw.event_name ?? raw.category ?? null,
        status: raw.status ?? raw.reg_status ?? raw.registration_status ?? null,

        // ── END OF FIELD MAPPING ───────────────────────────────────────────
    });
};

/**
 * Maps the full API response → array of Participant models.
 *
 * TODO: Adjust the accessor path if participants are nested inside
 * a wrapper object in the API response.
 *
 * Example wrapper shapes and how to unwrap them:
 *   response.data           → return (response.data || []).map(...)
 *   response.registrations  → return (response.registrations || []).map(...)
 *   response.results        → return (response.results || []).map(...)
 *   response (bare array)   → return (response || []).map(...)   ← default
 *
 * @param {any} response - The full parsed JSON from the API
 * @returns {Participant[]}
 */
export const mapParticipants = (response) => {
    // ── ADJUST THIS LINE TO UNWRAP THE ACTUAL API RESPONSE ENVELOPE ─────
    const rawArray = Array.isArray(response)
        ? response
        : response?.data ?? response?.registrations ?? response?.results ?? [];
    // ── END ADJUSTMENT ───────────────────────────────────────────────────

    return rawArray
        .map(mapParticipant)
        .filter(Boolean); // remove any nulls from failed mappings
};

/**
 * Extracts the total participant count from the API response.
 *
 * TODO: Adjust the field name if the API sends a different key
 *       (e.g. response.totalCount, response.meta.total, etc.)
 *
 * @param {any} response - The full parsed JSON from the API
 * @param {Participant[]} mappedParticipants - Already-mapped list (fallback)
 * @returns {number}
 */
export const mapParticipantCount = (response, mappedParticipants = []) => {
    // ── ADJUST FIELD NAME TO MATCH ACTUAL API ───────────────────────────
    return (
        response?.total ??
        response?.totalCount ??
        response?.count ??
        response?.meta?.total ??
        mappedParticipants.length
    );
    // ── END ADJUSTMENT ───────────────────────────────────────────────────
};
