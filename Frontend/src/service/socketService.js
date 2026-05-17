/**
 * @fileoverview Servicio Socket.IO — Singleton del cliente.
 * Carpeta: src/service/
 *
 * Garantiza una única instancia de la conexión durante todo el ciclo
 * de vida de la aplicación, evitando múltiples sockets abiertos.
 *
 * Uso:
 *   import socketService from '../service/socketService';
 *   const socket = socketService.getSocket();
 */

import { io } from 'socket.io-client';

// En producción (VPS), detecta automáticamente el dominio/IP. En local, usa localhost.
const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:8080';

class SocketService {
    constructor() {
        /** @type {import('socket.io-client').Socket|null} */
        this._socket = null;
    }

    /**
     * Devuelve la instancia del socket, creándola si aún no existe.
     * @returns {import('socket.io-client').Socket}
     */
    getSocket() {
        if (!this._socket) {
            this._socket = io(SOCKET_URL, {
                // Reconexión automática
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                // Usar WebSocket primero; fallback a polling
                transports: ['websocket', 'polling'],
                withCredentials: true,
            });

            this._socket.on('connect', () => {
                console.log('[socketService] Conectado al servidor:', this._socket.id);
            });

            this._socket.on('disconnect', (reason) => {
                console.warn('[socketService] Desconectado:', reason);
            });

            this._socket.on('connect_error', (err) => {
                console.error('[socketService] Error de conexión:', err.message);
            });

            this._socket.on('reconnect', (attempt) => {
                console.log('[socketService] Reconectado en intento:', attempt);
            });
        }

        return this._socket;
    }

    /**
     * Desconecta y destruye el socket activo.
     * Llamar solo al desmontar la app completa.
     */
    disconnect() {
        if (this._socket) {
            this._socket.disconnect();
            this._socket = null;
            console.log('[socketService] Socket desconectado y destruido');
        }
    }
}

// Exportar instancia única (singleton)
export default new SocketService();
