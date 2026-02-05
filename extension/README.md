# 🍯 Scam Honeypot Guardian - Browser Extension

Real-time AI-powered scam detection and protection for WhatsApp Web, Gmail, Facebook Messenger, and Telegram.

## Features

- **Real-time Monitoring**: Automatically scans messages on supported platforms
- **AI-Powered Detection**: Uses GPT-4 to identify scam patterns
- **Intelligence Extraction**: Captures phone numbers, phishing links, and UPI IDs
- **Visual Warnings**: Highlights scam messages with warning badges
- **Desktop Notifications**: Alerts you when scams are detected
- **Right-click Analysis**: Manually analyze any selected text

## Installation

### Step 1: Generate Icons
1. Open `icons/generate-icons.html` in Chrome
2. Right-click each canvas and "Save image as..."
3. Save as `icon16.png`, `icon48.png`, `icon128.png` in the `icons` folder

### Step 2: Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension` folder

### Step 3: Start Backend Server
Make sure the backend API is running:
```bash
cd ../
python -m uvicorn main:app --reload
```

## Supported Platforms

- WhatsApp Web (web.whatsapp.com)
- Gmail (mail.google.com)
- Facebook Messenger (messenger.com)
- Telegram Web (web.telegram.org)

## Usage

1. **Automatic Detection**: Visit any supported platform - the extension monitors messages automatically
2. **Manual Analysis**: Select any suspicious text, right-click, and choose "🍯 Analyze for Scam"
3. **View Dashboard**: Click the extension icon to see detected scams and extracted intelligence

## Configuration

Edit `background.js` to change:
- `API_URL`: Backend server URL (default: `http://127.0.0.1:8000`)
- `API_KEY`: API authentication key

## How It Works

1. Content script monitors messages on supported platforms
2. Suspicious messages are sent to the background service worker
3. Background worker calls the FastAPI backend for AI analysis
4. If scam detected, the message is highlighted and a notification is shown
5. Intelligence (phone numbers, links, UPI IDs) is extracted and stored
