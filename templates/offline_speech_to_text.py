import os
import json
import sounddevice as sd
import queue
import vosk
import zipfile
import requests
import shutil

# Define paths
VOSK_MODEL_DIR = "models/vosk-en"
VOSK_MODEL_PATH = os.path.join(VOSK_MODEL_DIR, "vosk-model-en-us-0.22")
VOSK_MODEL_ZIP_URL = "https://alphacephei.com/vosk/models/vosk-model-en-us-0.22.zip"
VOSK_MODEL_ZIP_PATH = os.path.join(VOSK_MODEL_DIR, "vosk-model-en-us-0.22.zip")

def download_and_extract_vosk_model():
    """Downloads and extracts the Vosk speech model if not found."""
    if os.path.exists(VOSK_MODEL_PATH):
        print(f"✅ Vosk model already exists at {VOSK_MODEL_PATH}. No need to download.")
        return
    
    os.makedirs(VOSK_MODEL_DIR, exist_ok=True)  # Ensure directory exists

    print(f"📥 Downloading Vosk model from {VOSK_MODEL_ZIP_URL} ...")
    response = requests.get(VOSK_MODEL_ZIP_URL, stream=True)
    
    if response.status_code == 200:
        with open(VOSK_MODEL_ZIP_PATH, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"✅ Download complete: {VOSK_MODEL_ZIP_PATH}")
    else:
        raise RuntimeError(f"❌ Failed to download Vosk model. HTTP Status Code: {response.status_code}")

    print("📂 Extracting Vosk model...")
    with zipfile.ZipFile(VOSK_MODEL_ZIP_PATH, "r") as zip_ref:
        zip_ref.extractall(VOSK_MODEL_DIR)

    print(f"✅ Extraction complete. Model available at {VOSK_MODEL_PATH}")
    
    # Remove the ZIP file after extraction
    os.remove(VOSK_MODEL_ZIP_PATH)

# Ensure the Vosk model is available
download_and_extract_vosk_model()

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
