const mqtt  = require('mqtt');
const axios = require('axios');

/**
 * Cliente MQTT que recibe mensajes del broker y los retransmite
 * en tiempo real mediante Socket.IO además de persistirlos vía API.
 */
class MqttClient {

    constructor() {
        this.broker  = process.env.MQTT_BROKER || 'mqtt://127.0.0.1:1883';

        // Soporte multi-tópico: MQTT_TOPICS separados por coma, o MQTT_TOPIC legacy
        const rawTopics = process.env.MQTT_TOPICS || process.env.MQTT_TOPIC || 'Plc/Esp32';
        this.topics  = rawTopics.split(',').map(t => t.trim()).filter(Boolean);

        this.apiUrl  = process.env.API_URL  || 'http://127.0.0.1:8080/api/datos';
        this.user    = process.env.MQTT_USER;
        this.pass    = process.env.MQTT_PASS;
        this.client  = null;

        /**
         * Referencia al servidor Socket.IO.
         * Se inyecta desde server.js llamando a setSocketServer().
         * @type {import('socket.io').Server|null}
         */
        this.io = null;
    }

    /**
     * Recibe la instancia de Socket.IO para emitir eventos en tiempo real.
     * Debe llamarse ANTES de connect().
     * @param {import('socket.io').Server} io
     */
    setSocketServer(io) {
        this.io = io;
        console.log('MQTT: Socket.IO vinculado al cliente MQTT');
    }

    connect() {
        console.log(`Conectando al broker MQTT: ${this.broker}...`);
        console.log(`MQTT: Tópicos configurados: ${this.topics.join(', ')}`);

        const options = {
            reconnectPeriod: 5000,  // reconexión automática cada 5 s
            connectTimeout:  10000,
        };
        if (this.user) options.username = this.user;
        if (this.pass) options.password = this.pass;

        this.client = mqtt.connect(this.broker, options);

        // ── Eventos de conexión ───────────────────────────────────────────────
        this.client.on('connect', () => {
            console.log('MQTT: Conectado con éxito');
            // Suscribir a todos los tópicos configurados
            this.topics.forEach(topic => {
                this.client.subscribe(topic, (err) => {
                    if (!err) {
                        console.log(`MQTT: Suscrito al tópico: ${topic}`);
                    } else {
                        console.error(`MQTT: Error al suscribirse a [${topic}]:`, err.message);
                    }
                });
            });
        });

        this.client.on('message', (topic, message) => {
            const payload = message.toString();
            console.log(`MQTT: Mensaje en [${topic}]: ${payload}`);
            this.processMessage(topic, payload);
        });

        this.client.on('error', (err) => {
            console.error('MQTT: Error de conexión:', err.message);
        });

        this.client.on('reconnect', () => {
            console.warn('MQTT: Intentando reconexión...');
        });

        this.client.on('offline', () => {
            console.warn('MQTT: Cliente offline');
        });

        this.client.on('close', () => {
            console.warn('MQTT: Conexión cerrada');
        });
    }

    /**
     * Procesa un mensaje MQTT recibido:
     * 1. Emite por Socket.IO en tiempo real (NUEVO).
     * 2. Persiste el dato llamando a la API REST (lógica original intacta).
     *
     * @param {string} topic   - Tópico MQTT donde llegó el mensaje
     * @param {string} payload - Cuerpo del mensaje como string
     */
    async processMessage(topic, payload) {
        try {
            const data = JSON.parse(payload);

            // Validar que tenga dispositivo_uuid y al menos un sensor
            if (!data.dispositivo_uuid) {
                console.warn('MQTT: Falta dispositivo_uuid en el mensaje');
                return;
            }

            if (data.sensor1 === undefined && data.sensor2 === undefined &&
                data.sensor3 === undefined && data.sensor4 === undefined) {
                console.warn('MQTT: El mensaje no tiene ningún valor de sensor');
                return;
            }

            // ── Emitir en tiempo real por Socket.IO ───────────────────────────
            if (this.io) {
                const evento = {
                    topic,
                    payload: data,
                    timestamp: data.fecha_insercion || new Date().toISOString(),
                };

                // A todos los clientes conectados
                this.io.emit('mqtt:mensaje', evento);

                // Solo a la room del dispositivo específico
                this.io.to(`dispositivo:${data.dispositivo_uuid}`).emit('mqtt:dispositivo', evento);

                // Solo a la room del tópico
                const roomTopico = `topico:${topic.replace(/\//g, '_')}`;
                this.io.to(roomTopico).emit('mqtt:topico', evento);

                console.log(`Socket.IO: Emitido mqtt:mensaje | dispositivo: ${data.dispositivo_uuid}`);
            }

            // ── Persistir en base de datos vía API (lógica original) ─────────
            console.log(`MQTT: Reenviando dato a la API: ${this.apiUrl}...`);
            const resp = await axios.post(this.apiUrl, data);
            console.log('API Response:', resp.data);

        } catch (error) {
            if (error instanceof SyntaxError) {
                console.error('MQTT: Payload no es JSON válido:', payload);
                return;
            }
            console.error('Error al procesar mensaje MQTT:', error.message);
            if (error.response) {
                console.error('Detalle error API:', error.response.data);
            }
        }
    }
}

module.exports = new MqttClient();
