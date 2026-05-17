#pragma once
#include "iot32_functions.hpp"
#include "iot32_header.hpp"
#include <DNSServer.h>
#include <ESPmDNS.h>
#include <WiFi.h>

const byte DNSSERVER_PORT = 53;
DNSServer  dnsServer;

IPAddress ap_IPv4(192, 168, 4, 1);
IPAddress ap_subnet(255, 255, 255, 0);

int  wifi_mode   = WIFI_STA;
bool wifi_change = false;

unsigned long previousMillisWIFI = 0;
unsigned long previousMillisAP   = 0;
unsigned long intervalWIFI       = 30000; // 30 s entre reintentos

// mDNS hostname → http://esp32_device.local
const char *esp_hostname = device_id;

// -------------------------------------------------------------------
// Iniciar WIFI Modo AP
// -------------------------------------------------------------------
void startAP() {
  log("[ INFO ] Iniciando Punto de Acceso (AP)");
  WiFi.softAPConfig(ap_IPv4, ap_IPv4, ap_subnet);
  WiFi.hostname(esp_hostname);
  WiFi.softAP(ap_ssid, ap_password, ap_chanel, ap_visibility, ap_connect);
  log("[ INFO ] WiFi AP " + String(ap_ssid) + " - IP " + ipStr(WiFi.softAPIP()));
  dnsServer.setErrorReplyCode(DNSReplyCode::ServerFailure);
  dnsServer.start(DNSSERVER_PORT, "*", ap_IPv4);
  setOnSingle(APLED);
  wifi_mode = WIFI_AP;
}

// -------------------------------------------------------------------
// Iniciar WIFI Modo Estación
// -------------------------------------------------------------------
void startClient() {
  log("[ INFO ] Conectando a la red WiFi (STA): " + String(wifi_ssid));
  WiFi.mode(WIFI_STA);

  if (wifi_ip_static) {
    if (!WiFi.config(CharToIP(wifi_ipv4), CharToIP(wifi_gateway),
                     CharToIP(wifi_subnet), CharToIP(wifi_dns_primary),
                     CharToIP(wifi_dns_secondary))) {
      log("[ ERROR ] Fallo configuracion IP estatica");
    }
  }

  WiFi.hostname(esp_hostname);
  WiFi.begin(wifi_ssid, wifi_password);

  byte b = 0;
  while (WiFi.status() != WL_CONNECTED && b < 60) {
    b++;
    log("[ WARNING ] Intento " + String(b) + "/60 conectando a WiFi...");
    vTaskDelay(500);
    blinkSingle(100, WIFILED);
  }

  if (WiFi.status() == WL_CONNECTED) {
    log("[ INFO ] WiFi conectado. RSSI=" + String(WiFi.RSSI()) +
        " dBm  IPv4=" + ipStr(WiFi.localIP()));
    blinkRandomSingle(10, 100, WIFILED);
    wifi_mode   = WIFI_STA;
    wifi_change = true;
  } else {
    log("[ ERROR ] No se pudo conectar a WiFi. Iniciando AP de emergencia...");
    blinkRandomSingle(10, 100, WIFILED);
    wifi_change = true;
    startAP();
  }
}

// -------------------------------------------------------------------
// Setup WiFi
// -------------------------------------------------------------------
void wifi_setup() {
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);

  if (wifi_ssid[0] != '\0') {
    startClient();
    if (WiFi.status() == WL_CONNECTED) {
      log("[ INFO ] WiFi Modo Estacion conectado");
      // Colombia = UTC-5 (sin horario de verano)
      configTime(-5 * 3600, 0, "pool.ntp.org", "time.nist.gov");
      log("[ INFO ] Sincronizando hora con NTP (UTC-5 Colombia)...");
    }
  } else {
    log("[ WARN ] No hay SSID configurado. Inicia AP.");
    startAP();
  }

  if (wifi_mode == WIFI_STA || wifi_mode == WIFI_AP) {
    if (MDNS.begin(esp_hostname)) {
      MDNS.addService("http", "tcp", 80);
      log("[ INFO ] mDNS activo: http://" + String(esp_hostname) + ".local");
    }
  }
}

// -------------------------------------------------------------------
// Loop Modo Estación
// -------------------------------------------------------------------
static byte w = 0;
void wifiLoop() {
  unsigned long currentMillis = millis();
  if (WiFi.status() != WL_CONNECTED &&
      (currentMillis - previousMillisWIFI >= intervalWIFI)) {
    w++;
    blinkSingle(100, WIFILED);
    WiFi.disconnect(true);
    WiFi.reconnect();
    previousMillisWIFI = currentMillis;

    // Tras 2 intentos fallidos (~1 min) cambia a AP
    if (w >= 2) {
      log("[ INFO ] 2 intentos fallidos, cambiando a Modo AP");
      wifi_change = true;
      w = 0;
      startAP();
    } else {
      log("[ WARNING ] SSID " + String(wifi_ssid) + " desconectado, reintentando...");
    }
  } else if (WiFi.status() == WL_CONNECTED) {
    w = 0; // Resetear contador al reconectar
    blinkSingleAsy(10, 500, WIFILED);
  }
}

// -------------------------------------------------------------------
// Loop Modo AP
// Espera 10 minutos en AP, luego intenta volver a STA
// -------------------------------------------------------------------
static byte a = 0;
void wifiAPLoop() {
  blinkSingleAsy(5, 100, WIFILED);
  dnsServer.processNextRequest();

  unsigned long currentMillis = millis();
  if ((currentMillis - previousMillisAP >= intervalWIFI) && wifi_change) {
    a++;
    previousMillisAP = currentMillis;
    // 20 iteraciones × 30 s = 10 minutos en modo AP
    if (a >= 20) {
      log("[ INFO ] 10 min en modo AP, reintentando conexion STA...");
      wifi_change = false;
      a = 0;
      startClient();
    }
  }
}
