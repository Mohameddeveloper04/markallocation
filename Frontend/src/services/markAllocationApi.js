import { getEventConfigsUrl, getParticipantsUrl } from '../config/api';

const apiFetch = async (url, opts = {}) => {
    const res = await fetch(url, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(opts.headers || {})
        }
    });
    if (!res.ok) throw new Error(`API_ERROR_${res.status}`);
    return await res.json();
};

export const fetchEventConfig = async (eventName) => {
    const data = await apiFetch(`${getEventConfigsUrl()}/${encodeURIComponent(eventName)}`);
    return data.rounds || [];
};

export const saveEventConfig = async (eventName, rounds) => {
    const data = await apiFetch(`${getEventConfigsUrl()}/${encodeURIComponent(eventName)}`, {
        method: 'POST',
        body: JSON.stringify({ rounds }),
    });
    return data.rounds || [];
};

export const updateParticipantMarks = async (registrationId, marks) => {
    const data = await apiFetch(`${getParticipantsUrl()}/${encodeURIComponent(registrationId)}/marks`, {
        method: 'PATCH',
        body: JSON.stringify({ marks }),
    });
    return data.marks || {};
};
