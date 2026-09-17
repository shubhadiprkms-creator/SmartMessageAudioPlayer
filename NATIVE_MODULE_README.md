# Native Android Module Requirements

## Overview
This React Native app requires two native Android modules for full functionality.
These cannot be provided in a managed Expo workflow and require a custom dev build.

---

## 1. SmapNotificationModule (Kotlin)

### Purpose
Implements `NotificationListenerService` to detect incoming SMS/messaging notifications.

### Required Files
- `android/app/src/main/java/com/smap/SmapNotificationService.kt`
- `android/app/src/main/java/com/smap/SmapNotificationModule.kt`
- `android/app/src/main/java/com/smap/SmapNotificationPackage.kt`

### SmapNotificationService.kt (skeleton)
```kotlin
class SmapNotificationService : NotificationListenerService() {
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val extras = sbn.notification.extras
        val title = extras.getString(Notification.EXTRA_TITLE) ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        
        // Emit to JS
        SmapNotificationModule.emitNotification(
            id = sbn.id,
            key = sbn.key,
            packageName = sbn.packageName,
            sender = title,
            text = text,
            timestamp = sbn.postTime
        )
    }
}
```

### AndroidManifest.xml additions
```xml
<service android:name=".SmapNotificationService"
    android:label="Smart Message Audio Player"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService" />
    </intent-filter>
</service>
```

### SmapNotificationModule API
```kotlin
// Methods exposed to JS:
fun isNotificationAccessEnabled(promise: Promise)
fun startListening()
fun stopListening()

// Events emitted to JS:
// "onNotificationPosted" → { id, key, packageName, sender, text, timestamp }
// "onNotificationRemoved" → { key }
```

---

## 2. SmapTTSModule (Kotlin)

### Purpose
Uses Android's `TextToSpeech.synthesizeToFile()` to generate real WAV audio files from text.

### SmapTTSModule API
```kotlin
// Methods exposed to JS:
fun synthesizeToFile(
    text: String,
    language: String,   // "en-US", "bn-BD", "en-IN"
    outputPath: String,
    promise: Promise    // resolves { success: Boolean, path: String?, error: String? }
)
```

### Implementation skeleton
```kotlin
class SmapTTSModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private var tts: TextToSpeech? = null

    @ReactMethod
    fun synthesizeToFile(text: String, language: String, outputPath: String, promise: Promise) {
        tts = TextToSpeech(reactApplicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val locale = Locale.forLanguageTag(language)
                tts?.language = locale
                val params = Bundle()
                params.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "smap_tts")
                val result = tts?.synthesizeToFile(text, params, File(outputPath), "smap_tts")
                if (result == TextToSpeech.SUCCESS) {
                    promise.resolve(mapOf("success" to true, "path" to outputPath))
                } else {
                    promise.resolve(mapOf("success" to false, "error" to "synthesizeToFile failed"))
                }
            } else {
                promise.resolve(mapOf("success" to false, "error" to "TTS init failed"))
            }
        }
    }
}
```

---

## ESP32 Firmware Protocol

```
GET  /status     → 200 { "status": "ready" }
POST /audio      → multipart/form-data, field: "audio", Content-Type: audio/wav
                   Headers: X-SMAP-Protocol: SMAP_START, X-SMAP-Size: <bytes>
                   Response 200: { "ack": "SMAP_ACK_OK", "msg": "Playing" }
                   Response 200: { "ack": "SMAP_ACK_FAIL", "msg": "<reason>" }

WAV format: PCM 16-bit, Mono, 22050 Hz, standard RIFF header
```

### Minimal ESP32 Arduino sketch (HTTP server)
```cpp
#include <WiFi.h>
#include <WebServer.h>

WebServer server(8080);

void handleStatus() {
  server.send(200, "application/json", "{\"status\":\"ready\"}");
}

void handleAudio() {
  if (server.hasArg("audio")) {
    String wavData = server.arg("audio");
    // Write to SD card or buffer
    // Start DAC playback
    server.send(200, "application/json", "{\"ack\":\"SMAP_ACK_OK\",\"msg\":\"Playing\"}");
  } else {
    server.send(400, "application/json", "{\"ack\":\"SMAP_ACK_FAIL\",\"msg\":\"No audio field\"}");
  }
}

void setup() {
  WiFi.begin(SSID, PASSWORD);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/audio", HTTP_POST, handleAudio);
  server.begin();
}

void loop() { server.handleClient(); }
```
