/**
 * @fileoverview Context global de Socket.IO.
 * Carpeta: src/context/
 *
 * Provee el socket y su estado a toda la aplicación sin prop-drilling.
 * Envuelve <App> en main.jsx.
 *
 * Uso en componentes hijos:
 *   import { useSocketContext } from '../context/SocketContext';
 *   const { conectado, clientesConectados } = useSocketContext();
 */

import { createContext, useContext } from 'react';
import useSocket from '../kook/useSocket';

const SocketContext = createContext(null);

/**
 * Proveedor del contexto Socket.IO.
 * @param {{ children: React.ReactNode }} props
 */
export const SocketProvider = ({ children }) => {
    const socketState = useSocket();

    return (
        <SocketContext.Provider value={socketState}>
            {children}
        </SocketContext.Provider>
    );
};

/**
 * Hook de consumo del contexto Socket.IO.
 * @returns {{ socket: import('socket.io-client').Socket, conectado: boolean, clientesConectados: number }}
 */
export const useSocketContext = () => {
    const ctx = useContext(SocketContext);
    if (!ctx) {
        throw new Error('useSocketContext debe usarse dentro de <SocketProvider>');
    }
    return ctx;
};

export default SocketContext;
