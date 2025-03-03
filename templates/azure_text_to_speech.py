import azure.cognitiveservices.speech as speechsdk
from config import AZURE_SPEECH_KEY, AZURE_SPEECH_REGION

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
    if not text or not text.strip():
        print("Empty text provided to text_to_speech_to_bytes")
        return bytes()
        
    if not AZURE_SPEECH_KEY or not AZURE_SPEECH_REGION:
        print("Azure Speech credentials not configured")
        return bytes()
    
    try:
        # Create a temporary file for storing the output
        import tempfile
        import os
        temp_file_path = ""
        
        try:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file_path = temp_file.name
        
            # Set up the speech config with safety checks
            speech_config = speechsdk.SpeechConfig(
                subscription=AZURE_SPEECH_KEY, 
                region=AZURE_SPEECH_REGION
            )
            speech_config.speech_synthesis_voice_name = "en-US-JennyNeural"
            
            # Configure audio output to file
            audio_config = speechsdk.audio.AudioOutputConfig(filename=temp_file_path)
            
            # Create synthesizer
            synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=speech_config, 
                audio_config=audio_config
            )
            
            # Use a timeout to prevent hanging
            result = synthesizer.speak_text_async(text).get()
            
            # Check if synthesis completed successfully
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                # Verify the file exists and has content
                if os.path.exists(temp_file_path) and os.path.getsize(temp_file_path) > 0:
                    # Read audio bytes from file
                    with open(temp_file_path, 'rb') as audio_file:
                        audio_bytes = audio_file.read()
                    return audio_bytes
                else:
                    print(f"Output file is missing or empty: {temp_file_path}")
                    return bytes()
            else:
                # Handle cancelation errors specifically
                if result.reason == speechsdk.ResultReason.Canceled:
                    cancellation_details = speechsdk.CancellationDetails.from_result(result)
                    print(f"Speech synthesis canceled: {cancellation_details.reason}")
                    print(f"Error details: {cancellation_details.error_details}")
                else:
                    print(f"Speech synthesis failed: {result.reason}")
                return bytes()
                
        except Exception as synth_error:
            print(f"TTS synthesis error: {str(synth_error)}")
            return bytes()
            
    except Exception as outer_error:
        print(f"Outer TTS error: {str(outer_error)}")
        return bytes()
        
    finally:
        # Clean up temp file in a safer way
        try:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
        except Exception as cleanup_error:
            print(f"Error cleaning up temp file: {str(cleanup_error)}")

def text_to_speech_to_file(text, file_path="output.wav"):
    """Converts text to speech and saves to a file."""
    if not text or not text.strip():
        print("Empty text provided to text_to_speech_to_file")
        return False
        
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
