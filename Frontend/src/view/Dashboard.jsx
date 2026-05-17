/**
 * @fileoverview Dashboard principal del sistema IoT.
 * Carpeta: src/view/
 *
 * Muestra en tiempo real:
 * - Estado de conexión Socket.IO
 * - Último dato recibido por sensor (sensor1 – sensor4)
 * - Información del dispositivo y tópico MQTT
 * - Historial de los últimos mensajes recibidos
 */

import { useState } from 'react';
import useMqttData          from '../kook/useMqttData';
import ConexionBadge        from './components/ConexionBadge';
import SensorCard           from './components/SensorCard';
import MensajeItem          from './components/MensajeItem';
import AIPanel              from './components/AIPanel';
import styles               from './Dashboard.module.css';

// Configuración visual de cada sensor
const SENSORES_CONFIG = [
    { key: 'sensor1', label: 'Sensor 1', icono: '🌡️', unidad: '' },
    { key: 'sensor2', label: 'Sensor 2', icono: '💧', unidad: '' },
    { key: 'sensor3', label: 'Sensor 3', icono: '⚡', unidad: '' },
    { key: 'sensor4', label: 'Sensor 4', icono: '📊', unidad: '' },
];

const Dashboard = () => {
    const { mensajes, ultimoDato, limpiarMensajes } = useMqttData();
    const [mostrarTodos, setMostrarTodos]           = useState(false);

    const payload    = ultimoDato?.payload ?? null;
    const mensajesVisibles = mostrarTodos ? mensajes : mensajes.slice(0, 10);

    return (
        <div className={styles.layout}>
            {/* ── Columna principal (contenido IoT existente) ─────────── */}
            <div className={styles.page}>

                {/* ── Header ───────────────────────────────────────────────── */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.titulo}>
                            <span className={styles.accent}>Electiva</span> IoT Dashboard
                        </h1>
                        <p className={styles.subtitulo}>Monitoreo de sensores en tiempo real vía MQTT</p>
                    </div>
                    <ConexionBadge />
                </header>

                {/* ── Info del último dispositivo ───────────────────────────── */}
                {payload && (
                    <div className={styles.infoDispositivo}>
                        <div className={styles.infoBadge}>
                            <span className={styles.infoLabel}>Dispositivo</span>
                            <span className={styles.infoValor}>{payload.dispositivo_uuid}</span>
                        </div>
                        {ultimoDato?.topic && (
                            <div className={styles.infoBadge}>
                                <span className={styles.infoLabel}>Tópico</span>
                                <span className={styles.infoValor}>{ultimoDato.topic}</span>
                            </div>
                        )}
                        {ultimoDato?.timestamp && (
                            <div className={styles.infoBadge}>
                                <span className={styles.infoLabel}>Último mensaje</span>
                                <span className={styles.infoValor}>
                                    {new Date(ultimoDato.timestamp).toLocaleTimeString('es-CO')}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Sin datos aún ─────────────────────────────────────────── */}
                {!payload && (
                    <div className={styles.sinDatos}>
                        <div className={styles.sinDatosIcono}>📡</div>
                        <p>Esperando datos del broker MQTT…</p>
                        <small>Asegúrate de que el broker esté activo en <code>127.0.0.1:1883</code></small>
                    </div>
                )}

                {/* ── Grid de sensores ──────────────────────────────────────── */}
                <section className={styles.sensoresGrid}>
                    {SENSORES_CONFIG.map(({ key, label, icono, unidad }) => (
                        <SensorCard
                            key={key}
                            label={label}
                            icono={icono}
                            unidad={unidad}
                            valor={payload?.[key] ?? null}
                        />
                    ))}
                </section>

                {/* ── Historial de mensajes ─────────────────────────────────── */}
                <section className={styles.historial}>
                    <div className={styles.historialHeader}>
                        <h2 className={styles.historialTitulo}>
                            Historial MQTT
                            {mensajes.length > 0 && (
                                <span className={styles.contador}>{mensajes.length}</span>
                            )}
                        </h2>
                        {mensajes.length > 0 && (
                            <button
                                className={styles.btnLimpiar}
                                onClick={limpiarMensajes}
                                id="btn-limpiar-historial"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>

                    {mensajes.length === 0 ? (
                        <div className={styles.historialVacio}>
                            Sin mensajes recibidos todavía
                        </div>
                    ) : (
                        <>
                            <div className={styles.mensajesList}>
                                {mensajesVisibles.map((evento) => (
                                    <MensajeItem key={evento._id} evento={evento} />
                                ))}
                            </div>
                            {mensajes.length > 10 && (
                                <button
                                    className={styles.btnVerMas}
                                    onClick={() => setMostrarTodos((v) => !v)}
                                    id="btn-ver-mas-historial"
                                >
                                    {mostrarTodos ? 'Ver menos' : `Ver los ${mensajes.length} mensajes`}
                                </button>
                            )}
                        </>
                    )}
                </section>

            </div>

            {/* ── Sidebar Agente IA ────────────────────────────────────────── */}
            <AIPanel />
        </div>
    );
};

export default Dashboard;
