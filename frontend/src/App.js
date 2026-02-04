import React, { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from "recharts";

export default function App() {
    const [liveMessages, setLiveMessages] = useState([]);
    const [conversation, setConversation] = useState([]);
    const [intelligence, setIntelligence] = useState({});
    const [analytics, setAnalytics] = useState({
        total: 0,
        success: 0,
        breakdown: []
    });

    // 🔁 FAKE REAL-TIME STREAM (DEMO)
    useEffect(() => {
        const fakeMessages = [
            {
                from: "+91 98765 43210",
                platform: "SMS",
                content: "Your KYC is blocked. Click link immediately",
                isSpam: true,
                conversation: [
                    { sender: "scammer", text: "Your account will be blocked today" },
                    { sender: "ai", text: "Which bank is this related to?" },
                    { sender: "scammer", text: "SBI" },
                    { sender: "ai", text: "Please confirm branch location" }
                ],
                intelligence: {
                    "Phone Numbers": ["+91 98765 43210"],
                    "Phishing Links": ["http://fake-kyc-link.com"],
                    "Keywords": ["KYC", "Urgent", "Blocked"]
                },
                analytics: {
                    total: 21,
                    success: 91,
                    breakdown: [
                        { type: "SMS", count: 13 },
                        { type: "Call", count: 8 }
                    ]
                }
            }
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < fakeMessages.length) {
                const msg = fakeMessages[index];
                setLiveMessages(prev => [msg, ...prev]);
                setConversation(msg.conversation);
                setIntelligence(msg.intelligence);
                setAnalytics(msg.analytics);
                index++;
            }
        }, 3500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={styles.app}>
            <header style={styles.header}>
                <h1>🍯 Scam Honeypot Guardian</h1>
                <p>Real-Time AI Scam Detection & Intelligence Platform</p>
            </header>

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
    header: {
        marginBottom: 30
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 20
    },
    card: {
        background: "#020617",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: 16,
        transition: "transform 0.2s ease, box-shadow 0.2s ease"
    },
    messageCard: {
        background: "#020617",
        border: "1px solid #1e293b",
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
        fontSize: 12,
        animation: "pulse 1.5s infinite"
    },
    chatContainer: {
        display: "flex",
        flexDirection: "column"
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
        cursor: "pointer",
        transition: "transform 0.2s ease"
    }
};



