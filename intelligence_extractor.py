import re

def extract_intelligence(conversation_history):
    all_text = " ".join([msg.get("text", "") for msg in conversation_history])
    
    intelligence = {
        "phoneNumbers": [],
        "upiIds": [],
        "bankAccounts": [],
        "phishingLinks": [],
        "emailAddresses": [],
        "suspiciousKeywords": []
    }
    
    phone_patterns = [r'\+91[-\s]?[6-9]\d{9}', r'\b[6-9]\d{9}\b', r'\b0[6-9]\d{9}\b']
    for pattern in phone_patterns:
        phones = re.findall(pattern, all_text)
        intelligence["phoneNumbers"].extend(phones)
    intelligence["phoneNumbers"] = list(set([p.replace(" ", "").replace("-", "") for p in intelligence["phoneNumbers"]]))
    
    upi_pattern = r'\b[\w\.-]+@[\w\.-]+\b'
    upis = re.findall(upi_pattern, all_text)
    upi_providers = ['paytm', 'phonepe', 'googlepay', 'amazonpay', 'bhim', 'ybl', 'okaxis', 'oksbi', 'okhdfcbank', 'okicici']
    intelligence["upiIds"] = [upi for upi in upis if any(provider in upi.lower() for provider in upi_providers)]
    
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, all_text)
    intelligence["emailAddresses"] = list(set(emails))
    
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    urls = re.findall(url_pattern, all_text)
    intelligence["phishingLinks"] = list(set(urls))
    
    bank_pattern = r'\b\d{9,18}\b'
    accounts = re.findall(bank_pattern, all_text)
    intelligence["bankAccounts"] = [acc for acc in accounts if len(acc) >= 11]
    intelligence["bankAccounts"] = list(set(intelligence["bankAccounts"]))
    
    keywords = ["urgent", "immediately", "verify", "blocked", "suspended", "prize", "won", "lottery", "refund", "otp", "pin", "password", "cvv", "bank account", "upi", "kyc"]
    found_keywords = [kw for kw in keywords if kw.lower() in all_text.lower()]
    intelligence["suspiciousKeywords"] = list(set(found_keywords))
    
    return intelligence
