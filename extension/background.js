// Scam Honeypot Guardian - Background Service Worker
const API_URL = "http://127.0.0.1:8000";
const API_KEY = "hp_scam_2026_abc123xyz";

// Store detected scams and intelligence
let scamData = {
    sessions: {},
    totalScams: 0,
    intelligence: {
        phoneNumbers: [],
        phishingLinks: [],
        upiIds: [],
        keywords: []
    },
    recentAlerts: []
};

// Load saved data on startup
chrome.storage.local.get(['scamData'], (result) => {
    if (result.scamData) {
        scamData = result.scamData;
    }
});

// Save data periodically
function saveData() {
    chrome.storage.local.set({ scamData });
}

// Generate session ID
function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Analyze message with backend API
async function analyzeMessage(text, source, sessionId = null) {
    if (!sessionId) {
        sessionId = generateSessionId();
    }

    const timestamp = new Date().toISOString();
    
    // Initialize session if new
    if (!scamData.sessions[sessionId]) {
        scamData.sessions[sessionId] = {
            messages: [],
            source: source,
            startTime: timestamp
        };
    }

    try {
        const response = await fetch(`${API_URL}/analyze-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({
                sessionId: sessionId,
                message: {
                    sender: "scammer",
                    text: text,
                    timestamp: timestamp
                },
                conversationHistory: scamData.sessions[sessionId].messages,
                metadata: {
                    channel: source,
                    language: "English",
                    locale: "IN"
                }
            })
        });

        const data = await response.json();
        
        // Store message and response
        scamData.sessions[sessionId].messages.push(
            { sender: "scammer", text: text, timestamp: timestamp },
            { sender: "ai", text: data.reply, timestamp: new Date().toISOString() }
        );

        // Extract intelligence from message
        extractIntelligence(text);

        // Update stats
        scamData.totalScams++;
        
        // Add to recent alerts
        scamData.recentAlerts.unshift({
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            source: source,
            timestamp: timestamp,
            aiResponse: data.reply
        });
        
        // Keep only last 50 alerts
        if (scamData.recentAlerts.length > 50) {
            scamData.recentAlerts = scamData.recentAlerts.slice(0, 50);
        }

        saveData();

        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: '🚨 Scam Detected!',
            message: `Suspicious message from ${source}: "${text.substring(0, 50)}..."`,
            priority: 2
        });

        return {
            isScam: true,
            reply: data.reply,
            sessionId: sessionId
        };

    } catch (error) {
        console.error('API Error:', error);
        
        // Fallback: local detection
        const localResult = localScamDetection(text);
        if (localResult.isScam) {
            extractIntelligence(text);
            scamData.totalScams++;
            saveData();
        }
        
        return localResult;
    }
}

// Local scam detection (fallback when API is unavailable)
function localScamDetection(text) {
    const scamKeywords = [
        'kyc', 'otp', 'verify', 'blocked', 'suspended', 'urgent', 'immediately',
        'prize', 'won', 'lottery', 'refund', 'bank account', 'upi', 'pin',
        'password', 'cvv', 'credit card', 'debit card', 'link expire',
        'click here', 'update now', 'verify now', 'account blocked'
    ];
    
    const lowerText = text.toLowerCase();
    const foundKeywords = scamKeywords.filter(kw => lowerText.includes(kw));
    
    const isScam = foundKeywords.length >= 2 || 
        (foundKeywords.length >= 1 && (
            lowerText.includes('http') || 
            /\b[6-9]\d{9}\b/.test(text)
        ));

    return {
        isScam: isScam,
        confidence: foundKeywords.length / 5,
        keywords: foundKeywords,
        reply: isScam ? "⚠️ This message appears suspicious. Do not share personal information." : null
    };
}

// Extract intelligence from text
function extractIntelligence(text) {
    // Phone numbers (Indian format)
    const phoneRegex = /\+91[-\s]?[6-9]\d{9}|\b[6-9]\d{9}\b/g;
    const phones = text.match(phoneRegex) || [];
    phones.forEach(p => {
        const cleaned = p.replace(/[-\s]/g, '');
        if (!scamData.intelligence.phoneNumbers.includes(cleaned)) {
            scamData.intelligence.phoneNumbers.push(cleaned);
        }
    });

    // URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    urls.forEach(url => {
        if (!scamData.intelligence.phishingLinks.includes(url)) {
            scamData.intelligence.phishingLinks.push(url);
        }
    });

    // UPI IDs
    const upiRegex = /[\w.-]+@(paytm|phonepe|googlepay|ybl|okaxis|oksbi|okhdfcbank|okicici|upi)/gi;
    const upis = text.match(upiRegex) || [];
    upis.forEach(upi => {
        if (!scamData.intelligence.upiIds.includes(upi)) {
            scamData.intelligence.upiIds.push(upi);
        }
    });

    // Keywords
    const keywords = ['kyc', 'otp', 'verify', 'blocked', 'urgent', 'prize', 'won', 'bank', 'account'];
    keywords.forEach(kw => {
        if (text.toLowerCase().includes(kw) && !scamData.intelligence.keywords.includes(kw)) {
            scamData.intelligence.keywords.push(kw);
        }
    });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeMessage') {
        analyzeMessage(request.text, request.source, request.sessionId)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Keep channel open for async response
    }
    
    if (request.action === 'getStats') {
        sendResponse({
            totalScams: scamData.totalScams,
            intelligence: scamData.intelligence,
            recentAlerts: scamData.recentAlerts.slice(0, 10)
        });
        return true;
    }
    
    if (request.action === 'clearData') {
        scamData = {
            sessions: {},
            totalScams: 0,
            intelligence: {
                phoneNumbers: [],
                phishingLinks: [],
                upiIds: [],
                keywords: []
            },
            recentAlerts: []
        };
        saveData();
        sendResponse({ success: true });
        return true;
    }
});

// Context menu for manual text analysis
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "analyzeSelection",
        title: "🍯 Analyze for Scam",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "analyzeSelection" && info.selectionText) {
        analyzeMessage(info.selectionText, "Manual Selection");
    }
});

console.log("🍯 Scam Honeypot Guardian - Background Service Started");
