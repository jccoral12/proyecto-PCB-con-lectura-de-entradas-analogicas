// -------------------------------------------------------------------
// Librerías
// -------------------------------------------------------------------
#include <Arduino.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <SPIFFS.h>
#include <TimeLib.h>

// -------------------------------------------------------------------
// Definiciones de variables globales (una sola unidad de compilación)
// Todos los .hpp declaran extern; aquí se definen realmente.
// -------------------------------------------------------------------

boolean device_config_file;
char    device_config_serial[30];
char    device_id[30];
int     device_restart;

boolean wifi_ip_static;
char    wifi_ssid[30];
char    wifi_password[30];
char    wifi_ipv4[15];
char    wifi_gateway[15];
char    wifi_subnet[15];
char    wifi_dns_primary[15];
char    wifi_dns_secondary[15];

boolean ap_mode;
char    ap_ssid[31];
char    ap_password[63];
int     ap_chanel;
int     ap_visibility;
int     ap_connect;

boolean mqtt_cloud_enable;
char    mqtt_cloud_id[50];
char    mqtt_user[30];
char    mqtt_password[39];
char    mqtt_server[39];
int     mqtt_port;
boolean mqtt_retain;
int     mqtt_qos;
boolean mqtt_time_send;
int     mqtt_time_interval;
int     mqtt_time_unit;
boolean mqtt_status_send;
char    mqtt_topic_publish[150];
char    mqtt_topic_subscribe[150];
char    mqtt_custom_message[512];

boolean cat_enable        = true;
boolean cat_network_ready = false;

float   sensor1 = 0.0;
float   sensor2 = 0.0;
float   sensor3 = 0.0;
float   sensor4 = 0.0;
boolean adc_ok  = false;

size_t  content_len;

// -------------------------------------------------------------------
// Archivos *.hpp - Módulos del proyecto
// ORDEN: functions → header → adc → cat → mqtt → settings → wifi
// -------------------------------------------------------------------
#include "iot32_functions.hpp"
#include "iot32_header.hpp"
#include "iot32_adc.hpp"
#include "iot32_cat.hpp"
#include "iot32_mqtt.hpp"
#include "iot32_settings.hpp"
#include "iot32_wifi.hpp"

String  device_fw_version = ESCAPEQUOTE(BUILD_TAG);

// -------------------------------------------------------------------
// Temporización: lectura de sensores cada 1 segundo
// -------------------------------------------------------------------
unsigned long lastSensorRead     = 0;
const unsigned long SENSOR_READ_INTERVAL = 1000; // ms

// -------------------------------------------------------------------
// Setup
// -------------------------------------------------------------------
void setup() {
  // Serial0 = USB CDC (GPIO43/44) — ARDUINO_USB_CDC_ON_BOOT=1
  Serial.begin(115200);
  delay(1000);

  setCpuFrequencyMhz(240);

  // ----- EEPROM: contador de reinicios -----
  EEPROM.begin(256);
  EEPROM.get(Restart_Address, device_restart);
  device_restart++;
  EEPROM.put(Restart_Address, device_restart);
  EEPROM.commit();
  EEPROM.end();

  log("\n[ INFO ] ========================================");
  log("[ INFO ] Iniciando Setup - ESP32-S3 WROOM");
  log("[ INFO ] FW: " + device_fw_version);
  log("[ INFO ] HW: " + String(device_hw_version));
  log("[ INFO ] MAC: " + WiFi.macAddress());
  log("[ INFO ] Reinicios: " + String(device_restart));
  log("[ INFO ] Core: " + String(xPortGetCoreID()));
  log("[ INFO ] ========================================");

  // ----- SPIFFS -----
  if (!SPIFFS.begin(true)) {
    log("[ ERROR ] Fallo al inicializar SPIFFS");
    while (true) delay(1000);
  }

  // ----- Configuración desde settings.json -----
  if (!settingsRead()) {
    log("[ INFO ] Guardando configuracion por defecto en SPIFFS...");
    settingsSave();
  }

  // ----- Pines de salida -----
  settingPines();

  // ----- ADC externo ADS1115 (I2C: SDA=GPIO8, SCL=GPIO9) -----
  adc_setup();

  // ----- WiFi (conectividad primaria) -----
  wifi_setup();

  // ----- Módulo CAT A7670S (respaldo celular) -----
  cat_setup();

  log("[ INFO ] Setup completado");
  logMemory();
}

// -------------------------------------------------------------------
// Loop Principal
//
// Prioridad de envío:
//   1. WiFi disponible → MQTT sobre WiFi
//   2. WiFi no disponible → MQTT sobre CAT A7670S (Movistar)
// -------------------------------------------------------------------
void loop() {

  // ----- Lectura periódica de los 4 sensores (ADS1115) -----
  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_READ_INTERVAL) {
    lastSensorRead = now;
    adc_read_all();
  }

  // -----------------------------------------------------------------
  // WiFi Loop
  // -----------------------------------------------------------------
  if (wifi_mode == WIFI_STA) {
    wifiLoop();
  } else if (wifi_mode == WIFI_AP) {
    wifiAPLoop();
  }

  // -----------------------------------------------------------------
  // MQTT vía WiFi (PRIORIDAD)
  // -----------------------------------------------------------------
  if (WiFi.status() == WL_CONNECTED) {
    if (mqtt_cloud_enable && mqtt_server[0] != '\0') {
      mqttLoop();
      if (mqttClient.connected() && mqtt_time_send) {
        if (millis() - lastMsg > (unsigned long)mqtt_time_interval) {
          lastMsg = millis();
          mqtt_publish();
        }
      }
    }
  }
  // -----------------------------------------------------------------
  // MQTT vía CAT A7670S (RESPALDO cuando no hay WiFi)
  // -----------------------------------------------------------------
  else {
    catLoop();
  }
}
