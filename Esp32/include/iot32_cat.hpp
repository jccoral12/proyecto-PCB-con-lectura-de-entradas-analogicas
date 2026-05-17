#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include "iot32_header.hpp"
#include "iot32_functions.hpp"
#include <WiFi.h>

// UART2 dedicado al módulo CAT A7670S
// TX = GPIO17, RX = GPIO18
HardwareSerial catSerial(2);

// Estado de conexión MQTT CAT (persiste entre publicaciones)
static bool cat_mqtt_connected = false;

// -------------------------------------------------------------------
// Enviar comando AT y esperar respuesta con timeout
// -------------------------------------------------------------------
String cat_AT(const String &cmd, unsigned long timeout_ms = CAT_TIMEOUT_MS) {
  catSerial.println(cmd);
  String resp = "";
  unsigned long t = millis();
  while (millis() - t < timeout_ms) {
    while (catSerial.available()) {
      resp += (char)catSerial.read();
    }
    if (resp.indexOf("OK")    >= 0 ||
        resp.indexOf("ERROR") >= 0 ||
        resp.indexOf(">")     >= 0) break;
    delay(10);
  }
  resp.trim();
  log("[ CAT ] >> " + cmd);
  log("[ CAT ] << " + resp);
  return resp;
}

bool cat_ok(const String &cmd, unsigned long t = CAT_TIMEOUT_MS) {
  return cat_AT(cmd, t).indexOf("OK") >= 0;
}

// -------------------------------------------------------------------
// Encender el módulo CAT via pin KEY (GPIO1)
// Verifica primero si ya está activo para no apagarlo accidentalmente
// -------------------------------------------------------------------
void cat_power_on() {
  catSerial.begin(CAT_BAUD_RATE, SERIAL_8N1, CAT_RX_GPIO, CAT_TX_GPIO);
  delay(500);

  // Si el módulo ya responde, no aplicar pulso (evita apagarlo)
  if (cat_ok("AT", 2000)) {
    log("[ CAT ] Modulo ya activo, omitiendo pulso KEY");
    return;
  }

  log("[ CAT ] Encendiendo CAT A7670S (KEY=GPIO" + String(CAT_KEY_GPIO) + ")...");
  pinMode(CAT_KEY_GPIO, OUTPUT);
  digitalWrite(CAT_KEY_GPIO, LOW);
  delay(1500);
  digitalWrite(CAT_KEY_GPIO, HIGH);
  delay(5000); // Esperar arranque
  log("[ CAT ] Modulo CAT encendido");
}

// -------------------------------------------------------------------
// Inicializar red celular (APN Movistar)
// -------------------------------------------------------------------
bool cat_network_init() {
  log("[ CAT ] Inicializando red Movistar...");

  if (!cat_ok("AT", 3000)) {
    log("[ ERROR ] CAT no responde. Verifica cableado UART TX=GPIO"
        + String(CAT_TX_GPIO) + " RX=GPIO" + String(CAT_RX_GPIO));
    return false;
  }
  cat_ok("ATE0", 2000); // Desactivar eco

  // Verificar SIM
  if (cat_AT("AT+CPIN?", 5000).indexOf("READY") < 0) {
    log("[ ERROR ] SIM no detectada o no lista");
    return false;
  }

  // Esperar registro en red (máx ~30 s)
  bool registered = false;
  for (int i = 0; i < 15; i++) {
    String reg = cat_AT("AT+CREG?", 3000);
    if (reg.indexOf(",1") >= 0 || reg.indexOf(",5") >= 0) {
      registered = true;
      break;
    }
    log("[ CAT ] Esperando registro en red... (" + String(i + 1) + "/15)");
    delay(2000);
  }
  if (!registered) {
    log("[ ERROR ] Sin registro en red celular");
    return false;
  }

  // Configurar APN y activar contexto PDP
  cat_ok("AT+CGDCONT=1,\"IP\",\"" + String(CAT_APN) + "\"", 5000);
  String pdpResp = cat_AT("AT+CGACT=1,1", 30000);
  if (pdpResp.indexOf("ERROR") >= 0) {
    log("[ WARN ] CGACT retorno error (puede ya estar activo): " + pdpResp);
  }

  cat_network_ready = true;
  log("[ CAT ] Red lista. APN=" + String(CAT_APN));
  return true;
}

// -------------------------------------------------------------------
// Mantener conexión MQTT CAT activa (reconectar solo si se pierde)
// -------------------------------------------------------------------
bool cat_mqtt_ensure_connected() {
  if (cat_mqtt_connected) {
    // Ping para verificar que sigue viva
    String pingResp = cat_AT("AT+CMQTTCONNECT?", 3000);
    if (pingResp.indexOf("1") >= 0) {
      return true; // Sigue conectado
    }
    log("[ CAT ] Conexion MQTT perdida, reconectando...");
    cat_mqtt_connected = false;
  }

  // Iniciar servicio MQTT
  cat_AT("AT+CMQTTSTART", 5000);
  delay(500);

  // Adquirir cliente
  String clientId = String(mqtt_cloud_id) + "_cat";
  String accqResp = cat_AT("AT+CMQTTACCQ=0,\"" + clientId + "\"", 5000);
  if (accqResp.indexOf("ERROR") >= 0) {
    // Puede que el cliente ya exista; intentar liberar y volver a adquirir
    cat_ok("AT+CMQTTREL=0", 3000);
    cat_AT("AT+CMQTTACCQ=0,\"" + clientId + "\"", 5000);
  }

  // Conectar al broker
  String connCmd = "AT+CMQTTCONNECT=0,\"tcp://" + String(mqtt_server) +
                   ":" + String(mqtt_port) + "\",60,1,\"" +
                   String(mqtt_user) + "\",\"" + String(mqtt_password) + "\"";
  String connResp = cat_AT(connCmd, 20000);

  if (connResp.indexOf("+CMQTTCONNECT: 0,0") < 0) {
    log("[ ERROR ] Conexion MQTT CAT fallida: " + connResp);
    cat_ok("AT+CMQTTSTOP", 5000);
    cat_mqtt_connected = false;
    return false;
  }

  cat_mqtt_connected = true;
  log("[ CAT ] Conectado al broker MQTT via celular");
  return true;
}

// -------------------------------------------------------------------
// Construir JSON con los 4 sensores (vía CAT)
// -------------------------------------------------------------------
String cat_json() {
  String out;
  DynamicJsonDocument doc(768);
  doc["dispositivo_uuid"] = String(mqtt_cloud_id);
  doc["sensor1"]          = sensor1;
  doc["sensor2"]          = sensor2;
  doc["sensor3"]          = sensor3;
  doc["sensor4"]          = sensor4;
  doc["via"]              = "CAT";
  serializeJson(doc, out);
  return out;
}

// -------------------------------------------------------------------
// Publicar por MQTT usando los comandos AT del A7670S
// Mantiene la conexión entre publicaciones
// -------------------------------------------------------------------
bool cat_mqtt_publish(const String &topic, const String &payload) {
  log("[ CAT ] Publicando MQTT sobre red celular...");

  if (!cat_mqtt_ensure_connected()) return false;

  // Enviar topic
  cat_AT("AT+CMQTTTOPIC=0," + String(topic.length()), 3000);
  catSerial.print(topic);
  delay(300);

  // Enviar payload
  cat_AT("AT+CMQTTPAYLOAD=0," + String(payload.length()), 3000);
  catSerial.print(payload);
  delay(300);

  // Publicar QoS=1
  String pubResp = cat_AT("AT+CMQTTPUB=0,1,60", 15000);
  bool ok = pubResp.indexOf("+CMQTTPUB: 0,0") >= 0;

  if (ok) {
    log("[ CAT ] Publicacion exitosa: " + payload);
  } else {
    log("[ ERROR ] Publicacion fallida: " + pubResp);
    // Marcar como desconectado para reconectar en el próximo ciclo
    cat_mqtt_connected = false;
  }

  return ok;
}

// -------------------------------------------------------------------
// Setup del módulo CAT A7670S
// -------------------------------------------------------------------
void cat_setup() {
  if (!cat_enable) return;
  log("[ CAT ] Iniciando modulo CAT A7670S...");
  cat_power_on();
  cat_network_init();
}

// -------------------------------------------------------------------
// Variables de temporización del loop CAT
// -------------------------------------------------------------------
static unsigned long lastCatPublish = 0;
static unsigned long lastCatRetry   = 0;

// -------------------------------------------------------------------
// Loop del módulo CAT
// Se activa SOLO cuando el WiFi no está disponible
// -------------------------------------------------------------------
void catLoop() {
  if (!cat_enable) return;

  // Si WiFi se recuperó, no usar CAT (evita publicaciones duplicadas)
  if (WiFi.status() == WL_CONNECTED) return;

  unsigned long now = millis();

  // Reintentar registro de red cada 60 s si no está listo
  if (!cat_network_ready && (now - lastCatRetry > 60000)) {
    lastCatRetry = now;
    log("[ CAT ] Reintentando conexion celular...");
    cat_network_init();
  }

  if (!cat_network_ready) return;

  // Publicar según intervalo MQTT configurado
  if (now - lastCatPublish > (unsigned long)mqtt_time_interval) {
    lastCatPublish = now;
    cat_mqtt_publish(String(mqtt_topic_publish), cat_json());
  }
}
