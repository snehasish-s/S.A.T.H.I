import re
import io
from PIL import Image

try:
    import pytesseract
except ImportError:
    pytesseract = None

def extract_text(image_bytes: bytes) -> str:
    if pytesseract is None:
        return "Error: pytesseract not installed."
    try:
        image = Image.open(io.BytesIO(image_bytes))
        return pytesseract.image_to_string(image)
    except Exception as e:
        return f"OCR extraction failed: {e}"

def parse_lab_values(text: str) -> dict:
    values = {}
    
    spo2_match = re.search(r'(?i)(spo2|oxygen\s*saturation)[\s\:\=]*(\d{2,3})', text)
    if spo2_match:
        values['spo2_percent'] = float(spo2_match.group(2))
        
    bp_match = re.search(r'(?i)(bp|blood\s*pressure)[\s\:\=]*(\d{2,3})\s*\/\s*(\d{2,3})', text)
    if bp_match:
        values['bp_systolic'] = float(bp_match.group(2))
        values['bp_diastolic'] = float(bp_match.group(3))
        
    hb_match = re.search(r'(?i)(hb|hemoglobin)[\s\:\=]*(\d{1,2}(?:\.\d{1,2})?)', text)
    if hb_match:
        values['hemoglobin'] = float(hb_match.group(2))
        
    wbc_match = re.search(r'(?i)(wbc|white\s*blood\s*cell)[\s\:\=]*(\d{1,3}(?:\.\d{1,2})?)', text)
    if wbc_match:
        values['wbc_count'] = float(wbc_match.group(2))
        
    temp_match = re.search(r'(?i)(temp|temperature)[\s\:\=]*(\d{2,3}(?:\.\d{1,2})?)', text)
    if temp_match:
        values['temperature'] = float(temp_match.group(2))
        
    sugar_match = re.search(r'(?i)(glucose|sugar|fbs|rbs)[\s\:\=]*(\d{2,3}(?:\.\d{1,2})?)', text)
    if sugar_match:
        values['blood_sugar'] = float(sugar_match.group(2))
        
    return values

def process_report(image_bytes: bytes) -> dict:
    raw_text = extract_text(image_bytes)
    parsed_values = parse_lab_values(raw_text)
    
    confidence = "high" if parsed_values else "low"
    if "Error" in raw_text or "failed" in raw_text:
        confidence = "none"
        
    return {
        "raw_text": raw_text,
        "parsed_values": parsed_values,
        "extraction_confidence": confidence
    }
