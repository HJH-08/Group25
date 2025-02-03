# main.py

import asyncio
from chatbot import chat
from kernel_manager import setup_kernel  # Import the function, not model_name directly
from config import AVAILABLE_OLLAMA_MODELS, USE_OLLAMA, OLLAMA_MODEL_ID
import config

def select_ollama_model():
    """Prompt user to select between Phi3 and IBM Granite when using Ollama."""
    if USE_OLLAMA:
        print("Select the Ollama model you want to use:")
        print("1. Phi3 (default)")
        print("2. IBM Granite")
        choice = input("Enter the number of your choice: ").strip()

        if choice in AVAILABLE_OLLAMA_MODELS:
            config.OLLAMA_MODEL_ID = AVAILABLE_OLLAMA_MODELS[choice]
        else:
            print("Invalid choice. Defaulting to Phi3.")
            config.OLLAMA_MODEL_ID = "phi3:latest"



async def main():
    if USE_OLLAMA:
        select_ollama_model()
    chatting = True
    while chatting:
        chatting = await chat()

if __name__ == "__main__":
    asyncio.run(main())
