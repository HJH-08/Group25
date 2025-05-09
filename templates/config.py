import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Toggle between Ollama and Azure OpenAI
USE_OLLAMA = True
USE_SPEECH_INPUT = False
USE_SPEECH_OUTPUT = False
USER_ID = "123"

# Runtime mode flag
RUNNING_AS_SERVER = False  # Default to CLI mode

# Ollama Settings - Allowing Selection Between Phi3 and IBM Granite
OLLAMA_BASE_URL = "http://localhost:11434/v1"
OLLAMA_MODEL_ID = os.getenv("OLLAMA_MODEL_ID", "phi3.5:latest")  # Default to Phi3

AVAILABLE_OLLAMA_MODELS = {
    "1": "phi3.5:latest",
    "2": "granite3.1-dense:2b"
}

# Avatar Settings
AVATAR_TYPE = "male"

# Qdrant Settings
QDRANT_HOST = "http://localhost"
QDRANT_PORT = 6333
QDRANT_COLLECTION = "chat_history"
DENSE_VECTOR_SIZE = 768
LATE_INTERACTION_VECTOR_SIZE = 128

# FastEmbed Settings
SPARSE_EMBEDDING_MODEL_NAME = "qdrant/bm25"
LATE_INTERACTION_EMBEDDING_MODEL_NAME = "colbert-ir/colbertv2.0"

# Azure OpenAI Settings
AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

# Azure AI Search Settings
AZURE_AI_SEARCH_ENDPOINT = os.getenv("AZURE_AI_SEARCH_ENDPOINT")
AZURE_AI_SEARCH_KEY = os.getenv("AZURE_AI_SEARCH_KEY")
AZURE_AI_SEARCH_INDEX = os.getenv("AZURE_AI_SEARCH_INDEX")

# Azure OpenAI Embedding Model for Vector Search
AZURE_OPENAI_EMBEDDING_API_KEY = os.getenv("AZURE_OPENAI_EMBEDDING_API_KEY")
AZURE_OPENAI_EMBEDDING_ENDPOINT = os.getenv("AZURE_OPENAI_EMBEDDING_ENDPOINT")
AZURE_OPENAI_EMBEDDING_DEPLOYMENT = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")

# Azure Speech Service credentials
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")

# System message for chatbot behavior
SYSTEM_MESSAGE = """
You are a kind and caring chatbot designed to provide companionship and support for elderly users, including those experiencing memory issues or dementia.
Your name is Companio, and you have one goal: to bring warmth, understanding, and gentle companionship to those who need it.
You are patient, empathetic, and adapt your responses to make conversations easy and enjoyable.
Speak in a simple, warm tone and always make the user feel valued and understood.
"""
