import uuid
from datetime import datetime

from qdrant_client.models import PointStruct
from semantic_kernel import Kernel
from semantic_kernel.data import VectorSearchOptions

from data_model_local import ElderlyUserMemoryLocal


async def store_memory_local(kernel: Kernel, user_id: str, memory_text: str, category: str):
    """
    Stores a memory in the Qdrant vector store with a unique ID.
    
    This function:
      - Checks that the Qdrant collection ("collection_local") is available.
      - Uses the Qdrant vectorizer ("vectorizer_local") to generate an embedding.
      - Upserts the record into the Qdrant collection.
    """
    if "collection_local" not in kernel.services:
        print("Qdrant vector store is not available.")
        return

    vectorizer = kernel.services.get("vectorizer_local")
    collection = kernel.services.get("collection_local")

    # Create a unique memory ID (combining user_id, current timestamp, and a short uuid)
    user_id = str(uuid.uuid4())

    embeddings = await vectorizer.kernel.get_service("embedding").generate_raw_embeddings([memory_text])
    embedded_vector = embeddings[0]

    record = PointStruct(
        id=user_id,
        payload={
            "memory_text": memory_text,
            "category": category,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        vector=embedded_vector,
    )

    # record = await vectorizer.add_vector_to_records(record, ElderlyUserMemory)

    await collection.upsert([record])

# Note: QdrantCollection does not support text search.
async def search_memory_local(kernel: Kernel, query: str):
    """
    Searches the Qdrant vector store for memories that match the query.
    
    This function:
    Generates an embedding for the query and performs a vector search.
    """
    if "collection_local" not in kernel.services:
        print("Qdrant vector store is not available.")
        return []

    collection = kernel.services["collection_local"]

    vector_results = []
    if "vectorizer_local" in kernel.services:
        vectorizer = kernel.services["vectorizer_local"]
        query_vector = (await vectorizer.kernel.get_service("embedding").generate_raw_embeddings([query]))[0]

        vector_results = await collection.vectorized_search(
            vector=query_vector,
            options=VectorSearchOptions(
                vector_field_name="vector",
                similarity_threshold=0.75,
                top_k=8,
            ),
        )

    memory_results = set()

    async for result in vector_results.results:
        memory_results.add(result.record.memory_text)

    return list(memory_results)
