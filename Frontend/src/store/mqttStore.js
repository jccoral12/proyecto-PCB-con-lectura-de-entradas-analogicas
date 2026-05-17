/**
 * @fileoverview Store Zustand para datos MQTT en tiempo real.
 * Carpeta: src/store/
 *
 * Migración de useReducer manual → Zustand para estado global reactivo.
 * La interfaz pública es compatible con el hook useMqttData existente.
 *
 * Uso directo (sin hook):
 *   import { useMqttStore } from '../store/mqttStore';
 *   const { mensajes, ultimoDato } = useMqttStore();
 */

import { create } from 'zustand';

const MAX_MENSAJES = 50;

/**
 * @typedef {Object} MqttEvento
 * @property {string} topic
 * @property {Object} payload
 * @property {string} timestamp
 * @property {number} _id
 */

const useMqttStore = create((set) => ({
    /** @type {MqttEvento[]} */
    mensajes: [],
    /** @type {MqttEvento|null} */
    ultimoDato: null,
    conectado: false,
    clientesConectados: 0,

    /**
     * Agrega un nuevo mensaje MQTT al historial.
     * @param {MqttEvento} evento
     */
    addMensaje: (evento) =>
        set((state) => {
            const nuevo = { ...evento, _id: Date.now() };
            const mensajes = [nuevo, ...state.mensajes].slice(0, MAX_MENSAJES);
            return { mensajes, ultimoDato: nuevo };
        }),

    /** Limpia el historial de mensajes. */
    limpiarMensajes: () => set({ mensajes: [], ultimoDato: null }),

    /**
     * Actualiza el estado de conexión.
     * @param {boolean} conectado
     */
    setConectado: (conectado) => set({ conectado }),

    /**
     * Actualiza el contador de clientes conectados.
     * @param {number} total
     */
    setClientes: (total) => set({ clientesConectados: total }),
}));

export default useMqttStore;
