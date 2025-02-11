# services.py
from openai import AsyncOpenAI
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion, AzureChatCompletion, AzureTextEmbedding
from semantic_kernel.connectors.memory.azure_ai_search import AzureAISearchCollection
from semantic_kernel.connectors.memory.qdrant import QdrantCollection
from semantic_kernel.data import VectorStoreRecordUtils
from granite_embedding_service import GraniteEmbeddingService
from qdrant_client import AsyncQdrantClient
from qdrant_client.http.models import VectorParams, Distance
from data_model_local import ElderlyUserMemoryLocal
from data_model import ElderlyUserMemory
import config
from config import (
    USE_OLLAMA, OLLAMA_BASE_URL, OLLAMA_MODEL_ID, AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT_NAME,
    AZURE_AI_SEARCH_INDEX, AZURE_AI_SEARCH_ENDPOINT, AZURE_AI_SEARCH_KEY,
    AZURE_OPENAI_EMBEDDING_API_KEY, AZURE_OPENAI_EMBEDDING_ENDPOINT, AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    QDRANT_COLLECTION, QDRANT_HOST, QDRANT_PORT, VECTOR_SIZE
)

async def initialize_ai_service(kernel: Kernel):
    """Initializes AI services in the Kernel dynamically."""
    
    if USE_OLLAMA:
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

        embedding_service_local = GraniteEmbeddingService(
            service_id="embedding"
        )
        kernel.add_service(embedding_service_local)

        # Initialize vectorizer
        vectorizer_local = VectorStoreRecordUtils(kernel)
        kernel.services["vectorizer_local"] = vectorizer_local

        qdrant_client = AsyncQdrantClient(url=QDRANT_HOST, port=QDRANT_PORT)

        # Check if the collection exists, if not create it
        collections_response = await qdrant_client.get_collections()
        existing_collections = [c.name for c in collections_response.collections]
        if QDRANT_COLLECTION not in existing_collections:
            await qdrant_client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config={"vector": VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)}
            )

        collection_local = QdrantCollection(
            client=qdrant_client,
            collection_name=QDRANT_COLLECTION,
            data_model_type = ElderlyUserMemoryLocal,
            vector_size=VECTOR_SIZE,
            named_vectors=True
        )
        kernel.services["collection_local"] = collection_local

    # Initiate Online Models
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
