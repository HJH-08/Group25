import os
import sounddevice as sd
import gradio as gr
import logging

# Define a dummy progress class with a tqdm() method.
class DummyProgress:
    def tqdm(self, iterable):
        return iterable

# Monkey-patch gr.Progress to return a DummyProgress instance.
gr.Progress = lambda: DummyProgress()

from cached_path import cached_path
from f5_tts.model import DiT
from f5_tts.infer.infer_gradio import infer
from f5_tts.infer.utils_infer import load_model

# Reduce logging noise
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("f5_tts").setLevel(logging.ERROR)

# Global variable for the F5-TTS model.
F5TTS_ema_model = None

def load_f5tts_model(ckpt_path=str(cached_path("hf://SWivid/F5-TTS/F5TTS_Base/model_1200000.safetensors"))):
    """
    Loads the F5-TTS model, downloading it if necessary.
    """
    F5TTS_model_cfg = dict(dim=1024, depth=22, heads=16, ff_mult=2, text_dim=512, conv_layers=4)
    model = load_model(DiT, F5TTS_model_cfg, ckpt_path)
    return model

def dummy_show_info(message):
    """
    A dummy logging callback that prints the message and returns an empty string.
    This ensures that any output from logging or auto-transcription is a string.
    """
    print(message)
    return ""

def speak_text(text, ref_audio_path="models/f5-tts/basic_ref_en.wav", ref_text=""):
    """
    Converts the input text to speech using F5-TTS and plays the generated audio.
    
    Args:
        text (str): The text to synthesize.
        ref_audio_path (str): Path to the reference audio file.
        ref_text (str): Optional reference transcription. If empty, auto-transcription is triggered.
    
    Raises:
        FileNotFoundError: If the reference audio file is not found.
    """
    if not os.path.exists(ref_audio_path):
        raise FileNotFoundError(f"Reference audio file '{ref_audio_path}' not found.")
    
    # Load the F5-TTS model (downloads it if not cached)
    global F5TTS_ema_model
    F5TTS_ema_model = load_f5tts_model()
    
    # Call F5-TTS's infer() function.
    # The dummy_show_info callback and dummy progress (via gr.Progress) ensure that
    # any logging or auto-transcription output is a string and that progress.tqdm() works.
    audio_out, _, _ = infer(
        ref_audio_path,
        ref_text,
        text,
        "F5-TTS",
        remove_silence=False,
        cross_fade_duration=0.15,
        nfe_step=32,
        speed=1,
        show_info=dummy_show_info
    )
    
    sample_rate, audio_data = audio_out
    
    # Play the generated audio using sounddevice.
    sd.play(audio_data, sample_rate)
    sd.wait()

# Example usage:
if __name__ == "__main__":
    sample_text = "Hello, my name is Jun. Nice to meet you."
    # Ensure that the reference audio file exists at the provided path.
    speak_text(sample_text, ref_audio_path="models/f5-tts/basic_ref_en.wav")