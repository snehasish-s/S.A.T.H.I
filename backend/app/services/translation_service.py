import re

MEDICAL_TERMS_HI_EN = {
    "bukhar": "fever",
    "dard": "pain",
    "sir": "head",
    "pet": "stomach",
    "khasi": "cough",
    "sans": "breathing",
    "khansi": "cough",
    "ulti": "vomiting",
    "chakkar": "dizziness",
    "pasina": "sweating",
    "thakan": "fatigue",
    "khun": "blood",
    "chaati": "chest"
}

def detect_language(text: str) -> str:
    if not text:
        return 'en'
    # Check for Devanagari Unicode block
    if re.search(r'[\u0900-\u097F]', text):
        return 'hi'
    return 'en'

def translate_to_english(text: str, source_lang: str = 'auto') -> dict:
    if not text:
        return {"original": text, "translated": text, "source_language": "en", "method": "none"}
        
    detected = detect_language(text) if source_lang == 'auto' else source_lang
    
    translated_text = text
    method = "none"
    
    # Simple word substitution for hackathon if Hindi detected (or romanized Hindi words present)
    words = text.lower().split()
    translated_words = []
    
    translated_any = False
    for word in words:
        clean_word = re.sub(r'[^\w\s]', '', word)
        if clean_word in MEDICAL_TERMS_HI_EN:
            translated_words.append(MEDICAL_TERMS_HI_EN[clean_word])
            translated_any = True
            detected = 'hi' # Retroactive detection of romanized Hindi
        else:
            translated_words.append(word)
            
    if translated_any or detected == 'hi':
        translated_text = " ".join(translated_words)
        method = "dictionary_substitution"
        
    return {
        "original": text,
        "translated": translated_text,
        "source_language": detected,
        "method": method
    }
