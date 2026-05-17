/**
 * @fileoverview Store Zustand para el Agente IA.
 * Carpeta: src/store/
 *
 * Gestiona el historial del chat con el agente multi-agente LangGraph.
 * Expone acciones reactivas consumibles desde cualquier componente.
 *
 * Uso:
 *   import { useAIStore } from '../store/useAIStore';
 *   const { messages, isLoading, sendQuery } = useAIStore();
 */

import { create } from 'zustand';
import agentClient from '../api/agentClient';

/**
 * @typedef {Object} ChatMessage
 * @property {string}  id         - ID único del mensaje
 * @property {'user'|'agent'} role - Quién envió el mensaje
 * @property {string}  content    - Contenido del mensaje
 * @property {string}  [agentUsed] - Agente que respondió (solo en role='agent')
 * @property {string}  [intent]   - Intención detectada ('mongodb'|'analysis')
 * @property {Date}    timestamp  - Momento del mensaje
 */

const useAIStore = create((set, get) => ({
    /** @type {ChatMessage[]} */
    messages: [],
    isLoading: false,
    error: null,

    /**
     * Envía una consulta al agente multi-agente y almacena la respuesta.
     * @param {string} query - Consulta en lenguaje natural
     */
    sendQuery: async (query) => {
        if (!query.trim()) return;

        const userMessage = {
            id:        `user-${Date.now()}`,
            role:      'user',
            content:   query.trim(),
            timestamp: new Date(),
        };

        set((state) => ({
            messages:  [...state.messages, userMessage],
            isLoading: true,
            error:     null,
        }));

        try {
            const { data } = await agentClient.post('/query', { query });

            const agentMessage = {
                id:        `agent-${Date.now()}`,
                role:      'agent',
                content:   data.response,
                agentUsed: data.agent_used,
                intent:    data.intent,
                timestamp: new Date(),
            };

            set((state) => ({
                messages:  [...state.messages, agentMessage],
                isLoading: false,
            }));
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message;

            const errorMessage = {
                id:        `error-${Date.now()}`,
                role:      'agent',
                content:   `❌ Error: ${errorMsg}`,
                agentUsed: 'Sistema',
                intent:    'error',
                timestamp: new Date(),
            };

            set((state) => ({
                messages:  [...state.messages, errorMessage],
                isLoading: false,
                error:     errorMsg,
            }));
        }
    },

    /** Limpia el historial del chat. */
    clearChat: () => set({ messages: [], error: null }),

    /** Limpia solo el último error. */
    clearError: () => set({ error: null }),
}));

export default useAIStore;
