// ============================================================
//  Frontend/src/config/api.js
//  Points to the local backend — NOT the external API directly.
//  The external API key lives in Backend/.env (server-side only).
// ============================================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const API_CONFIG = {
    participantsUrl: `${BACKEND_URL}/api/participants`,
    syncUrl: `${BACKEND_URL}/api/participants/sync`,
    eventConfigsUrl: `${BACKEND_URL}/api/event-configs`,
    refreshInterval: 60000, // ms — auto-refresh every 60 s
};

export const getParticipantsUrl = () => API_CONFIG.participantsUrl;
export const getSyncUrl = () => API_CONFIG.syncUrl;
export const getEventConfigsUrl = () => API_CONFIG.eventConfigsUrl;
export const isApiConfigured = () => Boolean(BACKEND_URL);

export default API_CONFIG;
