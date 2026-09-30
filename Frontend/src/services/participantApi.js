// ============================================================
//  Frontend/src/services/participantApi.js
//  Calls the LOCAL backend — never the external API directly.
//  The external API key lives in Backend/.env only.
// ============================================================

import { getParticipantsUrl, getSyncUrl } from '../config/api';
import API_CONFIG from '../config/api';

// ── Internal fetch wrapper ─────────────────────────────────
const apiFetch = async (url, opts = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    try {
        const res = await fetch(url, { signal: controller.signal, ...opts });

        if (!res.ok) {
            const { status } = res;
            if (status === 502 || status === 503) throw new Error('API_SERVER_ERROR');
            if (status === 401 || status === 403) throw new Error('API_UNAUTHORIZED');
            if (status === 429) throw new Error('API_RATE_LIMITED');
            throw new Error(`API_ERROR_${status}`);
        }

        return await res.json();
    } catch (err) {
        if (err.name === 'AbortError') throw new Error('API_TIMEOUT');
        throw err;
    } finally {
        clearTimeout(timer);
    }
};

// ── Public service functions ───────────────────────────────

/**
 * Fetches cached participants from the backend (reads MongoDB).
 * @returns {Promise<{ participants: object[], total: number }>}
 */
export const getParticipants = async () => {
    const data = await apiFetch(getParticipantsUrl());
    return {
        participants: data.participants ?? [],
        total: data.total ?? 0,
    };
};

/**
 * Triggers a sync: backend fetches from external API → saves to DB → returns list.
 * @returns {Promise<{ participants: object[], total: number, synced: number }>}
 */
export const syncParticipants = async () => {
    const data = await apiFetch(getSyncUrl(), { method: 'POST' });
    return {
        participants: data.participants ?? [],
        total: data.total ?? 0,
        synced: data.synced ?? 0,
    };
};

/** User-friendly error messages — never exposes technical details */
export const getFriendlyError = (err) => {
    const map = {
        API_UNAUTHORIZED: 'Access to participant data is restricted.',
        API_RATE_LIMITED: 'Too many requests. Please wait a moment.',
        API_SERVER_ERROR: 'The server is temporarily unavailable.',
        API_TIMEOUT: 'The request timed out. Check your connection.',
    };
    return map[err?.message] ?? 'Unable to load participant information right now. Please try again later.';
};

export const refreshInterval = API_CONFIG.refreshInterval;
