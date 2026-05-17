/**
 * @fileoverview Cliente axios configurado para el backend de Electiva.
 * Carpeta: src/api/
 * Uso: import axiosClient from '../api/axiosClient';
 */

import axios from 'axios';

const axiosClient = axios.create({
    // En desarrollo, Vite hace proxy de /api → http://localhost:8080
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de respuesta para logs en desarrollo
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('[axiosClient] Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default axiosClient;
