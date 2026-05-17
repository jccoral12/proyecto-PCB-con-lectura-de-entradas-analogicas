#pragma once
#include "iot32_LedBlink.hpp"
#include "iot32_header.hpp"

// -------------------------------------------------------------------
// Log por Serial
// -------------------------------------------------------------------
void log(String s) { Serial.println(s); }

// -------------------------------------------------------------------
// Información de memoria
// -------------------------------------------------------------------
void logMemory() {
  log("[ MEM ] Free Heap    : " + String(ESP.getFreeHeap())    + " bytes");
  log("[ MEM ] Max Alloc    : " + String(ESP.getMaxAllocHeap())+ " bytes");
  log("[ MEM ] Min Free     : " + String(ESP.getMinFreeHeap()) + " bytes");
  log("[ MEM ] Flash Size   : " + String(ESP.getFlashChipSize())+ " bytes");
}

// -------------------------------------------------------------------
// Plataforma de hardware
// -------------------------------------------------------------------
String platform() {
#ifdef ARDUINO_ESP32_DEV
  return "ESP32";
#else
  return "ESP32-S3";
#endif
}

// -------------------------------------------------------------------
// HEX a String (relleno a izquierda)
// -------------------------------------------------------------------
String hexStr(const uint64_t &h, const byte &l = 8) {
  String s1 = String((uint32_t)(h >> 32), HEX);
  s1.toUpperCase();
  String s2 = String((uint32_t)h, HEX);
  s2.toUpperCase();
  while (s2.length() < 8) s2 = "0" + s2;
  String s = s1 + s2;
  while (s.length() < l) s = "0" + s;
  int start = (int)s.length() - (int)l;
  if (start < 0) start = 0;
  return s.substring(start);
}

// -------------------------------------------------------------------
// ID único desde dirección MAC
// -------------------------------------------------------------------
String idUnique() {
  char idunique[15];
  uint64_t chipid = ESP.getEfuseMac();
  uint16_t chip = (uint16_t)(chipid >> 32);
  snprintf(idunique, 15, "%04X", chip);
  return idunique;
}

// -------------------------------------------------------------------
// Número de serie único del dispositivo
// -------------------------------------------------------------------
String deviceID() {
  return String(device_manufacturer) + hexStr(ESP.getEfuseMac()) + idUnique();
}

// -------------------------------------------------------------------
// Configurar pines de salida - ESP32-S3 WROOM
// -------------------------------------------------------------------
void settingPines() {
  // LED único: GPIO2
  pinMode(LED_GPIO, OUTPUT);
  digitalWrite(LED_GPIO, LOW);
  log("[ INFO ] Pin LED configurado: GPIO" + String(LED_GPIO));

  // Pin KEY del módulo CAT A7670S: GPIO1 (HIGH = inactivo)
  pinMode(CAT_KEY_GPIO, OUTPUT);
  digitalWrite(CAT_KEY_GPIO, HIGH);
  log("[ INFO ] Pin CAT_KEY configurado: GPIO" + String(CAT_KEY_GPIO));
}

// -------------------------------------------------------------------
// Convertir string "n.n.n.n" a IPAddress
// -------------------------------------------------------------------
static uint8_t _ip[4];
IPAddress CharToIP(const char *str) {
  sscanf(str, "%hhu.%hhu.%hhu.%hhu", &_ip[0], &_ip[1], &_ip[2], &_ip[3]);
  return IPAddress(_ip[0], _ip[1], _ip[2], _ip[3]);
}

// -------------------------------------------------------------------
// IPAddress a String "n.n.n.n"
// -------------------------------------------------------------------
String ipStr(const IPAddress &ip) {
  String s = "";
  for (byte i = 0; i < 3; i++) {
    s += String((ip >> (8 * i)) & 0xFF) + ".";
  }
  s += String((ip >> 24) & 0xFF);
  return s;
}

// -------------------------------------------------------------------
// Path MQTT estándar
// -------------------------------------------------------------------
String pathMqtt() {
  return "v1/devices/" + String(mqtt_user) + "/" + String(mqtt_cloud_id);
}

// -------------------------------------------------------------------
// Parpadeo LED MQTT Recepción
// -------------------------------------------------------------------
void mqttRX() {
  blinkRandomSingle(5, 50, MQTTLED);
  vTaskDelay(10);
  setOffSingle(MQTTLED);
}

// -------------------------------------------------------------------
// Parpadeo LED MQTT Transmisión
// -------------------------------------------------------------------
void mqttTX() {
  for (int16_t i = 0; i < 6; i++) {
    setOnSingle(MQTTLED);
    vTaskDelay(50);
    setOffSingle(MQTTLED);
    vTaskDelay(10);
  }
}

// -------------------------------------------------------------------
// Tiempo formateado "d:hh:mm:ss"
// -------------------------------------------------------------------
String longTimeStr(const time_t &t) {
  String s = String(t / SECS_PER_DAY) + ':';
  if (hour(t)   < 10) s += '0';
  s += String(hour(t))   + ':';
  if (minute(t) < 10) s += '0';
  s += String(minute(t)) + ':';
  if (second(t) < 10) s += '0';
  s += String(second(t));
  return s;
}

// -------------------------------------------------------------------
// Calidad de señal WiFi en %
// -------------------------------------------------------------------
int getRSSIasQuality(int RSSI) {
  if (RSSI <= -100) return 0;
  if (RSSI >= -50)  return 100;
  return 2 * (RSSI + 100);
}

// -------------------------------------------------------------------
// Obtener body de una petición HTTP como String
// -------------------------------------------------------------------
String GetBodyContent(uint8_t *data, size_t len) {
  String content = "";
  for (size_t i = 0; i < len; i++) {
    content.concat((char)data[i]);
  }
  return content;
}

// -------------------------------------------------------------------
// Tipo de encriptación WiFi
// -------------------------------------------------------------------
String EncryptionType(int encryptionType) {
  switch (encryptionType) {
    case 0: return "Open";
    case 1: return "WEP";
    case 2: return "WPA_PSK";
    case 3: return "WPA2_PSK";
    case 4: return "WPA_WPA2_PSK";
    case 5: return "WPA2_ENTERPRISE";
    default: return "UNKNOWN";
  }
}
