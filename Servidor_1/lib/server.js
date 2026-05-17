const http    = require('http');
const express = require('express');
const cors    = require('cors');
const { dbConnection } = require('../database/config');
const mqttClient       = require('./mqtt-client');
const { initSocket }   = require('./socket-server');

/**
 * Clase que representa el servidor de la aplicación.
 * Configura los middlewares, las rutas y el puerto de escucha.
 *
 * CAMBIO: se envuelve Express con http.createServer() para que
 * Socket.IO comparta el mismo puerto sin modificar ninguna ruta
 * ni middleware existente.
 */
class Server {

    constructor() {
        /**
         * Aplicación de Express.
         * @type {express.Application}
         */
        this.app = express();

        /**
         * Servidor HTTP de Node.js (envuelve Express).
         * Necesario para que Socket.IO comparta el mismo puerto.
         * @type {import('http').Server}
         */
        this.httpServer = http.createServer(this.app);

        /**
         * Puerto en el que correrá el servidor. Usa fallback 3000 si no está definida.
         * @type {string|number}
         */
        this.port = process.env.PORT || 3000;

        // Conectar a la base de datos (sin cambios)
        this.conectarDB();

        // Inicializar Socket.IO y guardar referencia de io
        this.io = initSocket(this.httpServer);

        // Inicializar el cliente MQTT pasándole Socket.IO
        this.conectarMQTT();

        /**
         * Ruta base para las APIs relacionadas con dispositivos.
         * @type {string}
         */
        this.dispositivosPath = '/api/dispositivos';
        this.datosPath        = '/api/datos';
        this.iaPath           = '/api/ia';

        // Middlewares: Funciones que añaden funcionalidad al web server
        this.middlewares();

        // Rutas de mi aplicación
        this.routes();
    }

    /**
     * Inicializa la conexión a la base de datos.
     */
    async conectarDB() {
        await dbConnection();
    }

    /**
     * Inicializa el cliente MQTT y le pasa la instancia de Socket.IO
     * para que pueda emitir eventos en tiempo real al recibir mensajes.
     */
    conectarMQTT() {
        mqttClient.setSocketServer(this.io);
        mqttClient.connect();
    }

    /**
     * Define y configura los middlewares globales de la aplicación.
     * Sin cambios respecto al original.
     */
    middlewares() {

        // CORS: Habilita el Intercambio de Recursos de Origen Cruzado
        this.app.use( cors() );

        // Lectura y parseo del body: Permite leer JSON en las peticiones
        this.app.use( express.json() );

        // Directorio Público: Define la carpeta para archivos estáticos
        this.app.use( express.static('public') );
    }

    /**
     * Define las rutas de la aplicación vinculando los endpoints con sus archivos de rutas.
     * Sin cambios respecto al original.
     */
    routes() {
        this.app.use( this.dispositivosPath, require('../routes/dispositivos'));
        this.app.use( this.datosPath,        require('../routes/datos'));
        this.app.use( this.iaPath,           require('../routes/ia'));
    }

    /**
     * Inicia el servidor HTTP (que incluye Express + Socket.IO)
     * y lo pone a escuchar en el puerto especificado.
     */
    listen() {
        this.httpServer.listen( this.port, () => {
            console.log('Servidor corriendo en puerto', this.port);
            console.log(`Socket.IO disponible en ws://localhost:${this.port}`);
        });
    }

}

module.exports = Server;
