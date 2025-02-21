# services.py
from openai import AsyncOpenAI
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import (
    OpenAIChatCompletion, AzureChatCompletion, AzureTextEmbedding
)
from semantic_kernel.connectors.memory.azure_ai_search import AzureAISearchCollection
from semantic_kernel.data import VectorStoreRecordUtils
from granite_embedding_service import GraniteEmbeddingService
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import VectorParams, Distance, models
from data_model import ElderlyUserMemory
from config import (
    USE_OLLAMA, OLLAMA_BASE_URL, OLLAMA_MODEL_ID, AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT_NAME,
    AZURE_AI_SEARCH_INDEX, AZURE_AI_SEARCH_ENDPOINT, AZURE_AI_SEARCH_KEY,
    AZURE_OPENAI_EMBEDDING_API_KEY, AZURE_OPENAI_EMBEDDING_ENDPOINT, AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    QDRANT_COLLECTION, QDRANT_HOST, QDRANT_PORT, DENSE_VECTOR_SIZE, LATE_INTERACTION_VECTOR_SIZE, SPARSE_EMBEDDING_MODEL_NAME, LATE_INTERACTION_EMBEDDING_MODEL_NAME,
)
from fastembed import LateInteractionTextEmbedding, SparseTextEmbedding

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
                ai_model_id=OLLAMA_MODEL_ID,
                async_client=openAIClient,
            )
        )
        model_name = f"Ollama Model: {OLLAMA_MODEL_ID}"

        # Initialize Dense Embedding Model
        dense_embedding_model = GraniteEmbeddingService(
            service_id="dense_embedding_model"
        )
        kernel.add_service(dense_embedding_model)
        
        # Initilize Sparse Embedding Model
        bm25_embedding_model = SparseTextEmbedding(SPARSE_EMBEDDING_MODEL_NAME)
        kernel.services["bm25_embedding_model"] = bm25_embedding_model

        # Initialize Late Interaction Embedding Model
        late_interaction_embedding_model = LateInteractionTextEmbedding(LATE_INTERACTION_EMBEDDING_MODEL_NAME)
        kernel.services["late_interaction_embedding_model"] = late_interaction_embedding_model

        # Initialize vectorizer
        vectorizer_local = VectorStoreRecordUtils(kernel)
        kernel.services["vectorizer_local"] = vectorizer_local

        qdrant_client = AsyncQdrantClient(url=QDRANT_HOST, port=QDRANT_PORT)

        # Check if the collection exists, if not initialise it
        collections_response = await qdrant_client.get_collections()
        existing_collections = [c.name for c in collections_response.collections]
        
        if QDRANT_COLLECTION not in existing_collections:
            await qdrant_client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config={
                "dense_embedding": VectorParams(
                size=DENSE_VECTOR_SIZE,
                distance=Distance.COSINE,
                ),
                "late_interaction_embedding": VectorParams(
                size=LATE_INTERACTION_VECTOR_SIZE,
                distance=Distance.COSINE,
                multivector_config=models.MultiVectorConfig(
                    comparator=models.MultiVectorComparator.MAX_SIM,
                )
                ),
            },
            sparse_vectors_config={
                "bm25_embedding": models.SparseVectorParams(
                modifier=models.Modifier.IDF
                )
            }
            )
        kernel.services["qdrant_client"] = qdrant_client # Add Qdrant Client to Kernel


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
        kernel.services["vectorizer"] = vectorizer  

        # Initialize Azure AI Search Collection
        collection = AzureAISearchCollection[ElderlyUserMemory](
            collection_name=AZURE_AI_SEARCH_INDEX,
            data_model_type=ElderlyUserMemory,
            endpoint=AZURE_AI_SEARCH_ENDPOINT,
            api_key=AZURE_AI_SEARCH_KEY
        )
        kernel.services["collection"] = collection 

    return service_id, model_name, kernel
