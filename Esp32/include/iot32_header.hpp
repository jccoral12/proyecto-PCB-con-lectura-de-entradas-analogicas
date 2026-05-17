#pragma once
#include <Arduino.h>

// -------------------------------------------------------------------
// Pines ESP32-S3 WROOM (según tabla de distribución de pines)
// -------------------------------------------------------------------
#define LED_GPIO        2   // GPIO2  - Pin 38: LED indicador único
#define CAT_KEY_GPIO    1   // GPIO1  - Pin 39: Control encendido CAT A7670S
#define CAT_TX_GPIO     17  // GPIO17 - Pin 10: UART TX hacia módulo CAT A7670S
#define CAT_RX_GPIO     18  // GPIO18 - Pin 11: UART RX desde módulo CAT A7670S
#define I2C_SDA_GPIO    8   // GPIO8  - Pin 12: I2C SDA - ADC externo ADS1115
#define I2C_SCL_GPIO    9   // GPIO9  - Pin 17: I2C SCL - ADC externo ADS1115

// Alias para el único LED físico en GPIO2
#define WIFILED  LED_GPIO
#define MQTTLED  LED_GPIO
#define APLED    LED_GPIO

// -------------------------------------------------------------------
// Capacidad JSON
// -------------------------------------------------------------------
const size_t capacitySettings = 2500;

// -------------------------------------------------------------------
// Versión de Firmware
// -------------------------------------------------------------------
#define TEXTIFY(A) #A
#define ESCAPEQUOTE(A) TEXTIFY(A)
extern String device_fw_version;

// -------------------------------------------------------------------
// Hardware y Fabricante
// -------------------------------------------------------------------
#define device_hw_version   "IOTMETREX v2 ESP32S3"
#define device_manufacturer "IOTTS"

// -------------------------------------------------------------------
// Configuración Dispositivo
// -------------------------------------------------------------------
extern boolean device_config_file;
extern char    device_config_serial[30];
extern char    device_id[30];
extern int     device_restart;

// -------------------------------------------------------------------
// WIFI modo Cliente
// -------------------------------------------------------------------
extern boolean wifi_ip_static;
extern char    wifi_ssid[30];
extern char    wifi_password[30];
extern char    wifi_ipv4[15];
extern char    wifi_gateway[15];
extern char    wifi_subnet[15];
extern char    wifi_dns_primary[15];
extern char    wifi_dns_secondary[15];

// -------------------------------------------------------------------
// WIFI modo AP
// -------------------------------------------------------------------
extern boolean ap_mode;
extern char    ap_ssid[31];
extern char    ap_password[63];
extern int     ap_chanel;
extern int     ap_visibility;
extern int     ap_connect;

// -------------------------------------------------------------------
// MQTT
// -------------------------------------------------------------------
extern boolean mqtt_cloud_enable;
extern char    mqtt_cloud_id[50];
extern char    mqtt_user[30];
extern char    mqtt_password[39];
extern char    mqtt_server[39];
extern int     mqtt_port;
extern boolean mqtt_retain;
extern int     mqtt_qos;
extern boolean mqtt_time_send;
extern int     mqtt_time_interval;
extern int     mqtt_time_unit;
extern boolean mqtt_status_send;
extern char    mqtt_topic_publish[150];
extern char    mqtt_topic_subscribe[150];
extern char    mqtt_custom_message[512];

// -------------------------------------------------------------------
// Módulo CAT A7670S - Movistar Colombia
// -------------------------------------------------------------------
#define CAT_APN         "internet.movistar.com.co"
#define CAT_BAUD_RATE   115200
#define CAT_TIMEOUT_MS  10000

extern boolean cat_enable;
extern boolean cat_network_ready;

// -------------------------------------------------------------------
// Sensores - 4 canales ADS1115
// -------------------------------------------------------------------
extern float   sensor1;
extern float   sensor2;
extern float   sensor3;
extern float   sensor4;
extern boolean adc_ok;

// -------------------------------------------------------------------
// Firmware Update
// -------------------------------------------------------------------
extern size_t content_len;
#define U_PART U_SPIFFS

// -------------------------------------------------------------------
// EEPROM - contador de reinicios
// -------------------------------------------------------------------
#define Start_Address   0
#define Restart_Address (Start_Address + sizeof(int))
