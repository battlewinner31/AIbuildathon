// Scam Honeypot Guardian - Popup Script

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    setupTabs();
    setupClearButton();
    setupAutoReplyToggle();
});

// Load stats from background script
async function loadStats() {
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getStats' });
        updateUI(response);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Update UI with data
function updateUI(data) {
    // Update stats
    document.getElementById('totalScams').textContent = data.totalScams || 0;
    
    const intelCount = (data.intelligence?.phoneNumbers?.length || 0) +
                       (data.intelligence?.phishingLinks?.length || 0) +
                       (data.intelligence?.upiIds?.length || 0);
    document.getElementById('intelCount').textContent = intelCount;

    // Update alerts list
    const alertsList = document.getElementById('alertsList');
    if (data.recentAlerts && data.recentAlerts.length > 0) {
        alertsList.innerHTML = data.recentAlerts.map(alert => `
            <div class="alert-item">
                <div class="alert-source">📍 ${alert.source}</div>
                <div class="alert-text">${escapeHtml(alert.text)}</div>
                <div class="alert-time">${formatTime(alert.timestamp)}</div>
            </div>
        `).join('');
    } else {
        alertsList.innerHTML = '<div class="empty-state">No scams detected yet. Stay safe!</div>';
    }

    // Update phone numbers
    const phonesList = document.getElementById('phonesList');
    if (data.intelligence?.phoneNumbers?.length > 0) {
        phonesList.innerHTML = data.intelligence.phoneNumbers.map(phone => 
            `<li>📞 ${phone}</li>`
        ).join('');
    } else {
        phonesList.innerHTML = '<li class="empty-state">None captured yet</li>';
    }

    // Update phishing links
    const linksList = document.getElementById('linksList');
    if (data.intelligence?.phishingLinks?.length > 0) {
        linksList.innerHTML = data.intelligence.phishingLinks.map(link => 
            `<li>🔗 ${escapeHtml(link)}</li>`
        ).join('');
    } else {
        linksList.innerHTML = '<li class="empty-state">None captured yet</li>';
    }

    // Update UPI IDs
    const upiList = document.getElementById('upiList');
    if (data.intelligence?.upiIds?.length > 0) {
        upiList.innerHTML = data.intelligence.upiIds.map(upi => 
            `<li>💳 ${escapeHtml(upi)}</li>`
        ).join('');
    } else {
        upiList.innerHTML = '<li class="empty-state">None captured yet</li>';
    }
}

// Setup tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Setup clear button
function setupClearButton() {
    document.getElementById('clearBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all scam data?')) {
            try {
                await chrome.runtime.sendMessage({ action: 'clearData' });
                loadStats();
            } catch (error) {
                console.error('Error clearing data:', error);
            }
        }
    });
}

// Setup auto-reply toggle
function setupAutoReplyToggle() {
    const toggle = document.getElementById('autoReplyToggle');
    const warning = document.getElementById('autoReplyWarning');
    
    // Load current setting
    chrome.storage.local.get(['autoReplyEnabled'], (result) => {
        toggle.checked = result.autoReplyEnabled || false;
        warning.style.display = toggle.checked ? 'block' : 'none';
    });
    
    // Handle toggle change
    toggle.addEventListener('change', () => {
        const enabled = toggle.checked;
        chrome.storage.local.set({ autoReplyEnabled: enabled });
        warning.style.display = enabled ? 'block' : 'none';
        
        // Show confirmation
        if (enabled) {
            showNotification('🤖 Auto-Reply ENABLED - AI will engage scammers automatically');
        } else {
            showNotification('🚫 Auto-Reply DISABLED');
        }
    });
}

// Show temporary notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e293b;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 12px;
        z-index: 1000;
        animation: fadeInOut 2s ease-in-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 2000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format timestamp
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Refresh data every 5 seconds
setInterval(loadStats, 5000);
