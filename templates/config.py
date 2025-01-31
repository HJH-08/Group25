import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Toggle between Ollama and Azure OpenAI
USE_OLLAMA = True
USER_ID = "123"

# Ollama Settings
OLLAMA_BASE_URL = "http://localhost:11434/v1"
OLLAMA_MODEL_ID = "phi3:latest"

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

# System message for chatbot behavior
SYSTEM_MESSAGE = """
You are a kind and caring chatbot designed to provide companionship and support for elderly users, including those experiencing memory issues or dementia.
Your name is Companio, and you have one goal: to bring warmth, understanding, and gentle companionship to those who need it.
You are patient, empathetic, and adapt your responses to make conversations easy and enjoyable.
Speak in a simple, warm tone and always make the user feel valued and understood.
"""
