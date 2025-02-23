import os
import json
import sounddevice as sd
import queue
import vosk

# Define the path to the Vosk model
VOSK_MODEL_PATH = "models/vosk-en/vosk-model-en-us-0.22"

# Check if the model exists
if not os.path.exists(VOSK_MODEL_PATH):
    raise FileNotFoundError(f"❌ Vosk model not found at {VOSK_MODEL_PATH}! Please download it.")

# Initialize Vosk STT Model
model = vosk.Model(VOSK_MODEL_PATH)
q = queue.Queue()

def callback(indata, frames, time, status):
    """Callback function to store recorded audio chunks."""
    if status:
        print(status, flush=True)
    q.put(bytes(indata))

def offline_speech_to_text():
    """Converts speech to text using Vosk (Offline)."""
    
    print("🎤 Speak now... (Say 'stop listening' to finish speaking or 'exit program' to quit the program entirely.)")
    
    with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype="int16",
                           channels=1, callback=callback):
        recognizer = vosk.KaldiRecognizer(model, 16000)
        final_text = []
        stop_recognition = False
        exit_program = False

        while not stop_recognition:
            data = q.get()
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                text = result.get("text", "").lower()
                print(f"Recognized: {text}")

                final_text.append(text)

                # Command detection
                if "stop listening" in text:
                    stop_recognition = True
                    print("🛑 Stopping recognition.")
                elif "exit program" in text:
                    stop_recognition = True
                    exit_program = True
                    print("👋 Exiting the program.")

        final_text = " ".join(final_text)
        return final_text if final_text else None, exit_program

if __name__ == "__main__":
    try:
        print("\n🎤 Testing Vosk Offline Speech-to-Text... Speak now!")
        spoken_text, exit_flag = offline_speech_to_text()

        if spoken_text:
            print(f"\n✅ Transcription: {spoken_text}")
        else:
            print("\n❌ No speech detected.")

        if exit_flag:
            print("👋 Exiting program.")
    except KeyboardInterrupt:
        print("\n🚪 Manually interrupted. Exiting...")
