import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def detect_scam(message_text):
    try:
        prompt = f'''Analyze if this is a scam: "{message_text}"

Check for: OTP, credit card, prize, urgent, account blocked, verify, UPI, PIN, password, lottery, refund, KYC

Respond EXACTLY:
IS_SCAM: yes/no
CONFIDENCE: 0.0-1.0
SCAM_TYPE: phishing/financial/prize/technical_support/other
REASONING: one sentence'''

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a scam detection expert."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.3
        )
        
        response_text = response.choices[0].message.content
        lines = response_text.strip().split('\n')
        is_scam = False
        confidence = 0.5
        scam_type = "unknown"
        reasoning = ""
        
        for line in lines:
            if "IS_SCAM:" in line:
                is_scam = "yes" in line.lower()
            elif "CONFIDENCE:" in line:
                try:
                    confidence = float(line.split("CONFIDENCE:")[1].strip())
                except:
                    confidence = 0.5
            elif "SCAM_TYPE:" in line:
                scam_type = line.split("SCAM_TYPE:")[1].strip().lower()
            elif "REASONING:" in line:
                reasoning = line.split("REASONING:")[1].strip()
        
        return {
            "is_scam": is_scam,
            "confidence": confidence,
            "scam_type": scam_type,
            "reasoning": reasoning
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"is_scam": True, "confidence": 0.5, "scam_type": "unknown", "reasoning": str(e)}
