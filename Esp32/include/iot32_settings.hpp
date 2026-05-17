#pragma once
#include "iot32_functions.hpp"
#include "iot32_header.hpp"

boolean settingsRead();
void    settingsReset();
boolean settingsSave();

// -------------------------------------------------------------------
// Leer configuración desde /settings.json en SPIFFS
// -------------------------------------------------------------------
boolean settingsRead() {
  settingsReset(); // Cargar defaults primero

  DynamicJsonDocument jsonSettings(capacitySettings);
  File file = SPIFFS.open("/settings.json", "r");
  if (!file) {
    log("[ WARN ] No se encontro settings.json, usando valores por defecto");
    return false;
  }

  DeserializationError error = deserializeJson(jsonSettings, file);
  file.close();
  if (error) {
    log("[ ERROR ] Error al deserializar settings.json: " + String(error.c_str()));
    return false;
  }

  const char *val;
  if (jsonSettings.containsKey("device_config_file"))
    device_config_file = jsonSettings["device_config_file"];
  if ((val = jsonSettings["device_config_serial"]))
    strlcpy(device_config_serial, val, sizeof(device_config_serial));
  if ((val = jsonSettings["device_id"]))
    strlcpy(device_id, val, sizeof(device_id));

  if (jsonSettings.containsKey("wifi_ip_static"))
    wifi_ip_static = jsonSettings["wifi_ip_static"];
  if ((val = jsonSettings["wifi_ssid"]))
    strlcpy(wifi_ssid, val, sizeof(wifi_ssid));
  if ((val = jsonSettings["wifi_password"]))
    strlcpy(wifi_password, val, sizeof(wifi_password));
  if ((val = jsonSettings["wifi_ipv4"]))
    strlcpy(wifi_ipv4, val, sizeof(wifi_ipv4));
  if ((val = jsonSettings["wifi_subnet"]))
    strlcpy(wifi_subnet, val, sizeof(wifi_subnet));
  if ((val = jsonSettings["wifi_gateway"]))
    strlcpy(wifi_gateway, val, sizeof(wifi_gateway));
  if ((val = jsonSettings["wifi_dns_primary"]))
    strlcpy(wifi_dns_primary, val, sizeof(wifi_dns_primary));
  if ((val = jsonSettings["wifi_dns_secondary"]))
    strlcpy(wifi_dns_secondary, val, sizeof(wifi_dns_secondary));

  if (jsonSettings.containsKey("ap_mode"))
    ap_mode = jsonSettings["ap_mode"];
  if ((val = jsonSettings["ap_ssid"]))
    strlcpy(ap_ssid, val, sizeof(ap_ssid));
  if ((val = jsonSettings["ap_password"]))
    strlcpy(ap_password, val, sizeof(ap_password));
  if (jsonSettings.containsKey("ap_visibility"))
    ap_visibility = jsonSettings["ap_visibility"];
  if (jsonSettings.containsKey("ap_chanel"))
    ap_chanel = jsonSettings["ap_chanel"];
  if (jsonSettings.containsKey("ap_connect"))
    ap_connect = jsonSettings["ap_connect"];

  if (jsonSettings.containsKey("mqtt_cloud_enable"))
    mqtt_cloud_enable = jsonSettings["mqtt_cloud_enable"];
  if ((val = jsonSettings["mqtt_user"]))
    strlcpy(mqtt_user, val, sizeof(mqtt_user));
  if ((val = jsonSettings["mqtt_password"]))
    strlcpy(mqtt_password, val, sizeof(mqtt_password));
  if ((val = jsonSettings["mqtt_server"]))
    strlcpy(mqtt_server, val, sizeof(mqtt_server));
  if ((val = jsonSettings["mqtt_cloud_id"]))
    strlcpy(mqtt_cloud_id, val, sizeof(mqtt_cloud_id));
  if (jsonSettings.containsKey("mqtt_port"))
    mqtt_port = jsonSettings["mqtt_port"];
  if (jsonSettings.containsKey("mqtt_retain"))
    mqtt_retain = jsonSettings["mqtt_retain"];
  if (jsonSettings.containsKey("mqtt_qos"))
    mqtt_qos = jsonSettings["mqtt_qos"];
  if (jsonSettings.containsKey("mqtt_time_send"))
    mqtt_time_send = jsonSettings["mqtt_time_send"];
  if (jsonSettings.containsKey("mqtt_time_interval"))
    mqtt_time_interval = jsonSettings["mqtt_time_interval"];
  if (jsonSettings.containsKey("mqtt_time_unit"))
    mqtt_time_unit = jsonSettings["mqtt_time_unit"];
  if (jsonSettings.containsKey("mqtt_status_send"))
    mqtt_status_send = jsonSettings["mqtt_status_send"];
  if ((val = jsonSettings["mqtt_topic_publish"]))
    strlcpy(mqtt_topic_publish, val, sizeof(mqtt_topic_publish));
  if ((val = jsonSettings["mqtt_topic_subscribe"]))
    strlcpy(mqtt_topic_subscribe, val, sizeof(mqtt_topic_subscribe));
  if ((val = jsonSettings["mqtt_custom_message"]))
    strlcpy(mqtt_custom_message, val, sizeof(mqtt_custom_message));

  log("[ INFO ] Configuracion cargada desde settings.json");
  log("[ INFO ]   SSID     : " + String(wifi_ssid));
  log("[ INFO ]   MQTT     : " + String(mqtt_server) + ":" + String(mqtt_port));
  log("[ INFO ]   DeviceID : " + String(mqtt_cloud_id));
  return true;
}

// -------------------------------------------------------------------
// Valores por defecto — EDITA AQUI TUS DATOS DE RED/MQTT
// -------------------------------------------------------------------
void settingsReset() {
  device_config_file = true;
  strlcpy(device_config_serial, "serial1320001",        sizeof(device_config_serial));
  strlcpy(device_id,            "esp32_device",         sizeof(device_id));

  // WiFi Cliente
  wifi_ip_static = false;
  strlcpy(wifi_ssid,          "honor",               sizeof(wifi_ssid));
  strlcpy(wifi_password,      "1085@bcd",           sizeof(wifi_password));
  strlcpy(wifi_ipv4,          "192.168.1.100",         sizeof(wifi_ipv4));
  strlcpy(wifi_subnet,        "255.255.255.0",         sizeof(wifi_subnet));
  strlcpy(wifi_gateway,       "192.168.1.1",           sizeof(wifi_gateway));
  strlcpy(wifi_dns_primary,   "8.8.8.8",               sizeof(wifi_dns_primary));
  strlcpy(wifi_dns_secondary, "8.8.4.4",               sizeof(wifi_dns_secondary));

  // WiFi AP (modo de emergencia)
  ap_mode       = false;
  strlcpy(ap_ssid,     "ESP32_AP",    sizeof(ap_ssid));
  strlcpy(ap_password, "admin1234",   sizeof(ap_password));
  ap_visibility = false;
  ap_chanel     = 9;
  ap_connect    = 4;

  // MQTT
  mqtt_cloud_enable = true;
  strlcpy(mqtt_user,            "plcuser",              sizeof(mqtt_user));
  strlcpy(mqtt_password,        "plc",                  sizeof(mqtt_password));
  strlcpy(mqtt_server,          "192.168.1.100",        sizeof(mqtt_server));
  strlcpy(mqtt_cloud_id,        "PEGAR-UUID-DISPOSITIVO-AQUI", sizeof(mqtt_cloud_id));
  mqtt_port          = 1883;
  mqtt_retain        = false;
  mqtt_qos           = 0;
  mqtt_time_send     = true;
  mqtt_time_interval = 5000;  // ms entre publicaciones
  mqtt_time_unit     = 1;
  mqtt_status_send   = true;
  strlcpy(mqtt_topic_publish,   "Plc/Esp32", sizeof(mqtt_topic_publish));
  strlcpy(mqtt_topic_subscribe, "Plc/Esp32", sizeof(mqtt_topic_subscribe));
  strlcpy(mqtt_custom_message,  "",           sizeof(mqtt_custom_message));
}

// -------------------------------------------------------------------
// Guardar configuración actual en /settings.json
// -------------------------------------------------------------------
boolean settingsSave() {
  DynamicJsonDocument jsonSettings(capacitySettings);
  File file = SPIFFS.open("/settings.json", "w+");
  if (!file) {
    log("[ ERROR ] No se pudo abrir settings.json para escritura");
    return false;
  }

  jsonSettings["device_config_file"]   = device_config_file;
  jsonSettings["device_config_serial"] = device_config_serial;
  jsonSettings["device_id"]            = device_id;
  jsonSettings["wifi_ip_static"]       = wifi_ip_static;
  jsonSettings["wifi_ssid"]            = wifi_ssid;
  jsonSettings["wifi_password"]        = wifi_password;
  jsonSettings["wifi_ipv4"]            = wifi_ipv4;
  jsonSettings["wifi_subnet"]          = wifi_subnet;
  jsonSettings["wifi_gateway"]         = wifi_gateway;
  jsonSettings["wifi_dns_primary"]     = wifi_dns_primary;
  jsonSettings["wifi_dns_secondary"]   = wifi_dns_secondary;
  jsonSettings["ap_mode"]              = ap_mode;
  jsonSettings["ap_ssid"]              = ap_ssid;
  jsonSettings["ap_password"]          = ap_password;
  jsonSettings["ap_visibility"]        = ap_visibility;
  jsonSettings["ap_chanel"]            = ap_chanel;
  jsonSettings["ap_connect"]           = ap_connect;
  jsonSettings["mqtt_cloud_enable"]    = mqtt_cloud_enable;
  jsonSettings["mqtt_user"]            = mqtt_user;
  jsonSettings["mqtt_password"]        = mqtt_password;
  jsonSettings["mqtt_server"]          = mqtt_server;
  jsonSettings["mqtt_cloud_id"]        = mqtt_cloud_id;
  jsonSettings["mqtt_port"]            = mqtt_port;
  jsonSettings["mqtt_retain"]          = mqtt_retain;
  jsonSettings["mqtt_qos"]             = mqtt_qos;
  jsonSettings["mqtt_time_send"]       = mqtt_time_send;
  jsonSettings["mqtt_time_interval"]   = mqtt_time_interval;
  jsonSettings["mqtt_time_unit"]       = mqtt_time_unit;
  jsonSettings["mqtt_status_send"]     = mqtt_status_send;
  jsonSettings["mqtt_topic_publish"]   = mqtt_topic_publish;
  jsonSettings["mqtt_topic_subscribe"] = mqtt_topic_subscribe;
  jsonSettings["mqtt_custom_message"]  = mqtt_custom_message;

  serializeJsonPretty(jsonSettings, file);
  file.close();
  log("[ INFO ] settings.json guardado correctamente");
  return true;
}
