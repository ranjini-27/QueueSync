# ESP32 Occupancy Unit (Module 6)

Firmware for the ESP32 board that handles entrance occupancy monitoring —
two directional IR break-beam sensors at the entrance. "Now serving" and
all other displays are handled entirely by the web app (staff dashboard /
TV display), so this board no longer drives any display hardware.

## 1. Hardware

| Component                | Connects to                          |
|---------------------------|---------------------------------------|
| IR sensor — **outer** beam (nearer the street/door) | GPIO 27, VCC, GND |
| IR sensor — **inner** beam (nearer the lobby)       | GPIO 26, VCC, GND |

Mount the two IR sensors a short distance apart across the entrance walkway
so a person crosses the outer beam, then the inner beam (or the reverse on
the way out). That ordering is how the firmware tells entry from exit —
see `updateGateStateMachine()` in the sketch.

Most inexpensive IR obstacle-avoidance modules pull their output **LOW**
when the beam is broken. If yours does the opposite, flip
`IR_ACTIVE_LOW` to `false` in the sketch.

## 2. Arduino IDE setup

1. **Boards Manager** → install "esp32" by Espressif Systems.
2. **Library Manager** → install:
   - `ArduinoJson` (Benoit Blanchon, v6.x)
3. Open `smart_bank_esp32.ino`, select your ESP32 board + port.

## 3. Configure the sketch

Edit the constants at the top of `smart_bank_esp32.ino`:

```cpp
const char *WIFI_SSID = "YOUR_WIFI_SSID";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char *API_BASE_URL = "http://192.168.1.50:5000/api"; // your server's LAN IP, not localhost
const char *DEVICE_KEY = "change_this_device_key";          // must match ESP32_DEVICE_KEY in server/.env
```

`DEVICE_KEY` must be identical to `ESP32_DEVICE_KEY` in `server/.env` —
it's the shared secret the backend uses to accept occupancy events only
from this device (see `verifyDeviceKey` in `server/middleware/authMiddleware.js`).

## 4. What it talks to

| Direction | Endpoint | Auth |
|---|---|---|
| ESP32 → server | `POST /api/esp32/occupancy` `{ "direction": "entry" \| "exit" }` | `x-device-key` header |

## 5. Troubleshooting

- **Occupancy never changes on the dashboard** — check `DEVICE_KEY`
  matches `server/.env` exactly, and that `API_BASE_URL` is reachable
  from the ESP32's WiFi network (use the server machine's LAN IP).
- **Entries counted as exits or vice versa** — swap the `PIN_IR_OUTER` /
  `PIN_IR_INNER` wiring, or swap the two pin numbers in the sketch.
