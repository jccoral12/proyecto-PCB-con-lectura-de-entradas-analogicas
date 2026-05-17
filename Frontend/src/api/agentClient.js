/**
 * @fileoverview Cliente Axios para el microservicio Python de IA.
 * Carpeta: src/api/
 *
 * Apunta al FastAPI en puerto 8000 (Agente_IA/).
 * Uso: import agentClient from '../api/agentClient';
 */

import axios from 'axios';

const agentClient = axios.create({
    // Ahora pasa por el servidor Node.js (8080) que hace de proxy al Agente_IA (8000)
    baseURL: '/api/ia',
    timeout: 300000, // 300s (5 minutos) — los modelos locales en CPU tardan mucho
    headers: {
        'Content-Type': 'application/json',
    },
});

agentClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const msg = error.response?.data?.detail || error.message;
        console.error('[agentClient] Error:', msg);
        return Promise.reject(error);
    }
);

export default agentClient;
