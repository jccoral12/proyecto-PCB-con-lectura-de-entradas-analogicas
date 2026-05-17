/**
 * @fileoverview Hook personalizado para recibir datos MQTT en tiempo real.
 * Carpeta: src/kook/
 *
 * Refactorizado para usar el store Zustand (mqttStore) en lugar de
 * estado local con useReducer. El socket sigue siendo el singleton
 * de socketService. La interfaz pública es idéntica a la versión anterior.
 *
 * Uso:
 *   const { mensajes, ultimoDato, limpiarMensajes } = useMqttData();
 *
 * Para filtrar por dispositivo:
 *   const { mensajes } = useMqttData({ dispositivo_uuid: 'abc-123' });
 */

import { useEffect, useCallback, useRef } from 'react';
import socketService from '../service/socketService';
import useMqttStore  from '../store/mqttStore';

/**
 * @param {{ dispositivo_uuid?: string }} [opciones]
 * @returns {{ mensajes: import('../store/mqttStore').MqttEvento[], ultimoDato: import('../store/mqttStore').MqttEvento|null, limpiarMensajes: Function }}
 */
const useMqttData = (opciones = {}) => {
    const { dispositivo_uuid } = opciones;
    const socket = socketService.getSocket();

    // ── Zustand selectors (suscripción granular = sin re-renders innecesarios) ─
    const mensajes      = useMqttStore((s) => s.mensajes);
    const ultimoDato    = useMqttStore((s) => s.ultimoDato);
    const addMensaje    = useMqttStore((s) => s.addMensaje);
    const limpiarMensajes = useMqttStore((s) => s.limpiarMensajes);
    const setConectado  = useMqttStore((s) => s.setConectado);
    const setClientes   = useMqttStore((s) => s.setClientes);

    // Ref para el filtro — evita re-renderizados por cierre de función
    const filtroRef = useRef(dispositivo_uuid);
    filtroRef.current = dispositivo_uuid;

    const handleMensaje = useCallback((evento) => {
        if (filtroRef.current && evento.payload?.dispositivo_uuid !== filtroRef.current) return;
        addMensaje(evento);
    }, [addMensaje]);

    useEffect(() => {
        // Sincronizar estado inicial de conexión
        setConectado(socket.connected);

        const onConnect    = ()            => setConectado(true);
        const onDisconnect = ()            => setConectado(false);
        const onClientes   = ({ total })   => setClientes(total);

        socket.on('connect',         onConnect);
        socket.on('disconnect',      onDisconnect);
        socket.on('server:clientes', onClientes);
        socket.on('mqtt:mensaje',    handleMensaje);

        if (dispositivo_uuid) {
            socket.emit('join:dispositivo', dispositivo_uuid);
        }

        return () => {
            socket.off('connect',         onConnect);
            socket.off('disconnect',      onDisconnect);
            socket.off('server:clientes', onClientes);
            socket.off('mqtt:mensaje',    handleMensaje);
            if (dispositivo_uuid) {
                socket.emit('leave:dispositivo', dispositivo_uuid);
            }
        };
    }, [socket, handleMensaje, dispositivo_uuid, setConectado, setClientes]);

    return { mensajes, ultimoDato, limpiarMensajes };
};

export default useMqttData;
