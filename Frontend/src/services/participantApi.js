// ============================================================
//  Frontend/src/services/participantApi.js
//  - getParticipants  → backend GET  /api/participants
//  - syncParticipants → backend POST /api/participants/sync (avoids CORS)
// ============================================================

import { getParticipantsUrl, getSyncUrl } from '../config/api';
import API_CONFIG from '../config/api';

// ── Internal fetch wrapper ─────────────────────────────────
const apiFetch = async (url, opts = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);

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

// ── Map external API raw record → display object ───────────
const mapParticipant = (raw) => ({
    registrationId: raw.registrationId || raw._id || raw.teamName || raw.leader?.email,
    name:           raw.leader?.name   || raw.teamName || null,
    college:        raw.college        || raw.leader?.college    || null,
    department:     raw.department     || raw.leader?.department || null,
    year:           raw.year           || raw.leader?.year       || null,
    event:          raw.eventName      || raw.eventType          || null,
    status:         raw.status         || 'confirmed',
    teamName:       raw.teamName       || null,
    teamSize:       raw.teamSize       || null,
    members:        raw.members        || [],
});

const unwrap = (data) =>
    Array.isArray(data)
        ? data
        : data?.data ?? data?.registrations ?? data?.results ?? data?.participants ?? [];

// ── Public: page-load fetch (backend returns empty instantly) ──
export const getParticipants = async () => {
    const data = await apiFetch(getParticipantsUrl());
    return {
        participants: data.participants ?? [],
        total:        data.total        ?? 0,
    };
};

// ── Public: Sync Now — delegates to backend proxy (no CORS issues) ──
export const syncParticipants = async () => {
    const data = await apiFetch(getSyncUrl(), { method: 'POST' });
    return {
        participants: data.participants ?? [],
        total:        data.total        ?? (data.participants?.length || 0),
        synced:       data.synced       ?? (data.participants?.length || 0),
    };
};

// ── Public: Delete Participant from database ─────────────────
export const deleteParticipant = async (registrationId) => {
    return await apiFetch(`${getParticipantsUrl()}/${encodeURIComponent(registrationId)}`, {
        method: 'DELETE',
    });
};

// ── User-friendly error messages ───────────────────────────
export const getFriendlyError = (err) => {
    const map = {
        API_UNAUTHORIZED: 'Access to participant data is restricted.',
        API_RATE_LIMITED: 'Too many requests. Please wait a moment.',
        API_SERVER_ERROR: 'The server is temporarily unavailable.',
        API_TIMEOUT:      'The request timed out. Check your connection.',
    };
    return map[err?.message] ?? 'Unable to load participant information. Please try again.';
};

export const refreshInterval = API_CONFIG.refreshInterval;
