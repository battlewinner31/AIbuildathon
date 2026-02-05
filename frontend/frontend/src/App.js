import React, { useState } from "react";
import axios from "axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";

// Backend API configuration
const API_URL = "http://127.0.0.1:8000";
const API_KEY = "hp_scam_2026_abc123xyz";

export default function App() {
    const [inputMessage, setInputMessage] = useState("");
    const [sessionId] = useState(() => `session_${Date.now()}`);
    const [liveMessages, setLiveMessages] = useState([]);
    const [conversation, setConversation] = useState([]);
    const [intelligence, setIntelligence] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [analytics, setAnalytics] = useState({
        total: 0,
        success: 0,
        breakdown: [
            { type: "SMS", count: 0 },
            { type: "Call", count: 0 }
        ]
    });

    // Send message to backend API
    const analyzeMessage = async () => {
        if (!inputMessage.trim()) return;

        setIsLoading(true);
        const timestamp = new Date().toISOString();

        // Add scammer message to conversation
        const newScammerMsg = { sender: "scammer", text: inputMessage };
        setConversation(prev => [...prev, newScammerMsg]);

        // Add to live messages
        setLiveMessages(prev => [{
            from: "Unknown Scammer",
            platform: "SMS",
            content: inputMessage,
            isSpam: true
        }, ...prev]);

        try {
            const response = await axios.post(
                `${API_URL}/analyze-message`,
                {
                    sessionId: sessionId,
                    message: {
                        sender: "scammer",
                        text: inputMessage,
                        timestamp: timestamp
                    },
                    conversationHistory: conversation.map(c => ({
                        sender: c.sender,
                        text: c.text,
                        timestamp: timestamp
                    })),
                    metadata: {
                        channel: "SMS",
                        language: "English",
                        locale: "IN"
                    }
                },
                {
                    headers: {
                        "X-API-Key": API_KEY,
                        "Content-Type": "application/json"
                    }
                }
            );

            // Add AI response to conversation
            if (response.data.reply) {
                const aiMsg = { sender: "ai", text: response.data.reply };
                setConversation(prev => [...prev, aiMsg]);
            }

            // Update analytics
            setAnalytics(prev => ({
                ...prev,
                total: prev.total + 1,
                success: Math.min(99, prev.success + 2),
                breakdown: [
                    { type: "SMS", count: prev.breakdown[0].count + 1 },
                    { type: "Call", count: prev.breakdown[1].count }
                ]
            }));

            // Extract intelligence from conversation
            extractIntelligence(inputMessage);

        } catch (error) {
            console.error("API Error:", error);
            setConversation(prev => [...prev, { 
                sender: "ai", 
                text: "I'm not sure I understand. Can you explain?" 
            }]);
        }

        setInputMessage("");
        setIsLoading(false);
    };

    // Simple client-side intelligence extraction (backend does this too)
    const extractIntelligence = (text) => {
        const phoneRegex = /\+91[-\s]?[6-9]\d{9}|\b[6-9]\d{9}\b/g;
        const urlRegex = /https?:\/\/[^\s]+/g;
        const keywords = ["kyc", "urgent", "blocked", "verify", "otp", "prize", "won", "bank", "account"];

        const phones = text.match(phoneRegex) || [];
        const links = text.match(urlRegex) || [];
        const foundKeywords = keywords.filter(kw => text.toLowerCase().includes(kw));

        setIntelligence(prev => ({
            "Phone Numbers": [...new Set([...(prev["Phone Numbers"] || []), ...phones])],
            "Phishing Links": [...new Set([...(prev["Phishing Links"] || []), ...links])],
            "Keywords": [...new Set([...(prev["Keywords"] || []), ...foundKeywords])]
        }));
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !isLoading) {
            analyzeMessage();
        }
    };

    return (
        <div style={styles.app}>
            <header style={styles.header}>
                <h1>🍯 Scam Honeypot Guardian</h1>
                <p>Real-Time AI Scam Detection & Intelligence Platform</p>
            </header>

            {/* MESSAGE INPUT */}
            <div style={styles.inputSection}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Simulate a scam message (e.g., 'Your KYC is blocked. Call 9876543210 immediately')"
                    style={styles.input}
                    disabled={isLoading}
                />
                <button
                    onClick={analyzeMessage}
                    style={styles.sendBtn}
                    disabled={isLoading}
                >
                    {isLoading ? "Analyzing..." : "Send to Honeypot"}
                </button>
            </div>

            <div style={styles.grid}>
                {/* LIVE FEED */}
                <section style={styles.card}>
                    <h2>📡 Live Incoming Communications</h2>
                    {liveMessages.map((msg, i) => (
                        <div
                            key={i}
                            style={{
                                ...styles.messageCard,
                                animation: "fadeSlide 0.4s ease-out"
                            }}
                        >
                            <div style={styles.messageHeader}>
                                <span>{msg.platform}</span>
                                <span>{msg.from}</span>
                            </div>
                            <p>{msg.content}</p>
                            {msg.isSpam && (
                                <span style={styles.spamBadge}>🚨 SPAM</span>
                            )}
                        </div>
                    ))}
                </section>

                {/* CHAT */}
                <section style={styles.card}>
                    <h2>🤖 AI Honeypot Conversation</h2>
                    <div style={styles.chatContainer}>
                        {conversation.map((c, i) => (
                            <div
                                key={i}
                                style={{
                                    ...styles.chatBubble,
                                    alignSelf:
                                        c.sender === "ai" ? "flex-end" : "flex-start",
                                    background:
                                        c.sender === "ai" ? "#2563eb" : "#7f1d1d",
                                    animation: "popIn 0.25s ease-out"
                                }}
                            >
                                {c.text}
                            </div>
                        ))}
                    </div>
                </section>

                {/* INTEL */}
                <section style={styles.card}>
                    <h2>🧠 Extracted Intelligence</h2>
                    {Object.entries(intelligence).map(([key, values]) => (
                        <div
                            key={key}
                            style={{
                                ...styles.intelBlock,
                                animation: "fadeIn 0.4s ease-in"
                            }}
                        >
                            <strong>{key}</strong>
                            <ul>
                                {values.map((v, i) => (
                                    <li key={i}>{v}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </section>

                {/* ANALYTICS */}
                <section style={styles.card}>
                    <h2>📊 Analytics</h2>
                    <p>Total Scams Detected: {analytics.total}</p>
                    <p>Success Rate: {analytics.success}%</p>

                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={analytics.breakdown}>
                            <XAxis dataKey="type" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" />
                        </BarChart>
                    </ResponsiveContainer>
                </section>
            </div>

            <button style={styles.reportBtn}>
                🚨 Report to Cyber Cell
            </button>

            {/* CSS ANIMATIONS */}
            <style>
                {`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes popIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
            </style>
        </div>
    );
}

/* 🎨 STYLES */
const styles = {
    app: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020617, #020617)",
        color: "#e5e7eb",
        padding: 24,
        fontFamily: "Inter, Arial, sans-serif"
    },
    inputSection: {
        display: "flex",
        gap: 12,
        marginBottom: 24,
        flexWrap: "wrap"
    },
    input: {
        flex: 1,
        minWidth: 300,
        padding: "14px 18px",
        fontSize: 16,
        borderRadius: 10,
        border: "1px solid #334155",
        background: "#1e293b",
        color: "#e5e7eb",
        outline: "none"
    },
    sendBtn: {
        padding: "14px 28px",
        fontSize: 16,
        borderRadius: 10,
        border: "none",
        background: "#2563eb",
        color: "white",
        cursor: "pointer",
        transition: "background 0.2s ease"
    },
    header: {
        marginBottom: 20
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 20
    },
    card: {
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: 16
    },
    messageCard: {
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: 12,
        marginTop: 10
    },
    messageHeader: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        color: "#94a3b8"
    },
    spamBadge: {
        marginTop: 6,
        display: "inline-block",
        background: "#dc2626",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12
    },
    chatContainer: {
        display: "flex",
        flexDirection: "column",
        maxHeight: 300,
        overflowY: "auto"
    },
    chatBubble: {
        marginTop: 8,
        padding: 10,
        borderRadius: 10,
        maxWidth: "75%"
    },
    intelBlock: {
        marginTop: 10
    },
    reportBtn: {
        marginTop: 30,
        width: "100%",
        padding: 16,
        background: "#dc2626",
        border: "none",
        borderRadius: 12,
        color: "white",
        fontSize: 18,
        cursor: "pointer"
    }
};

