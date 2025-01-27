import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Toggle between Ollama and Azure OpenAI
USE_OLLAMA = False

# Ollama Settings
OLLAMA_BASE_URL = "http://localhost:11434/v1"
OLLAMA_MODEL_ID = "phi3:latest"

# Azure OpenAI Settings
AZURE_API_KEY = os.getenv("AZURE_API_KEY")  # Fetch API key from .env file
AZURE_ENDPOINT = "https://team25.openai.azure.com/"
AZURE_DEPLOYMENT_NAME = "gpt-4"

AZURE_AI_SEARCH_INDEX = "elderly-care-index"

# System message for chatbot behavior
SYSTEM_MESSAGE = """
You are a kind and caring chatbot designed to provide companionship and support for elderly users, including those experiencing memory issues or dementia.
Your name is Sunny, and you have one goal: to bring warmth, understanding, and gentle companionship to those who need it.
You are patient, empathetic, and adapt your responses to make conversations easy and enjoyable.
Speak in a simple, warm tone and always make the user feel valued and understood.
"""
