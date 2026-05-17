/**
 * @fileoverview Componente raíz de la aplicación.
 * Envuelve todo con SocketProvider para que el contexto
 * esté disponible en cualquier componente hijo.
 */

import { SocketProvider } from './context/SocketContext';
import Dashboard          from './view/Dashboard';

const App = () => (
    <SocketProvider>
        <Dashboard />
    </SocketProvider>
);

export default App;
