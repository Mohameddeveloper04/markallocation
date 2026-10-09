// Quick test — run with: node test-api.js
import 'dotenv/config';
import https from 'https';
import axios from 'axios';

const BASE = process.env.REGISTRATION_API_BASE;
const ENDPOINT = process.env.REGISTRATION_API_ENDPOINT;
const API_KEY = process.env.REGISTRATION_API_KEY;
const url = `${BASE}${ENDPOINT}?apikey=${API_KEY}`;

console.log('Testing URL:', url);

const ipv4Agent = new https.Agent({ family: 4 });

axios.get(url, { httpsAgent: ipv4Agent, timeout: 20000 })
    .then(r => {
        console.log('✅ SUCCESS — Status:', r.status);
        console.log('Response:', JSON.stringify(r.data).slice(0, 400));
    })
    .catch(e => {
        console.log('❌ FAILED:', e.message);
    });
