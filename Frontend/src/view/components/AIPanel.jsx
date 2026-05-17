/**
 * @fileoverview Panel de chat con el Agente IA multi-agente.
 * Carpeta: src/view/components/
 *
 * Permite al usuario enviar consultas en lenguaje natural y ver
 * las respuestas del orquestador LangGraph (MongoDB o Análisis).
 */

import { useState, useRef, useEffect } from 'react';
import useAIStore from '../../store/useAIStore';
import styles     from './AIPanel.module.css';

// Sugerencias rápidas pre-definidas
const SUGGESTIONS = {
    mongodb: [
        '¿Cuántos dispositivos hay?',
        'Muéstrame los últimos datos',
        '¿Cuántos registros hay en total?',
    ],
    analysis: [
        'Analiza el promedio de todos los sensores',
        '¿Hay anomalías en el sensor1?',
        '¿Cuál es la tendencia del sensor2?',
    ],
};

const INTENT_CONFIG = {
    mongodb:  { label: '🗄️ MongoDB',  color: '#3b82f6' },
    analysis: { label: '📊 Análisis', color: '#8b5cf6' },
    error:    { label: '⚠️ Error',    color: '#ef4444' },
};

const AIPanel = () => {
    const { messages, isLoading, sendQuery, clearChat } = useAIStore();
    const [input, setInput]     = useState('');
    const messagesEndRef         = useRef(null);
    const inputRef               = useRef(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        const query = input.trim();
        setInput('');
        await sendQuery(query);
        inputRef.current?.focus();
    };

    const handleSuggestion = (text) => {
        if (isLoading) return;
        setInput(text);
        inputRef.current?.focus();
    };

    return (
        <aside className={styles.panel} aria-label="Panel Agente IA">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <span className={styles.headerIcon}>🤖</span>
                    <div>
                        <h2 className={styles.headerTitle}>Agente IA</h2>
                        <p className={styles.headerSub}>LangGraph · Gemini 1.5 Flash</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        className={styles.clearBtn}
                        onClick={clearChat}
                        title="Limpiar conversación"
                        id="btn-clear-chat"
                    >
                        🗑️
                    </button>
                )}
            </div>

            {/* ── Sugerencias (visible cuando no hay mensajes) ──────────── */}
            {messages.length === 0 && (
                <div className={styles.welcome}>
                    <p className={styles.welcomeText}>
                        Hazme una pregunta sobre tus datos IoT
                    </p>
                    <div className={styles.suggestionsGroup}>
                        <span className={styles.suggestLabel}>🗄️ Base de datos</span>
                        {SUGGESTIONS.mongodb.map((s) => (
                            <button
                                key={s}
                                className={styles.suggestionChip}
                                onClick={() => handleSuggestion(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className={styles.suggestionsGroup}>
                        <span className={styles.suggestLabel}>📊 Análisis</span>
                        {SUGGESTIONS.analysis.map((s) => (
                            <button
                                key={s}
                                className={styles.suggestionChip}
                                onClick={() => handleSuggestion(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Historial de mensajes ──────────────────────────────────── */}
            <div className={styles.messages}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${styles.message} ${styles[msg.role]}`}
                    >
                        {msg.role === 'agent' && (
                            <div className={styles.agentMeta}>
                                <span
                                    className={styles.agentBadge}
                                    style={{
                                        backgroundColor:
                                            INTENT_CONFIG[msg.intent]?.color ?? '#6b7280',
                                    }}
                                >
                                    {INTENT_CONFIG[msg.intent]?.label ?? '🤖 Agente'}
                                </span>
                                <span className={styles.agentTime}>
                                    {msg.timestamp.toLocaleTimeString('es-CO')}
                                </span>
                            </div>
                        )}
                        <div className={styles.bubble}>
                            <pre className={styles.content}>{msg.content}</pre>
                        </div>
                        {msg.role === 'user' && (
                            <span className={styles.userTime}>
                                {msg.timestamp.toLocaleTimeString('es-CO')}
                            </span>
                        )}
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className={`${styles.message} ${styles.agent}`}>
                        <div className={styles.agentMeta}>
                            <span className={styles.agentBadge} style={{ backgroundColor: '#6b7280' }}>
                                ⏳ Procesando…
                            </span>
                        </div>
                        <div className={styles.bubble}>
                            <div className={styles.typingIndicator}>
                                <span /><span /><span />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ── Input ─────────────────────────────────────────────────── */}
            <form className={styles.inputForm} onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    id="ai-query-input"
                    type="text"
                    className={styles.input}
                    placeholder="Escribe tu consulta…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    autoComplete="off"
                />
                <button
                    id="ai-query-submit"
                    type="submit"
                    className={styles.sendBtn}
                    disabled={!input.trim() || isLoading}
                    title="Enviar consulta"
                >
                    {isLoading ? '⏳' : '➤'}
                </button>
            </form>
        </aside>
    );
};

export default AIPanel;
