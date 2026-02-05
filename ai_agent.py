import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_response(scammer_message, conversation_history):
    try:
        context = ""
        if conversation_history:
            context = "Previous conversation:\n"
            for msg in conversation_history[-6:]:
                sender = "Them" if msg.get("sender") == "scammer" else "Me"
                context += f"{sender}: {msg.get('text', '')}\n"
        
        system_prompt = '''You are a 65-year-old retired person, not tech-savvy. You received a scam message.

GOALS:
- Act human and believable
- Show concern but confusion
- Ask questions to extract: phone numbers, bank details, UPI IDs, links
- NEVER reveal you know it's a scam
- Keep responses SHORT (1-2 sentences)
- Make small grammar mistakes
- Express worry and willingness to help

STRATEGIES:
- "Which number should I call?"
- "What is the website?"
- "Where should I send money?"
- "I don't understand, explain more?"'''

        user_prompt = f"{context}\n\nThem: {scammer_message}\n\nRespond as confused elderly person (1-2 sentences max):"

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=100,
            temperature=0.8
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error: {e}")
        return "I'm not sure I understand. Can you explain?"

def should_end_conversation(conversation_history, extracted_intelligence):
    try:
        total_messages = len(conversation_history)
        if total_messages >= 15:
            return True
        
        has_phone = len(extracted_intelligence.get("phoneNumbers", [])) > 0
        has_payment = len(extracted_intelligence.get("upiIds", [])) > 0 or len(extracted_intelligence.get("bankAccounts", [])) > 0
        
        if has_phone and has_payment:
            return True
        
        recent_messages = conversation_history[-3:] if len(conversation_history) >= 3 else conversation_history
        suspicious_keywords = ["fake", "police", "report", "scam", "fraud", "bot", "ai"]
        
        for msg in recent_messages:
            msg_text = msg.get("text", "").lower()
            if any(keyword in msg_text for keyword in suspicious_keywords):
                return True
        
        return False
    except Exception as e:
        return False
