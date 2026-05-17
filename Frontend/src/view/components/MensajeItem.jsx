/**
 * @fileoverview Ítem de historial de mensajes MQTT.
 * Carpeta: src/view/components/
 *
 * @param {{ evento: import('../../kook/useMqttData').MqttEvento }} props
 */

import styles from './MensajeItem.module.css';

const formatHora = (iso) => {
    try {
        return new Date(iso).toLocaleTimeString('es-CO', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    } catch {
        return iso;
    }
};

const MensajeItem = ({ evento }) => {
    const { topic, payload, timestamp } = evento;
    const { dispositivo_uuid, sensor1, sensor2, sensor3, sensor4 } = payload ?? {};

    return (
        <div className={styles.item}>
            <div className={styles.topRow}>
                <span className={styles.topic}>{topic}</span>
                <span className={styles.hora}>{formatHora(timestamp)}</span>
            </div>
            <div className={styles.uuid}>{dispositivo_uuid}</div>
            <div className={styles.sensores}>
                {[sensor1, sensor2, sensor3, sensor4].map((val, i) =>
                    val !== null && val !== undefined ? (
                        <span key={i} className={styles.sensor}>
                            S{i + 1}: <strong>{Number(val).toFixed(2)}</strong>
                        </span>
                    ) : null
                )}
            </div>
        </div>
    );
};

export default MensajeItem;
