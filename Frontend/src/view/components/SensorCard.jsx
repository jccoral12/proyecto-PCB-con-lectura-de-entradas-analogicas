/**
 * @fileoverview Tarjeta de sensor individual.
 * Carpeta: src/view/components/
 *
 * Muestra el valor actual de un sensor con animación al actualizarse.
 *
 * @param {{ label: string, valor: number|null, unidad?: string, icono?: string }} props
 */

import { useEffect, useRef } from 'react';
import styles from './SensorCard.module.css';

const SensorCard = ({ label, valor, unidad = '', icono = '📡' }) => {
    const cardRef = useRef(null);
    const prevValor = useRef(valor);

    // Animación flash cuando el valor cambia
    useEffect(() => {
        if (prevValor.current !== valor && cardRef.current) {
            cardRef.current.classList.remove(styles.flash);
            // Forzar reflow para reiniciar animación
            void cardRef.current.offsetWidth;
            cardRef.current.classList.add(styles.flash);
        }
        prevValor.current = valor;
    }, [valor]);

    const tieneValor = valor !== null && valor !== undefined;

    return (
        <div className={styles.card} ref={cardRef}>
            <div className={styles.header}>
                <span className={styles.icono}>{icono}</span>
                <span className={styles.label}>{label}</span>
            </div>
            <div className={styles.valor}>
                {tieneValor ? (
                    <>
                        <span className={styles.numero}>{Number(valor).toFixed(2)}</span>
                        {unidad && <span className={styles.unidad}>{unidad}</span>}
                    </>
                ) : (
                    <span className={styles.sinDato}>—</span>
                )}
            </div>
            <div className={styles.indicador} />
        </div>
    );
};

export default SensorCard;
