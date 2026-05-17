#pragma once
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include "iot32_header.hpp"
#include "iot32_functions.hpp"

Adafruit_ADS1115 ads;

// -------------------------------------------------------------------
// Inicializar el ADC ADS1115IDGS por I2C
// SDA = GPIO8 (Pin 12), SCL = GPIO9 (Pin 17)
// Dirección I2C por defecto: 0x48 (ADDR → GND)
// -------------------------------------------------------------------
void adc_setup() {
  Wire.begin(I2C_SDA_GPIO, I2C_SCL_GPIO);

  if (!ads.begin(0x48)) {
    log("[ ERROR ] ADS1115 no encontrado en 0x48. Verifica conexiones I2C.");
    adc_ok = false;
    return;
  }

  // GAIN_ONE = ±4.096V → resolución 0.125 mV/bit
  // Cambiar a GAIN_TWO (±2.048V) si los sensores entregan max 2V
  ads.setGain(GAIN_ONE);
  ads.setDataRate(RATE_ADS1115_128SPS);

  adc_ok = true;
  log("[ INFO ] ADS1115 OK (SDA=GPIO" + String(I2C_SDA_GPIO) +
      " SCL=GPIO" + String(I2C_SCL_GPIO) + ")");
}

// -------------------------------------------------------------------
// Leer los 4 canales del ADS1115 → actualiza sensor1..sensor4 (en V)
// Canal A0 → sensor1, A1 → sensor2, A2 → sensor3, A3 → sensor4
//
// CALIBRACIÓN: para convertir voltaje a presión, aplicar la curva
// de tu sensor aquí. Ejemplo sensor 4-20mA con shunt 250Ω:
//   float mA = (sensorX / 250.0) * 1000.0;
//   float bar = (mA - 4.0) / 16.0 * RANGO_MAX_BAR;
// -------------------------------------------------------------------
void adc_read_all() {
  if (!adc_ok) return;

  // Con GAIN_ONE: LSB = 0.125 mV = 0.000125 V
  const float mv_per_bit = 0.000125F;

  sensor1 = ads.readADC_SingleEnded(0) * mv_per_bit;
  sensor2 = ads.readADC_SingleEnded(1) * mv_per_bit;
  sensor3 = ads.readADC_SingleEnded(2) * mv_per_bit;
  sensor4 = ads.readADC_SingleEnded(3) * mv_per_bit;

  log("[ ADC ] S1=" + String(sensor1, 4) + "V  S2=" + String(sensor2, 4) +
      "V  S3=" + String(sensor3, 4) + "V  S4=" + String(sensor4, 4) + "V");
}
