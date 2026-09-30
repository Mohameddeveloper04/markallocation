// ============================================================
//  Backend/src/services/registrationApi.js
//  Fetches onboarded participant data from the external
//  registration API. The API key NEVER leaves this file.
// ============================================================

import axios from 'axios';

const BASE = process.env.REGISTRATION_API_BASE;
const ENDPOINT = process.env.REGISTRATION_API_ENDPOINT;
const API_KEY = process.env.REGISTRATION_API_KEY;

/**
 * Fetches the raw onboarded participants list from the
 * external registration API.
 *
 * @returns {Promise<any>} Raw API response (array or wrapped object)
 */
export const fetchOnboardedFromAPI = async () => {
    // Use query parameter instead of header for authentication
    const url = `${BASE}${ENDPOINT}?apikey=${API_KEY}`;

    const response = await axios.get(url, {
        headers: {
            Accept: 'application/json',
        },
        timeout: 15000,
    });

    return response.data;
};
