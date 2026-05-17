/**
 * @fileoverview Componente badge de estado de conexión Socket.IO.
 * Carpeta: src/view/components/
 *
 * Muestra un indicador animado: verde (conectado) / rojo (desconectado).
 */

import { useSocketContext } from '../../context/SocketContext';
import styles from './ConexionBadge.module.css';

const ConexionBadge = () => {
    const { conectado, clientesConectados } = useSocketContext();

    return (
        <div className={styles.wrapper}>
            <span className={`${styles.dot} ${conectado ? styles.activo : styles.inactivo}`} />
            <span className={styles.texto}>
                {conectado
                    ? `Conectado · ${clientesConectados} cliente${clientesConectados !== 1 ? 's' : ''}`
                    : 'Sin conexión'}
            </span>
        </div>
    );
};

export default ConexionBadge;
