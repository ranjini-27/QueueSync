/*
 * QueueSync — ESP32 Occupancy + Counter Display Unit (Module 6)
 * ----------------------------------------------------------------------
 * TWO JOBS on one board:
 *
 * 1) OCCUPANCY MONITORING — same dual IR break-beam gate as before.
 *    outer -> inner beam order = entry, inner -> outer = exit.
 *    POSTs each event to POST /api/esp32/occupancy.
 *
 * 2) THREE OLED DISPLAYS, read via TCA9548A I2C multiplexer, all fed by
 *    a single polled GET /api/esp32/display call every DISPLAY_POLL_MS:
 *      - Mux channel 0: "QueueSync" + total occupancy
 *      - Mux channel 1: Counter 1 — Serving / Next
 *      - Mux channel 2: Counter 2 — Serving / Next
 *
 * REQUIRED LIBRARIES (Arduino Library Manager)
 *   - ArduinoJson       by Benoit Blanchon   (v6.x)
 *   - Adafruit SSD1306  by Adafruit
 *   - Adafruit GFX Library (installs alongside Adafruit SSD1306)
 *   ESP32 board package must be installed via Boards Manager.
 *
 * WIRING
 *   IR sensor "outer" (closer to the street/door)  -> GPIO 18, VCC, GND
 *   IR sensor "inner" (closer to the lobby)        -> GPIO 19, VCC, GND
 *   TCA9548A SDA -> GPIO 21, SCL -> GPIO 22, VCC -> 3V3, GND -> GND
 *   OLED 1 (QueueSync/occupancy) -> mux channel 0 (SD0/SC0)
 *   OLED 2 (Counter 1)           -> mux channel 1 (SD1/SC1)
 *   OLED 3 (Counter 2)           -> mux channel 2 (SD2/SC2)
 *   All 3 OLEDs can be identical (same I2C address) since the mux
 *   isolates them onto separate sub-buses.
 *
 *   Most cheap IR obstacle sensors are ACTIVE-LOW (output goes LOW when
 *   the beam is broken) — invert IR_ACTIVE_LOW below if yours is the
 *   opposite.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

/* ------------------------------------------------------------------ */
/* Configuration — edit these for your branch                         */
/* ------------------------------------------------------------------ */

const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Same machine your React client's VITE_API_URL points at.
// Use the server's LAN IP, not "localhost" (that means the ESP32 itself).
const char *API_BASE_URL = "http://10.190.112.252:5000/api";

// Must exactly match ESP32_DEVICE_KEY in server/.env
const char *DEVICE_KEY = "devicekey123";

const int PIN_IR_OUTER = 18; // beam closer to the entrance/street side
const int PIN_IR_INNER = 19; // beam closer to the lobby side
const bool IR_ACTIVE_LOW = true; // true = sensor output is LOW when beam is broken

const unsigned long SENSOR_DEBOUNCE_MS = 60;     // ignore re-triggers on the same sensor faster than this
const unsigned long GATE_TIMEOUT_MS = 2000;      // abandon a crossing if the 2nd beam never breaks in time
const unsigned long WIFI_RETRY_INTERVAL_MS = 5000;

// --- I2C mux + OLED config ---
const int I2C_SDA_PIN = 21;
const int I2C_SCL_PIN = 22;
const uint8_t TCA9548A_ADDR = 0x70; // default mux address
const uint8_t MUX_CHANNEL_QUEUESYNC = 0;
const uint8_t MUX_CHANNEL_COUNTER1 = 1;
const uint8_t MUX_CHANNEL_COUNTER2 = 2;
const uint8_t OLED_I2C_ADDR = 0x3C; // all 3 displays can share this since the mux isolates buses
const int OLED_WIDTH = 128;
const int OLED_HEIGHT = 64;
const int OLED_RESET_PIN = -1;

const unsigned long DISPLAY_POLL_MS = 4000; // how often to GET /esp32/display

/* ------------------------------------------------------------------ */
/* State — occupancy gate                                              */
/* ------------------------------------------------------------------ */

enum GateState { GATE_IDLE, GATE_WAIT_INNER, GATE_WAIT_OUTER };
GateState gateState = GATE_IDLE;
unsigned long gateTimestamp = 0;

bool lastOuterBroken = false;
bool lastInnerBroken = false;
unsigned long lastOuterTriggerAt = 0;
unsigned long lastInnerTriggerAt = 0;

unsigned long lastWifiRetryAt = 0;

/* ------------------------------------------------------------------ */
/* State — displays                                                    */
/* ------------------------------------------------------------------ */

Adafruit_SSD1306 oledQueueSync(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET_PIN);
Adafruit_SSD1306 oledCounter1(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET_PIN);
Adafruit_SSD1306 oledCounter2(OLED_WIDTH, OLED_HEIGHT, &Wire, OLED_RESET_PIN);

bool oledQueueSyncReady = false;
bool oledCounter1Ready = false;
bool oledCounter2Ready = false;

int occupancyValue = 0;
String counter1Serving = "--";
String counter1Next = "--";
String counter2Serving = "--";
String counter2Next = "--";
bool haveDisplayData = false;

unsigned long lastDisplayPollAt = 0;

/* ------------------------------------------------------------------ */
/* Setup                                                               */
/* ------------------------------------------------------------------ */

void setup() {
  Serial.begin(115200);

  pinMode(PIN_IR_OUTER, INPUT);
  pinMode(PIN_IR_INNER, INPUT);

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

  setupOled(MUX_CHANNEL_QUEUESYNC, oledQueueSync, oledQueueSyncReady, "QueueSync");
  setupOled(MUX_CHANNEL_COUNTER1, oledCounter1, oledCounter1Ready, "Counter 1");
  setupOled(MUX_CHANNEL_COUNTER2, oledCounter2, oledCounter2Ready, "Counter 2");

  connectWiFi();
  drawAllScreens();
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected, IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connect timed out — will keep retrying in the loop.");
  }
}

/* ------------------------------------------------------------------ */
/* Main loop                                                           */
/* ------------------------------------------------------------------ */

void loop() {
  maintainWiFi();
  updateGateStateMachine();

  if (millis() - lastDisplayPollAt > DISPLAY_POLL_MS) {
    lastDisplayPollAt = millis();
    pollDisplayData();
    drawAllScreens();
  }
}

void maintainWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (millis() - lastWifiRetryAt < WIFI_RETRY_INTERVAL_MS) return;
  lastWifiRetryAt = millis();
  Serial.println("WiFi disconnected — reconnecting...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

/* ------------------------------------------------------------------ */
/* Occupancy: dual-sensor direction detection (unchanged logic)        */
/* ------------------------------------------------------------------ */

bool checkSensorTriggered(int pin, bool &lastBroken, unsigned long &lastTriggerAt) {
  int raw = digitalRead(pin);
  bool broken = IR_ACTIVE_LOW ? (raw == LOW) : (raw == HIGH);

  bool triggered = false;
  if (broken && !lastBroken && (millis() - lastTriggerAt > SENSOR_DEBOUNCE_MS)) {
    triggered = true;
    lastTriggerAt = millis();
  }
  lastBroken = broken;
  return triggered;
}

void updateGateStateMachine() {
  bool outerTriggered = checkSensorTriggered(PIN_IR_OUTER, lastOuterBroken, lastOuterTriggerAt);
  bool innerTriggered = checkSensorTriggered(PIN_IR_INNER, lastInnerBroken, lastInnerTriggerAt);

  if (gateState != GATE_IDLE && millis() - gateTimestamp > GATE_TIMEOUT_MS) {
    gateState = GATE_IDLE;
  }

  switch (gateState) {
    case GATE_IDLE:
      if (outerTriggered) {
        gateState = GATE_WAIT_INNER;
        gateTimestamp = millis();
      } else if (innerTriggered) {
        gateState = GATE_WAIT_OUTER;
        gateTimestamp = millis();
      }
      break;

    case GATE_WAIT_INNER:
      if (innerTriggered) {
        postOccupancyEvent("entry");
        gateState = GATE_IDLE;
      }
      break;

    case GATE_WAIT_OUTER:
      if (outerTriggered) {
        postOccupancyEvent("exit");
        gateState = GATE_IDLE;
      }
      break;
  }
}

void postOccupancyEvent(const char *direction) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Skipping occupancy POST — WiFi not connected.");
    return;
  }

  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/esp32/occupancy");
  http.setTimeout(4000); // don't let a stalled request block IR-sensor polling for long
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);

  StaticJsonDocument<64> body;
  body["direction"] = direction;
  String payload;
  serializeJson(body, payload);

  int status = http.POST(payload);
  Serial.printf("Occupancy POST (%s) -> HTTP %d\n", direction, status);
  http.end();

  // Nudge the occupancy number on screen immediately rather than waiting
  // for the next poll cycle, so the entry/exit feels instant on-device.
  if (status == 200) {
    if (strcmp(direction, "entry") == 0) occupancyValue++;
    else occupancyValue = max(0, occupancyValue - 1);
    drawQueueSyncScreen();
  }
}

/* ------------------------------------------------------------------ */
/* Display data: poll GET /api/esp32/display                           */
/* ------------------------------------------------------------------ */

void pollDisplayData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Skipping display poll — WiFi not connected.");
    return;
  }

  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/esp32/display");
  http.setTimeout(4000);
  http.addHeader("x-device-key", DEVICE_KEY);

  int status = http.GET();
  if (status != 200) {
    Serial.printf("Display GET -> HTTP %d\n", status);
    http.end();
    return;
  }

  String payload = http.getString();
  http.end();
  parseAndApplyDisplayData(payload);
}

// The ONLY function that knows the response's JSON shape. Tolerant of
// two possible sendSuccess() wrapping styles:
//   A) nested:  { success, message, data: { occupancy, counter1, ... } }
//   B) flat:    { success, message, occupancy, counter1, ... }
// It tries A first, and falls back to the document root (B) if there's
// no "data" object. Whichever one matches your actual apiResponse.js
// wins automatically — no need to guess/edit this by hand.
void parseAndApplyDisplayData(const String &payload) {
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.print("Display JSON parse failed: ");
    Serial.println(err.c_str());
    return;
  }

  JsonVariant data = doc["data"];
  if (data.isNull() || !data.is<JsonObject>()) {
    data = doc.as<JsonVariant>(); // fall back to flat/top-level shape
  }

  if (data["occupancy"].isNull() && data["counter1"].isNull()) {
    Serial.println("Display JSON has neither 'data.occupancy' nor top-level 'occupancy' — check response shape.");
    Serial.println(payload);
    return;
  }

  occupancyValue = data["occupancy"] | occupancyValue;
  counter1Serving = String((const char *)(data["counter1"]["currentServing"] | "--"));
  counter1Next = String((const char *)(data["counter1"]["nextToken"] | "--"));
  counter2Serving = String((const char *)(data["counter2"]["currentServing"] | "--"));
  counter2Next = String((const char *)(data["counter2"]["nextToken"] | "--"));
  haveDisplayData = true;
}

/* ------------------------------------------------------------------ */
/* TCA9548A mux helper                                                 */
/* ------------------------------------------------------------------ */

void selectMuxChannel(uint8_t channel) {
  if (channel > 7) return;
  Wire.beginTransmission(TCA9548A_ADDR);
  Wire.write(1 << channel);
  Wire.endTransmission();
}

/* ------------------------------------------------------------------ */
/* OLED setup + drawing                                                */
/* ------------------------------------------------------------------ */

void setupOled(uint8_t channel, Adafruit_SSD1306 &oled, bool &readyFlag, const char *label) {
  selectMuxChannel(channel);

  // Check begin()'s return value — this is the #1 cause of an OLED
  // silently doing nothing: wrong address, bad wiring, or (with a mux)
  // forgetting to select the channel before talking to the display.
  if (!oled.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDR)) {
    Serial.printf("OLED '%s' (mux ch %d) not found — continuing without it.\n", label, channel);
    readyFlag = false;
    return;
  }

  readyFlag = true;
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.println(label);
  oled.println("Booting...");
  oled.display();
}

void drawAllScreens() {
  drawQueueSyncScreen();
  drawCounterScreen(MUX_CHANNEL_COUNTER1, oledCounter1, oledCounter1Ready, "COUNTER 1", counter1Serving, counter1Next);
  drawCounterScreen(MUX_CHANNEL_COUNTER2, oledCounter2, oledCounter2Ready, "COUNTER 2", counter2Serving, counter2Next);
}

void drawQueueSyncScreen() {
  if (!oledQueueSyncReady) return;
  selectMuxChannel(MUX_CHANNEL_QUEUESYNC);

  oledQueueSync.clearDisplay();

  oledQueueSync.setTextSize(2);
  oledQueueSync.setCursor(0, 0);
  oledQueueSync.println("QueueSync");

  oledQueueSync.drawLine(0, 20, OLED_WIDTH - 1, 20, SSD1306_WHITE);

  oledQueueSync.setTextSize(1);
  oledQueueSync.setCursor(0, 28);
  oledQueueSync.println("Total Occupancy");

  oledQueueSync.setTextSize(3);
  oledQueueSync.setCursor(0, 40);
  oledQueueSync.println(occupancyValue);

  if (WiFi.status() != WL_CONNECTED) {
    oledQueueSync.setTextSize(1);
    oledQueueSync.setCursor(90, 0);
    oledQueueSync.println("!");
  }

  oledQueueSync.display();
}

void drawCounterScreen(uint8_t channel, Adafruit_SSD1306 &oled, bool ready,
                        const char *title, const String &serving, const String &next) {
  if (!ready) return;
  selectMuxChannel(channel);

  oled.clearDisplay();

  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.println(title);
  oled.drawLine(0, 10, OLED_WIDTH - 1, 10, SSD1306_WHITE);

  oled.setCursor(0, 18);
  oled.println("Serving");
  oled.setTextSize(2);
  oled.setCursor(0, 28);
  oled.println(serving);

  oled.setTextSize(1);
  oled.setCursor(0, 48);
  oled.println("Next");
  oled.setCursor(40, 48);
  oled.println(next);

  if (!haveDisplayData) {
    oled.setCursor(100, 0);
    oled.println("!");
  }

  oled.display();
}
