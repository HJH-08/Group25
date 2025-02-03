# services.py
from openai import AsyncOpenAI
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion, AzureChatCompletion
from config import USE_OLLAMA, OLLAMA_BASE_URL, OLLAMA_MODEL_ID, AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT_NAME
import asyncio
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAITextEmbedding, AzureTextEmbedding
from semantic_kernel.connectors.memory.azure_ai_search import AzureAISearchCollection, AzureAISearchSettings
from semantic_kernel.data import VectorSearchOptions, VectorStoreRecordUtils
from data_model import ElderlyUserMemory
from config import (
    AZURE_AI_SEARCH_INDEX, AZURE_AI_SEARCH_ENDPOINT, AZURE_AI_SEARCH_KEY,
    AZURE_OPENAI_EMBEDDING_API_KEY, AZURE_OPENAI_EMBEDDING_ENDPOINT, AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
)
import config

def initialize_ai_service(kernel: Kernel):
    """Initializes AI services in the Kernel dynamically."""
    
    if USE_OLLAMA:
        from openai import AsyncOpenAI
        service_id = "local-gpt"
        openAIClient = AsyncOpenAI(
            api_key="key",  # Fake key, required for compatibility
            base_url=OLLAMA_BASE_URL
        )
        kernel.add_service(
            OpenAIChatCompletion(
                service_id=service_id,
                ai_model_id=config.OLLAMA_MODEL_ID,
                async_client=openAIClient,
            )
        )
        model_name = f"Ollama Model: {config.OLLAMA_MODEL_ID}"

    else:
        # Add Azure OpenAI
        kernel.add_service(
            AzureChatCompletion(
                service_id="azure",
                api_key=AZURE_API_KEY,
                deployment_name=AZURE_DEPLOYMENT_NAME,
                endpoint=AZURE_ENDPOINT,
            )
        )
        model_name = f"Azure OpenAI Model: {AZURE_DEPLOYMENT_NAME}"
        service_id="azure"

        # Add Azure OpenAI Embeddings (For Vector Search)
        embedding_service = AzureTextEmbedding(
            service_id="embedding",
            api_key=AZURE_OPENAI_EMBEDDING_API_KEY,
            deployment_name=AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
            endpoint=AZURE_OPENAI_EMBEDDING_ENDPOINT
        )
        kernel.add_service(embedding_service)

        # Initialize Vectorizer
        vectorizer = VectorStoreRecordUtils(kernel)
        kernel.services["vectorizer"] = vectorizer  # ✅ Store in kernel.services

        # Initialize Azure AI Search Collection
        collection = AzureAISearchCollection[ElderlyUserMemory](
            collection_name=AZURE_AI_SEARCH_INDEX,
            data_model_type=ElderlyUserMemory,
            endpoint=AZURE_AI_SEARCH_ENDPOINT,
            api_key=AZURE_AI_SEARCH_KEY
        )
        kernel.services["collection"] = collection  # ✅ Store in kernel.services

    return service_id, model_name, kernel
