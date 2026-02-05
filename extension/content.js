// Scam Honeypot Guardian - Content Script
// Monitors messages on WhatsApp Web, Gmail, Facebook Messenger, etc.
// With AUTO-REPLY functionality to engage scammers

const SCAM_KEYWORDS = [
    'kyc', 'otp', 'verify', 'blocked', 'suspended', 'urgent', 'immediately',
    'prize', 'won', 'lottery', 'refund', 'bank account', 'upi', 'pin',
    'password', 'cvv', 'credit card', 'debit card', 'link expire',
    'click here', 'update now', 'verify now', 'account blocked', 'expire today'
];

let processedMessages = new Set();
let currentSource = detectSource();
let autoReplyEnabled = false;
let activeSessions = {}; // Track conversations with scammers

// Load auto-reply setting
chrome.storage.local.get(['autoReplyEnabled'], (result) => {
    autoReplyEnabled = result.autoReplyEnabled || false;
    console.log(`🍯 Auto-reply: ${autoReplyEnabled ? 'ENABLED' : 'DISABLED'}`);
});

// Listen for setting changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.autoReplyEnabled) {
        autoReplyEnabled = changes.autoReplyEnabled.newValue;
        console.log(`🍯 Auto-reply: ${autoReplyEnabled ? 'ENABLED' : 'DISABLED'}`);
    }
});

// Detect which platform we're on
function detectSource() {
    const hostname = window.location.hostname;
    if (hostname.includes('whatsapp')) return 'WhatsApp';
    if (hostname.includes('mail.google')) return 'Gmail';
    if (hostname.includes('facebook') || hostname.includes('messenger')) return 'Messenger';
    if (hostname.includes('telegram')) return 'Telegram';
    return 'Unknown';
}

// Quick local check if message might be suspicious
function quickScamCheck(text) {
    if (!text || text.length < 10) return false;
    
    const lowerText = text.toLowerCase();
    let keywordCount = 0;
    
    for (const keyword of SCAM_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            keywordCount++;
            if (keywordCount >= 2) return true;
        }
    }
    
    // Check for phone numbers or URLs with suspicious keywords
    const hasPhone = /\b[6-9]\d{9}\b/.test(text);
    const hasUrl = /https?:\/\/[^\s]+/.test(text);
    
    if (keywordCount >= 1 && (hasPhone || hasUrl)) return true;
    
    return false;
}

// Analyze message with background script
async function analyzeMessage(text, element, chatId = null) {
    const messageHash = hashString(text);
    if (processedMessages.has(messageHash)) return;
    processedMessages.add(messageHash);

    // Quick local check first
    if (!quickScamCheck(text)) return;

    // Generate or get session ID for this chat
    const sessionId = chatId || getCurrentChatId() || `session_${Date.now()}`;

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'analyzeMessage',
            text: text,
            source: currentSource,
            sessionId: sessionId
        });

        if (response && response.isScam) {
            highlightScamMessage(element, response);
            
            // AUTO-REPLY: If enabled, send the AI's response
            if (autoReplyEnabled && response.reply) {
                console.log(`🍯 Auto-replying to scammer...`);
                
                // Store session
                activeSessions[sessionId] = {
                    lastMessage: text,
                    lastReply: response.reply,
                    timestamp: Date.now()
                };
                
                // Wait a bit to seem human, then reply
                const delay = 2000 + Math.random() * 3000; // 2-5 seconds
                setTimeout(() => {
                    sendAutoReply(response.reply);
                }, delay);
            }
        }
    } catch (error) {
        console.error('Scam Honeypot: Analysis error', error);
    }
}

// Get current chat/conversation ID
function getCurrentChatId() {
    if (currentSource === 'WhatsApp') {
        // Try to get phone number or chat name from header
        const header = document.querySelector('header span[title]');
        if (header) return `whatsapp_${hashString(header.getAttribute('title'))}`;
    }
    if (currentSource === 'Messenger') {
        const url = window.location.href;
        const match = url.match(/\/t\/([\d]+)/);
        if (match) return `messenger_${match[1]}`;
    }
    return null;
}

// Send auto-reply based on platform
async function sendAutoReply(message) {
    try {
        switch (currentSource) {
            case 'WhatsApp':
                await sendWhatsAppMessage(message);
                break;
            case 'Messenger':
                await sendMessengerMessage(message);
                break;
            case 'Telegram':
                await sendTelegramMessage(message);
                break;
            default:
                console.log('🍯 Auto-reply not supported on this platform');
        }
    } catch (error) {
        console.error('🍯 Auto-reply failed:', error);
    }
}

// WhatsApp Web auto-reply
async function sendWhatsAppMessage(message) {
    // Find the message input
    const inputSelectors = [
        'div[contenteditable="true"][data-tab="10"]',
        'div.selectable-text[contenteditable="true"]',
        'footer div[contenteditable="true"]'
    ];
    
    let inputBox = null;
    for (const selector of inputSelectors) {
        inputBox = document.querySelector(selector);
        if (inputBox) break;
    }
    
    if (!inputBox) {
        console.error('🍯 WhatsApp input box not found');
        return;
    }
    
    // Focus and type message
    inputBox.focus();
    
    // Use execCommand for contenteditable
    document.execCommand('insertText', false, message);
    
    // Trigger input event
    inputBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
    
    // Wait for send button to appear
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Find and click send button
    const sendBtn = document.querySelector('button[aria-label="Send"], span[data-icon="send"]');
    if (sendBtn) {
        sendBtn.click();
        console.log('🍯 WhatsApp message sent!');
    } else {
        // Try pressing Enter
        inputBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
        console.log('🍯 WhatsApp message sent via Enter!');
    }
}

// Facebook Messenger auto-reply
async function sendMessengerMessage(message) {
    const inputSelectors = [
        'div[contenteditable="true"][role="textbox"]',
        'div[aria-label*="Message"][contenteditable="true"]'
    ];
    
    let inputBox = null;
    for (const selector of inputSelectors) {
        inputBox = document.querySelector(selector);
        if (inputBox) break;
    }
    
    if (!inputBox) {
        console.error('🍯 Messenger input box not found');
        return;
    }
    
    inputBox.focus();
    document.execCommand('insertText', false, message);
    inputBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Press Enter to send
    inputBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    console.log('🍯 Messenger message sent!');
}

// Telegram Web auto-reply
async function sendTelegramMessage(message) {
    const inputBox = document.querySelector('div.input-message-input[contenteditable="true"]');
    
    if (!inputBox) {
        console.error('🍯 Telegram input box not found');
        return;
    }
    
    inputBox.focus();
    document.execCommand('insertText', false, message);
    inputBox.dispatchEvent(new InputEvent('input', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const sendBtn = document.querySelector('button.send');
    if (sendBtn) {
        sendBtn.click();
        console.log('🍯 Telegram message sent!');
    }
}

// Simple hash function for deduplication
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// Highlight detected scam message
function highlightScamMessage(element, response) {
    if (!element || element.dataset.scamHighlighted) return;
    
    element.dataset.scamHighlighted = 'true';
    element.style.position = 'relative';
    
    // Add warning border
    element.style.border = '2px solid #dc2626';
    element.style.borderRadius = '8px';
    element.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
    
    // Create warning badge
    const badge = document.createElement('div');
    badge.className = 'scam-honeypot-badge';
    badge.innerHTML = `
        <div class="scam-badge-content">
            <span class="scam-badge-icon">🚨</span>
            <span class="scam-badge-text">SCAM DETECTED</span>
        </div>
        <div class="scam-badge-tooltip">
            <strong>⚠️ Warning:</strong> This message appears to be a scam attempt.
            <br><br>
            <strong>AI Response:</strong> ${response.reply || 'Do not share personal information.'}
            <br><br>
            <em>Powered by Scam Honeypot Guardian</em>
        </div>
    `;
    
    element.appendChild(badge);
}

// Platform-specific message selectors
const SELECTORS = {
    'WhatsApp': [
        'div.message-in span.selectable-text',
        'div._21Ahp span.selectable-text',
        'div.copyable-text span'
    ],
    'Gmail': [
        'div.a3s.aiL',
        'div.ii.gt div',
        'td.xY div'
    ],
    'Messenger': [
        'div[data-scope="messages_table"] span',
        'div[role="row"] span'
    ],
    'Telegram': [
        'div.message span.text-content',
        'div.text-content'
    ]
};

// Get selectors for current platform
function getSelectors() {
    return SELECTORS[currentSource] || ['p', 'span', 'div'];
}

// Scan page for messages
function scanMessages() {
    const selectors = getSelectors();
    
    selectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const text = el.innerText || el.textContent;
                if (text && text.length > 20 && text.length < 2000) {
                    analyzeMessage(text.trim(), el);
                }
            });
        } catch (e) {
            // Selector might not match - that's okay
        }
    });
}

// Observer for dynamic content
const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
            shouldScan = true;
        }
    });
    
    if (shouldScan) {
        // Debounce scanning
        clearTimeout(window.scamScanTimeout);
        window.scamScanTimeout = setTimeout(scanMessages, 500);
    }
});

// Start observing
function startObserver() {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Initial scan
    setTimeout(scanMessages, 2000);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
} else {
    startObserver();
}

console.log(`🍯 Scam Honeypot Guardian active on ${currentSource}`);
