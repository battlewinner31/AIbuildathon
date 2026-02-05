import sqlite3
import json
from datetime import datetime

DB_NAME = "honeypot.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS sessions
                 (session_id TEXT PRIMARY KEY,
                  created_at TEXT,
                  scam_detected INTEGER,
                  total_messages INTEGER,
                  intelligence TEXT,
                  agent_notes TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  session_id TEXT,
                  sender TEXT,
                  text TEXT,
                  timestamp TEXT)''')
    conn.commit()
    conn.close()
    print("Database initialized successfully")

def save_message(session_id, sender, text, timestamp):
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("INSERT INTO messages VALUES (NULL, ?, ?, ?, ?)",
                  (session_id, sender, text, timestamp))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

def get_conversation(session_id):
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT sender, text, timestamp FROM messages WHERE session_id = ?",
                  (session_id,))
        messages = c.fetchall()
        conn.close()
        return [{"sender": m[0], "text": m[1], "timestamp": m[2]} for m in messages]
    except Exception as e:
        return []

def update_session(session_id, scam_detected, total_messages, intelligence, agent_notes):
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT session_id FROM sessions WHERE session_id = ?", (session_id,))
        exists = c.fetchone()
        intelligence_json = json.dumps(intelligence)
        if exists:
            c.execute("UPDATE sessions SET scam_detected=?, total_messages=?, intelligence=?, agent_notes=? WHERE session_id=?",
                     (int(scam_detected), total_messages, intelligence_json, agent_notes, session_id))
        else:
            c.execute("INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?)",
                     (session_id, datetime.now().isoformat(), int(scam_detected), 
                      total_messages, intelligence_json, agent_notes))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

def get_all_sessions():
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT * FROM sessions")
        sessions = c.fetchall()
        conn.close()
        return [{"session_id": s[0], "created_at": s[1], "scam_detected": bool(s[2]),
                 "total_messages": s[3], "intelligence": json.loads(s[4]) if s[4] else {},
                 "agent_notes": s[5]} for s in sessions]
    except Exception as e:
        return []
