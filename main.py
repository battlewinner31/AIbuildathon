from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from datetime import datetime

from scam_detector import detect_scam
from ai_agent import generate_response, should_end_conversation
from intelligence_extractor import extract_intelligence
from database import save_message, get_conversation, update_session
from guvi_callback import send_to_guvi

load_dotenv()

app = FastAPI(title="Scam Honeypot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

YOUR_API_KEY = os.getenv("API_KEY", "hp_scam_2026_abc123xyz")

class Message(BaseModel):
    sender: str
    text: str
    timestamp: str

class Metadata(BaseModel):
    channel: Optional[str] = "SMS"
    language: Optional[str] = "English"
    locale: Optional[str] = "IN"

class ScamMessageRequest(BaseModel):
    sessionId: str
    message: Message
    conversationHistory: List[Message] = []
    metadata: Optional[Metadata] = None

class ScamResponse(BaseModel):
    status: str
    reply: str

def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != YOUR_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

@app.get("/")
async def root():
    return {"status": "Honeypot API is running"}

@app.post("/analyze-message", response_model=ScamResponse)
async def analyze_message(request: ScamMessageRequest, x_api_key: str = Header(None)):
    verify_api_key(x_api_key)
    
    try:
        save_message(request.sessionId, request.message.sender, request.message.text, request.message.timestamp)
        scam_analysis = detect_scam(request.message.text)
        
        if not scam_analysis["is_scam"]:
            reply = "I'm sorry, I don't understand."
            save_message(request.sessionId, "user", reply, datetime.now().isoformat())
            return ScamResponse(status="success", reply=reply)
        
        agent_reply = generate_response(request.message.text, request.conversationHistory)
        save_message(request.sessionId, "user", agent_reply, datetime.now().isoformat())
        
        full_conversation = get_conversation(request.sessionId)
        intelligence = extract_intelligence(full_conversation)
        
        if should_end_conversation(full_conversation, intelligence):
            total_messages = len(full_conversation)
            agent_notes = f"Scam: {scam_analysis['scam_type']}. Confidence: {scam_analysis['confidence']}."
            update_session(request.sessionId, True, total_messages, intelligence, agent_notes)
            guvi_result = send_to_guvi(request.sessionId, True, total_messages, intelligence, agent_notes)
            print(f"Ended session {request.sessionId}. GUVI: {guvi_result}")
        
        return ScamResponse(status="success", reply=agent_reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
