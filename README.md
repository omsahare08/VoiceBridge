#  VoiceBridge – Speech Translator Chrome Extension

Real-time speech recognition and translation in your browser. Speak in any language, get it translated and read back in your chosen language — all in one click.

---

##  Features

- **One-click Recording** — Start/stop speech recognition with a single button
- **Auto Language Detection** — Automatically detects the language you're speaking using Unicode script matching (Arabic, Chinese, Japanese, Korean, Hindi, Russian, Greek, Hebrew, Thai, and more)
- **Manual Language Override** — Toggle off auto-detect to manually select your input language
- **80+ Languages** — Full language list for both input and output
- **Real-time Translation** — Translates as you speak using Google Translate (with MyMemory as fallback)
- **Text-to-Speech Output** — Hear the translation spoken in the target language
- **Live Waveform** — Animated visualizer while recording
- **Confidence Meter** — Shows how confident the speech recognizer is
- **Copy Buttons** — Copy input text or translation to clipboard instantly
- **Clear All** — Reset everything with one click
- **Preference Saving** — Remembers your chosen languages between sessions
- **Auto-restart Recording** — Continuous recording without re-clicking

---

## Installation

### Step 1 — Download & Unzip

Download the `speech-translator-extension.zip` file and unzip it to a folder on your computer.

### Step 2 — Open Chrome Extensions

Open Google Chrome and navigate to:
```
chrome://extensions
```

### Step 3 — Enable Developer Mode

In the top-right corner of the Extensions page, toggle **Developer Mode** ON.

### Step 4 — Load the Extension

Click **"Load unpacked"** and select the unzipped `speech-translator-extension` folder.

### Step 5 — Open the App

Click the **VoiceBridge icon** in your Chrome toolbar. The app will open as a full tab (this is required for microphone access).

---

##  Microphone Permission

Because Chrome extensions cannot access the microphone from a popup, VoiceBridge opens as a **full browser tab**. On first use, Chrome will ask for microphone permission — click **Allow**.

If you see a **"Microphone access denied"** message:

1. Look at the address bar and click the  **lock / info icon**
2. Find **Microphone** in the permissions list
3. Change it to **Allow**
4. Refresh the tab

---

##  How to Use

### Recording Speech

1. Select your **output language** from the dropdown in the Translated Output panel
2. Click the **Record** button — it turns red when active
3. Speak clearly into your microphone
4. Your speech appears in the Input Speech panel in real time
5. Translation appears automatically in the Translated Output panel
6. Click **Stop** when done

### Language Detection

- **Auto-detect is ON by default** — the extension detects your language automatically
- To override: click the **Auto-detect toggle** to turn it off, then select your language manually from the dropdown that appears
- The detected language label (e.g. `English`) shows in the Input Speech header

### Hearing the Translation

1. After a translation appears, click the **Speak** button
2. The translated text will be read aloud in the target language
3. Click **Stop** to stop playback at any time

> **Note:** Text-to-speech quality depends on what voices are installed on your system. The extension shows which voice it found (green) or warns you if no native voice is available for the selected language (orange). If no voice is found, it will fall back to reading the translation in English.

### Copying Text

- Click the **⧉** icon next to the Input Speech panel to copy the original text
- Click the **⧉** icon next to the Translated Output panel to copy the translation

---

##  Technical Details

| Component | Technology |
|---|---|
| Speech Recognition | Web Speech API (`webkitSpeechRecognition`) |
| Primary Translation | Google Translate (unofficial `gtx` client) |
| Fallback Translation | MyMemory Translation API |
| Text-to-Speech | Web Speech Synthesis API |
| Language Detection | Unicode script range pattern matching |
| Storage | `localStorage` for preferences |
| Extension Type | Chrome Manifest V3 |

### Translation APIs

VoiceBridge uses two free translation APIs with no API key required:

**Google Translate (primary)**
```
https://translate.googleapis.com/translate_a/single?client=gtx&...
```

**MyMemory (fallback)**
```
https://api.mymemory.translated.net/get?...
```

Both APIs require an internet connection. If both fail, the extension will display a warning message.

### Supported Languages (Sample)

Arabic, Bengali, Chinese (Simplified & Traditional), Czech, Danish, Dutch, English, Finnish, French, German, Greek, Gujarati, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Kannada, Korean, Malay, Malayalam, Marathi, Nepali, Norwegian, Persian, Polish, Portuguese, Punjabi, Romanian, Russian, Serbian, Sinhala, Slovak, Spanish, Swahili, Swedish, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Vietnamese, Welsh, and 40+ more.

---

## Known Limitations

- **Speech Recognition** only works in Chromium-based browsers (Chrome, Edge, Brave)
- **Text-to-speech** quality varies by language — some languages may not have a native voice installed on your system
- **Translation accuracy** depends on the free APIs; complex or technical text may not translate perfectly
- **Internet connection** is required for translation (speech recognition works offline in some cases)
- **Long texts** may be truncated by the free translation APIs (MyMemory has a ~500 character limit per request)

---

## Privacy

- Your speech is processed by the **browser's built-in speech recognition** (Google's servers for Chrome)
- Translations are sent to **Google Translate** or **MyMemory** APIs over HTTPS
- No data is stored on any server — preferences are saved only in your browser's `localStorage`
- No account, login, or API key is required

---

##  Troubleshooting

| Problem | Solution |
|---|---|
| Microphone denied | Click in address bar → Microphone → Allow → Refresh |
| Translation not working | Check internet connection; try reloading the tab |
| Speak button stuck | Click Stop, wait 2 seconds, then click Speak again |
| No voice for language | Install language packs in Windows/macOS settings |
| Speech not recognized | Speak clearly and check your microphone is not muted |
| Extension won't load | Make sure you selected the folder, not the zip file |

---

## File Structure

```
speech-translator-extension/
├── manifest.json       # Chrome extension config (Manifest V3)
├── background.js       # Service worker — opens app in new tab on icon click
├── popup.html          # Main UI layout and styles
├── popup.js            # All logic: recording, translation, TTS, UI
├── icons/
│   ├── icon16.png      # Toolbar icon (16×16)
│   ├── icon48.png      # Extensions page icon (48×48)
│   └── icon128.png     # Chrome Web Store icon (128×128)
└── README.md           # This file
```

---

## License

This extension is free to use for personal and educational purposes.

---

*Built with ❤️ using the Web Speech API, Google Translate, and Chrome Extension APIs.*
