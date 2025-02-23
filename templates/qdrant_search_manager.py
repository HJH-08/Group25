import uuid
from datetime import datetime

from qdrant_client.models import PointStruct
from qdrant_client import AsyncQdrantClient
from semantic_kernel import Kernel
from semantic_kernel.data import VectorSearchOptions
from config import QDRANT_COLLECTION
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import models



async def store_memory_local(kernel: Kernel, user_id: str, memory_text: str, category: str):
    """
    Stores a memory in the Qdrant vector store with a unique ID.
    
    This function:
      - Checks that the Qdrant collection ("qdrant_client") is available.
      - Uses the Qdrant vectorizer ("vectorizer_local") to generate an embedding.
      - Upserts the record into the Qdrant collection.
    """
    if "qdrant_client" not in kernel.services:
        print("Qdrant vector store is not available.")
        return

    vectorizer = kernel.services.get("vectorizer_local")
    bm25_model = kernel.services.get("bm25_embedding_model")
    late_interaction_embedding_model = kernel.services.get("late_interaction_embedding_model")
    qdrant_client = kernel.services.get("qdrant_client")

    # Create a unique memory ID (combining user_id, current timestamp, and a short uuid)
    user_id = str(uuid.uuid4())

    dense_embedding = (await vectorizer.kernel.get_service("dense_embedding_model").generate_raw_embeddings([memory_text]))[0]


    bm25_embedding = list(bm25_model.embed(memory_text))[0]
    
    late_interaction_embedding = list(late_interaction_embedding_model.embed(memory_text))[0]

    record = PointStruct(
        id=user_id,
        payload={
            "memory_text": memory_text,
            "category": category,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        vector={
            "dense_embedding": dense_embedding,
            "bm25_embedding": bm25_embedding.as_object(),
            "late_interaction_embedding": late_interaction_embedding.tolist(),
        },
    )

    await qdrant_client.upsert(collection_name=QDRANT_COLLECTION, points=[record])

# Note: QdrantCollection does not support text search.
async def search_memory_local(kernel: Kernel, query: str):
    """
    Searches the Qdrant vector store for memories that match the query.
    
    This function:
     1. Generates dense, sparse, and late-interaction embeddings for the query.
     2. Does vector search on Qdrant collection using all three embeddings.
     3. Reranks results to find best matches.
        4. Returns the memory texts from the top results.
    """
    
    vectorizer = kernel.services.get("vectorizer_local")
    bm25_model = kernel.services.get("bm25_embedding_model")
    late_interaction_embedding_model = kernel.services.get("late_interaction_embedding_model")
    qdrant_client = kernel.services.get("qdrant_client")
    
    if "qdrant_client" not in kernel.services:
        print("Qdrant vector store is not available.")
        return []
    
    dense_vectors = (await vectorizer.kernel.get_service("dense_embedding_model").generate_raw_embeddings([query]))[0]
    sparse_vectors = next(bm25_model.query_embed(query))
    late_vectors = next(late_interaction_embedding_model.query_embed(query))

    # Rerank the results based on the query
    prefetch = [
        models.Prefetch(
            query=dense_vectors,
            using="dense_embedding",
            limit=10,
        ),
        models.Prefetch(
            query=models.SparseVector(**sparse_vectors.as_object()),
            using="bm25_embedding",
            limit=10,
        ),
    ]

    vector_results = await qdrant_client.query_points(
         QDRANT_COLLECTION,
        prefetch=prefetch,
        query=late_vectors,
        using="late_interaction_embedding",
        with_payload=True,
        limit=5,
    )

    memory_results = set()

# Iterate over the retrieved results
    for result in vector_results.points:
        memory_results.add(result.payload.get("memory_text"))

    return memory_results
