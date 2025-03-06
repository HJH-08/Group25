import os
import sounddevice as sd
import torch
import torchaudio
import logging
from TTS.api import TTS
import io

# Reduce logging noise
logging.getLogger("TTS").setLevel(logging.ERROR)

# Load a multi-speaker, multi-lingual TTS model
tts_model = TTS("tts_models/en/vctk/vits", progress_bar=False).to("cpu")

# Speaker ID mapping for gender (update based on model's available speakers)
voice_mapping = {
    "male": "p229",
    "female": "p240"
}

def speak_text(text, gender="male"):
    """
    Converts text to speech using Coqui TTS and plays the generated audio.
    
    Args:
        text (str): The text to synthesize.
        gender (str): The voice gender ('male' or 'female').
    """
    if not text.strip():
        return
    
    # Select speaker ID based on gender
    speaker = voice_mapping.get(gender, "p240")  # Default to female

    # Generate speech (returns NumPy array)
    audio_data = tts_model.tts(text=text, speaker=speaker)

    # Convert to tensor and play with torchaudio
    sample_rate = 22050
    audio_tensor = torch.tensor(audio_data).unsqueeze(0)  # Add batch dimension
    torchaudio.save("temp_audio.wav", audio_tensor, sample_rate)

    # Load and play using sounddevice
    waveform, sr = torchaudio.load("temp_audio.wav")
    sd.play(waveform.numpy().T, sr)
    sd.wait()

    # Clean up temp file
    os.remove("temp_audio.wav")

def speak_text_to_bytes(text, gender="male"):
    """
    Convert text to speech and return audio bytes.
    
    Args:
        text (str): The text to synthesize.
        gender (str): The voice gender ('male' or 'female').

    Returns:
        bytes: The generated audio in WAV format.
    """
    if not text.strip():
        return bytes()

    # Select speaker ID based on gender
    speaker = voice_mapping.get(gender, "p240")  # Default to female

    # Generate speech (returns NumPy array)
    audio_data = tts_model.tts(text=text, speaker=speaker)

    # Convert to bytes in WAV format
    buffer = io.BytesIO()
    sample_rate = 22050
    audio_tensor = torch.tensor(audio_data).unsqueeze(0)
    torchaudio.save(buffer, audio_tensor, sample_rate, format="wav")
    buffer.seek(0)
    
    return buffer.read()
