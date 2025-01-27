import asyncio
from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAITextEmbedding, AzureTextEmbedding
from semantic_kernel.connectors.memory.azure_ai_search import AzureAISearchCollection, AzureAISearchSettings
from semantic_kernel.data import VectorSearchOptions, VectorStoreRecordUtils
from data_model import ElderlyUserMemory
from config import AZURE_AI_SEARCH_INDEX
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Fetch credentials from .env
AZURE_AI_SEARCH_ENDPOINT = os.getenv("AZURE_AI_SEARCH_ENDPOINT")
AZURE_AI_SEARCH_KEY = os.getenv("AZURE_AI_SEARCH_KEY")
AZURE_AI_SEARCH_INDEX = os.getenv("AZURE_AI_SEARCH_INDEX")

AZURE_OPENAI_EMBEDDING_API_KEY = os.getenv("AZURE_OPENAI_EMBEDDING_API_KEY")
AZURE_OPENAI_EMBEDDING_ENDPOINT = os.getenv("AZURE_OPENAI_EMBEDDING_ENDPOINT")
AZURE_OPENAI_EMBEDDING_DEPLOYMENT = os.getenv("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")

# Ensure all required environment variables are set
if not all([AZURE_AI_SEARCH_ENDPOINT, AZURE_AI_SEARCH_KEY, AZURE_AI_SEARCH_INDEX]):
    raise ValueError("Missing required environment variables. Check your .env file.")

# Initialize Kernel
kernel = Kernel()

# Add Embedding Service for Vector Search
#embedding_service = OpenAITextEmbedding(service_id="embedding", ai_model_id="text-embedding-3-small", api_key=AZURE_OPENAI_API_KEY)
embedding_service = AzureTextEmbedding(
    service_id="embedding",  # This is your embedding model
    api_key=AZURE_OPENAI_EMBEDDING_API_KEY,
    deployment_name=AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    endpoint=AZURE_OPENAI_EMBEDDING_ENDPOINT
)
kernel.add_service(embedding_service)
vectorizer = VectorStoreRecordUtils(kernel)

# Initialize Azure AI Search Collection
collection = AzureAISearchCollection[ElderlyUserMemory](
    collection_name=AZURE_AI_SEARCH_INDEX,
    data_model_type=ElderlyUserMemory,
    endpoint=AZURE_AI_SEARCH_ENDPOINT,
    api_key=AZURE_AI_SEARCH_KEY
    )


# Store a Memory
async def store_memory(user_id, memory_text, category):
    record = ElderlyUserMemory(
        id=user_id,
        memory_text=memory_text,
        category=category,
        timestamp="2024-01-27T10:00:00Z"  # Placeholder timestamp
    )
    record = await vectorizer.add_vector_to_records(record, ElderlyUserMemory)
    await collection.upsert(record)

# Search for a Memory
async def search_memory(query):
    results = await collection.text_search(search_text=query)
    memory_results = []
    async for result in results.results:
        memory_results.append(result.record.memory_text)
    return memory_results