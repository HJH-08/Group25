import os
import sounddevice as sd
import torch
import torchaudio
import logging
from TTS.api import TTS

# Reduce logging noise
logging.getLogger("TTS").setLevel(logging.ERROR)

# Load the Coqui TTS model (offline)
tts_model = TTS("tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False).to("cpu")

def speak_text(text):
    """
    Converts text to speech using Coqui TTS and plays the generated audio.

    Args:
        text (str): The text to synthesize.
    """
    if not text.strip():
        return

    # Generate speech (returns NumPy array)
    audio_data = tts_model.tts(text=text)

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

# Example usage
if __name__ == "__main__":
    speak_text("Hello, my name is Jun. Nice to meet you.")
