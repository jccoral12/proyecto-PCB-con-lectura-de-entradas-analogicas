#pragma once
#include "iot32_functions.hpp"
#include "iot32_header.hpp"
#include <PubSubClient.h>
#include <WiFi.h>

WiFiClient   espClient;
PubSubClient mqttClient(espClient);

char   topic[150];
String mqtt_data = "";
unsigned long lastMqttReconnectAttempt = 0;
unsigned long lastMsg = 0;

void    callback(char *topic, byte *payload, unsigned int length);
String  Json();

char willTopic[150];
bool willQoS     = 0;
bool willRetain  = false;
String willMessage  = "{\"connected\": false}";
bool cleanSession   = true;

// -------------------------------------------------------------------
// MQTT Connect
// -------------------------------------------------------------------
boolean mqtt_connect() {
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(callback);
  // Buffer suficiente para payloads con 4 floats + metadata
  mqttClient.setBufferSize(1024);
  log("[ INFO ] Intentando conexion al Broker MQTT " +
      String(mqtt_server) + ":" + String(mqtt_port));

  String topic_publish = String(mqtt_topic_publish);
  topic_publish.toCharArray(willTopic, 150);

  const char *client_id = mqtt_cloud_id;
  boolean connected = false;

  if (strlen(mqtt_user) > 0) {
    connected = mqttClient.connect(client_id, mqtt_user, mqtt_password,
                                   willTopic, willQoS, willRetain,
                                   willMessage.c_str(), cleanSession);
  } else {
    connected = mqttClient.connect(client_id, NULL, NULL,
                                   willTopic, willQoS, willRetain,
                                   willMessage.c_str(), cleanSession);
  }

  if (connected) {
    log("[ INFO ] Conectado al Broker MQTT");
    String topic_subscribe = String(mqtt_topic_subscribe);
    topic_subscribe.toCharArray(topic, 150);

    if (mqttClient.subscribe(topic, mqtt_qos)) {
      log("[ INFO ] Suscrito: " + String(topic));
    } else {
      log("[ ERROR ] Fallo al suscribirse");
    }
    if (mqtt_status_send) {
      mqttClient.publish(willTopic, "{\"connected\": true}", mqtt_retain);
    }
  } else {
    log("[ ERROR ] Fallo conexion MQTT, rc=" + String(mqttClient.state()));
    return false;
  }
  return true;
}

// -------------------------------------------------------------------
// Manejo de mensajes entrantes (suscripción)
// -------------------------------------------------------------------
void callback(char *topic, byte *payload, unsigned int length) {
  String str_topic(topic);
  String mensaje((char *)payload, length);
  mensaje.trim();
  mqttRX();
  log("[ INFO ] Topico  --> " + str_topic);
  log("[ INFO ] Mensaje --> " + mensaje);
}

// -------------------------------------------------------------------
// JSON con datos de sensores para envío por MQTT vía WiFi
// -------------------------------------------------------------------
String Json() {
  String response;
  DynamicJsonDocument jsonDoc(768);

  jsonDoc["dispositivo_uuid"] = String(mqtt_cloud_id);
  jsonDoc["sensor1"]          = sensor1;
  jsonDoc["sensor2"]          = sensor2;
  jsonDoc["sensor3"]          = sensor3;
  jsonDoc["sensor4"]          = sensor4;
  jsonDoc["via"]              = "WiFi";
  jsonDoc["rssi"]             = WiFi.RSSI();

  serializeJson(jsonDoc, response);
  return response;
}

// -------------------------------------------------------------------
// Publicar mensaje MQTT (vía WiFi)
// -------------------------------------------------------------------
void mqtt_publish() {
  String pub_topic = String(mqtt_topic_publish);

  if (strlen(mqtt_custom_message) > 0) {
    mqtt_data = String(mqtt_custom_message);
  } else {
    mqtt_data = Json();
  }

  mqttClient.publish(pub_topic.c_str(), mqtt_data.c_str(), mqtt_retain);
  log("[ MQTT ] Publicado: " + mqtt_data);
  mqtt_data = "";
  mqttTX();
}

// -------------------------------------------------------------------
// MQTT Loop Principal (vía WiFi)
// -------------------------------------------------------------------
void mqttLoop() {
  if (!mqtt_cloud_enable) return;

  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if ((now < 10000) || ((now - lastMqttReconnectAttempt) > 10000)) {
      lastMqttReconnectAttempt = now;
      if (mqtt_connect()) {
        lastMqttReconnectAttempt = 0;
      }
      setOnSingle(MQTTLED);
    }
  } else {
    mqttClient.loop();
    setOffSingle(MQTTLED);
  }
}
