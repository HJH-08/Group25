import azure.cognitiveservices.speech as speechsdk
from config import AZURE_SPEECH_KEY, AZURE_SPEECH_REGION

def speech_to_text():
    """Converts long speech to text using Azure's continuous recognition."""
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
    audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
    speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    print("🎤 Speak now... (Say or type 'stop listening' to finish, or 'exit program' to quit)")

    result_text = []
    stop_recognition = False
    exit_program = False

    def handle_final_result(evt):
        nonlocal stop_recognition, exit_program
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
            text = evt.result.text.lower()
            print(f"Recognized: {evt.result.text}")
            result_text.append(evt.result.text)

            # Voice command detection
            if "stop listening" in text:
                stop_recognition = True
            if "exit program" in text:
                exit_program = True
                stop_recognition = True

    # Connect event handler
    speech_recognizer.recognized.connect(handle_final_result)
    speech_recognizer.start_continuous_recognition()

    try:
        while not stop_recognition:
            # ✅ Check for typed input while speech recognition runs
            user_input = input("⌨️ Type 'stop listening' to finish, or 'exit program' to quit: ").strip().lower()

            if user_input == "stop listening":
                stop_recognition = True
                print("🛑 Stopping speech recognition as requested.")
            elif user_input == "exit program":
                exit_program = True
                stop_recognition = True
                print("👋 Exiting the program as requested.")

    except KeyboardInterrupt:
        print("\n⚠️ Keyboard interrupt detected. Exiting recognition.")
        exit_program = True

    speech_recognizer.stop_continuous_recognition()

    final_text = " ".join(result_text)
    return final_text if final_text else None, exit_program
