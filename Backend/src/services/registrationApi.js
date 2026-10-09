// ============================================================
//  Backend/src/services/registrationApi.js
//  Fetches onboarded participant data from the external
//  registration API. The API key NEVER leaves this file.
// ============================================================

import axios from 'axios';
import https from 'https';

const BASE = process.env.REGISTRATION_API_BASE;
const ENDPOINT = process.env.REGISTRATION_API_ENDPOINT;
const API_KEY = process.env.REGISTRATION_API_KEY;

// Force IPv4 — the external host does not respond over IPv6
const ipv4Agent = new https.Agent({ family: 4 });

/**
 * Fetches the raw onboarded participants list from the
 * external registration API.
 *
 * @returns {Promise<any>} Raw API response (array or wrapped object)
 */
export const fetchOnboardedFromAPI = async () => {
    const base = process.env.REGISTRATION_API_BASE;
    const endpoint = process.env.REGISTRATION_API_ENDPOINT;
    const apiKey = process.env.REGISTRATION_API_KEY;

    const url = `${base}${endpoint}?apikey=${apiKey}`;

    const response = await axios.get(url, {
        httpsAgent: ipv4Agent,
        headers: { Accept: 'application/json' },
        timeout: 20000,
    });

    return response.data;
};
