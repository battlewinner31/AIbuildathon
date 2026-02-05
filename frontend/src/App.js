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
    const [loaded, setLoaded] = useState(false);
    const [conversation, setConversation] = useState([]);
    const [intel, setIntel] = useState({});
    const [stats, setStats] = useState(null);

    useEffect(() => {
        setTimeout(() => {
            setConversation([
                { sender: "scammer", text: "Your KYC is expired" },
                { sender: "ai", text: "Which bank is this regarding?" },
                { sender: "scammer", text: "SBI" },
                { sender: "ai", text: "Please confirm branch location" }
            ]);

            setIntel({
                "Phone Number": ["+91 98765 43210"],
                "Phishing Link": ["http://fake-kyc.com"],
                "Keywords": ["KYC", "Urgent", "Verify"]
            });

            setStats({
                total: 24,
                success: 92,
                breakdown: [
                    { type: "SMS", count: 14 },
                    { type: "Call", count: 10 }
                ]
            });

            setLoaded(true);
        }, 1200);
    }, []);

    return (
        <div style={styles.page}>
            {/* HERO */}
            <section style={styles.hero}>
                <h1>🍯 Scam Honeypot Guardian</h1>
                <p>
                    A consumer-first AI app that detects scams in real time,
                    safely engages attackers, and protects your identity.
                </p>
            </section>

            {/* LIVE ALERT */}
            <FadeIn>
                <section style={styles.section}>
                    <h2>🚨 Live Scam Alert</h2>
                    <div style={styles.alertCard}>
                        <div style={styles.alertHeader}>
                            <span>SMS</span>
                            <span>+91 98765 43210</span>
                        </div>
                        <p>Your KYC will be blocked today. Verify immediately.</p>
                        <span style={styles.spamBadge}>Spam Detected</span>
                    </div>
                </section>
            </FadeIn>

            {/* CHAT */}
            <FadeIn delay={0.1}>
                <section style={styles.section}>
                    <h2>🤖 AI Conversation</h2>
                    <div style={styles.chat}>
                        {conversation.map((c, i) => (
                            <div
                                key={i}
                                style={{
                                    ...styles.bubble,
                                    alignSelf:
                                        c.sender === "ai" ? "flex-end" : "flex-start",
                                    background:
                                        c.sender === "ai"
                                            ? "linear-gradient(135deg,#3b82f6,#22d3ee)"
                                            : "#e5e7eb",
                                    color: c.sender === "ai" ? "white" : "#0f172a",
                                    animation: `slideUp .3s ease ${i * 0.08}s both`
                                }}
                            >
                                {c.text}
                            </div>
                        ))}
                    </div>
                </section>
            </FadeIn>

            {/* INTELLIGENCE */}
            <FadeIn delay={0.2}>
                <section style={styles.section}>
                    <h2>🧠 Extracted Intelligence</h2>
                    <div style={styles.intelGrid}>
                        {Object.entries(intel).map(([k, v]) => (
                            <div key={k} style={styles.intelCard}>
                                <strong>{k}</strong>
                                <ul>
                                    {v.map((x, i) => (
                                        <li key={i}>{x}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>
            </FadeIn>

            {/* ANALYTICS */}
            {stats && (
                <FadeIn delay={0.3}>
                    <section style={styles.section}>
                        <h2>📊 Insights</h2>
                        <div style={styles.stats}>
                            <div>
                                <strong>{stats.total}</strong>
                                <span>Total Scams</span>
                            </div>
                            <div>
                                <strong>{stats.success}%</strong>
                                <span>Success Rate</span>
                            </div>
                        </div>

                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={stats.breakdown}>
                                <XAxis dataKey="type" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" />
                            </BarChart>
                        </ResponsiveContainer>
                    </section>
                </FadeIn>
            )}

            {/* CTA */}
            <section style={styles.cta}>
                <button style={styles.ctaBtn}>
                    🚨 Report to Cyber Cell
                </button>
            </section>

            <style>{animations}</style>
        </div>
    );
}

/* FADE WRAPPER */
function FadeIn({ children, delay = 0 }) {
    return (
        <div style={{ animation: `fadeUp .6s ease ${delay}s both` }}>
            {children}
        </div>
    );
}

/* ANIMATIONS */
const animations = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

/* STYLES */
const styles = {
    page: {
        background:
            "linear-gradient(180deg,#f8fafc,#eef2ff)",
        color: "#0f172a",
        fontFamily: "Inter, system-ui, sans-serif"
    },
    hero: {
        padding: "90px 24px",
        maxWidth: 900,
        margin: "0 auto",
        textAlign: "center"
    },
    section: {
        maxWidth: 1000,
        margin: "80px auto",
        padding: "0 24px"
    },
    alertCard: {
        background: "white",
        padding: 24,
        borderRadius: 20,
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)"
    },
    alertHeader: {
        display: "flex",
        justifyContent: "space-between",
        color: "#64748b",
        fontSize: 14
    },
    spamBadge: {
        marginTop: 12,
        display: "inline-block",
        color: "#dc2626",
        fontWeight: 600
    },
    chat: {
        display: "flex",
        flexDirection: "column",
        gap: 12
    },
    bubble: {
        padding: "14px 18px",
        borderRadius: 20,
        maxWidth: "70%"
    },
    intelGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
        gap: 24
    },
    intelCard: {
        background: "white",
        padding: 20,
        borderRadius: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        transition: "transform .2s ease",
        cursor: "default"
    },
    stats: {
        display: "flex",
        gap: 40,
        marginBottom: 20
    },
    cta: {
        padding: "100px 24px",
        textAlign: "center"
    },
    ctaBtn: {
        padding: "20px 42px",
        fontSize: 20,
        borderRadius: 999,
        border: "none",
        background:
            "linear-gradient(135deg,#ef4444,#f87171)",
        color: "white",
        cursor: "pointer",
        transition: "transform .2s ease"
    }
};





