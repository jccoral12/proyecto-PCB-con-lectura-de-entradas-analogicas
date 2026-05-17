/**
 * @fileoverview Módulo de Socket.IO.
 * Gestiona rooms por dispositivo, rooms por tópico MQTT,
 * heartbeat y contador de clientes conectados.
 * Se integra sobre el servidor HTTP existente sin tocar la lógica Express.
 */

const { Server } = require('socket.io');

/**
 * Inicializa el servidor Socket.IO sobre el servidor HTTP de Node.js.
 * @param {import('http').Server} httpServer - Servidor HTTP creado en server.js
 * @returns {import('socket.io').Server} Instancia io lista para emitir eventos
 */
const initSocket = (httpServer) => {
    const corsOrigin = process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173';

    const io = new Server(httpServer, {
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        // Ping/pong para detectar clientes caídos
        pingTimeout:  60000,
        pingInterval: 25000,
    });

    // Contador global de clientes activos
    let clientesConectados = 0;

    io.on('connection', (socket) => {
        clientesConectados++;
        console.log(`Socket.IO: Cliente conectado    [${socket.id}] | Total: ${clientesConectados}`);

        // --- Estado inicial al cliente recién conectado ---
        socket.emit('server:estado', {
            conectado: true,
            clientesConectados,
            timestamp: new Date().toISOString(),
        });

        // Notificar a TODOS el nuevo conteo
        io.emit('server:clientes', { total: clientesConectados });

        // ── Rooms por dispositivo ─────────────────────────────────────────────
        socket.on('join:dispositivo', (dispositivo_uuid) => {
            const room = `dispositivo:${dispositivo_uuid}`;
            socket.join(room);
            console.log(`Socket.IO: [${socket.id}] → room ${room}`);
            socket.emit('join:ok', { room });
        });

        socket.on('leave:dispositivo', (dispositivo_uuid) => {
            socket.leave(`dispositivo:${dispositivo_uuid}`);
        });

        // ── Rooms por tópico MQTT ─────────────────────────────────────────────
        socket.on('join:topico', (topico) => {
            const room = `topico:${topico.replace(/\//g, '_')}`;
            socket.join(room);
            console.log(`Socket.IO: [${socket.id}] → room ${room}`);
            socket.emit('join:ok', { room });
        });

        socket.on('leave:topico', (topico) => {
            socket.leave(`topico:${topico.replace(/\//g, '_')}`);
        });

        // ── Heartbeat manual del cliente ──────────────────────────────────────
        socket.on('ping:cliente', () => {
            socket.emit('pong:server', { timestamp: new Date().toISOString() });
        });

        // ── Desconexión ───────────────────────────────────────────────────────
        socket.on('disconnect', (reason) => {
            clientesConectados = Math.max(0, clientesConectados - 1);
            console.log(`Socket.IO: Cliente desconectado [${socket.id}] | ${reason} | Total: ${clientesConectados}`);
            io.emit('server:clientes', { total: clientesConectados });
        });
    });

    console.log(`Socket.IO: Iniciado | CORS permitido: ${corsOrigin}`);
    return io;
};

module.exports = { initSocket };
