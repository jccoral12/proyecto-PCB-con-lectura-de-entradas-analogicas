/**
 * @fileoverview Hook personalizado para gestionar la conexión Socket.IO.
 * Carpeta: src/kook/
 *
 * Retorna el estado de conexión y la instancia del socket.
 * No crea múltiples conexiones — reutiliza el singleton de socketService.
 *
 * Uso:
 *   const { socket, conectado, clientesConectados } = useSocket();
 */

import { useState, useEffect } from 'react';
import socketService from '../service/socketService';

/**
 * @typedef {Object} UseSocketReturn
 * @property {import('socket.io-client').Socket} socket - Instancia del socket
 * @property {boolean} conectado - true si el socket está conectado al servidor
 * @property {number} clientesConectados - Número de clientes conectados al servidor
 */

/**
 * Hook para acceder al socket y su estado de conexión.
 * @returns {UseSocketReturn}
 */
const useSocket = () => {
    const socket = socketService.getSocket();

    const [conectado, setConectado]                   = useState(socket.connected);
    const [clientesConectados, setClientesConectados] = useState(0);

    useEffect(() => {
        // Sincronizar estado al montar
        setConectado(socket.connected);

        const onConnect    = ()       => setConectado(true);
        const onDisconnect = ()       => setConectado(false);
        const onClientes   = ({ total }) => setClientesConectados(total);

        socket.on('connect',         onConnect);
        socket.on('disconnect',      onDisconnect);
        socket.on('server:clientes', onClientes);

        // Limpieza al desmontar — NO desconectar el socket (es singleton)
        return () => {
            socket.off('connect',         onConnect);
            socket.off('disconnect',      onDisconnect);
            socket.off('server:clientes', onClientes);
        };
    }, [socket]);

    return { socket, conectado, clientesConectados };
};

export default useSocket;
