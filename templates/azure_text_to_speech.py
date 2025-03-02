import azure.cognitiveservices.speech as speechsdk
from config import AZURE_SPEECH_KEY, AZURE_SPEECH_REGION
import os
import time

def text_to_speech(text):
    """Converts text to speech using Azure Cognitive Services."""
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    speech_config.speech_synthesis_voice_name = "en-US-JennyNeural"  # Choose your preferred voice

    # For direct playback, explicitly use default speaker
    audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
    
    result = synthesizer.speak_text_async(text).get()

    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        print("🔊 Speech output played successfully.")
    else:
        print(f"❌ Speech synthesis failed: {result.reason}")

def text_to_speech_to_bytes(text):
    """Converts text to speech and returns the audio as bytes."""
    if not text.strip():
        return bytes()
    
    try:
        # Create a fixed temporary file path in the current directory
        temp_dir = os.path.join(os.getcwd(), "temp_audio")
        os.makedirs(temp_dir, exist_ok=True)
        
        timestamp = int(time.time())
        temp_file_path = os.path.join(temp_dir, f"temp_audio_{timestamp}.wav")
        
        # Set up the speech config
        speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
        speech_config.speech_synthesis_voice_name = "en-US-JennyNeural"
        
        # The key fix: Use a configuration that doesn't try to use a speaker
        audio_config = speechsdk.audio.AudioOutputConfig(filename=temp_file_path)
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
        
        # Synthesize speech to file
        result = synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            # Read the audio bytes from file
            with open(temp_file_path, 'rb') as audio_file:
                audio_bytes = audio_file.read()
            return audio_bytes
        else:
            return bytes()
    
    finally:
        # Clean up temp file if it exists
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)

def text_to_speech_to_file(text, file_path="output.wav"):
    """Converts text to speech and saves to a file."""
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    speech_config.speech_synthesis_voice_name = "en-US-JennyNeural"
    
    audio_config = speechsdk.audio.AudioOutputConfig(filename=file_path)
    synthesizer = speechsdk.SpeechSynthesizer(
        speech_config=speech_config, audio_config=audio_config)
    
    result = synthesizer.speak_text_async(text).get()
    
    if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
        return True
    else:
        print(f"❌ Speech synthesis failed: {result.reason}")
        return False
