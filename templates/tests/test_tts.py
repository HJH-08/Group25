import pytest
from azure_text_to_speech import text_to_speech_to_bytes

def test_text_to_speech_generates_audio():
    # Input
    text = "Hello, how are you today?"
    gender = "male"

    # Convert text to audio bytes
    audio_bytes = text_to_speech_to_bytes(text, gender)

    # Assert it's a non-empty bytes object
    assert isinstance(audio_bytes, bytes)
    assert len(audio_bytes) > 0
