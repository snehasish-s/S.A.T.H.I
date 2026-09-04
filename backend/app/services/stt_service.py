import os
import tempfile

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

def transcribe(audio_bytes: bytes, audio_format: str = 'wav') -> dict:
    if WhisperModel is None:
        return {
            "text": "Fallback: faster-whisper not installed.",
            "language": "en",
            "segments": []
        }
        
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio_format}")
    try:
        temp_file.write(audio_bytes)
        temp_file.close()
        
        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        segments_gen, info = model.transcribe(temp_file.name)
        
        segments = list(segments_gen)
        text = " ".join([seg.text for seg in segments])
        
        return {
            "text": text.strip(),
            "language": info.language,
            "segments": [{"start": s.start, "end": s.end, "text": s.text} for s in segments]
        }
    except Exception as e:
        return {
            "text": f"Transcription failed: {str(e)}",
            "language": "unknown",
            "segments": []
        }
    finally:
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)
