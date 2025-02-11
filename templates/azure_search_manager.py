from semantic_kernel import Kernel
from data_model import ElderlyUserMemory
from semantic_kernel.data import VectorSearchOptions
from datetime import datetime
import numpy as np
import uuid  # For generating unique memory IDs

async def store_memory(kernel: Kernel, user_id, memory_text, category):
    """Stores a memory in Azure AI Search, ensuring uniqueness."""
    
    if "collection" not in kernel.services:
        print("Azure AI Search is not available in Ollama mode.")
        return

    vectorizer = kernel.services["vectorizer"]
    collection = kernel.services["collection"]

    # Create a unique ID using timestamp + user_id + uuid
    memory_id = f"{user_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"

    record = ElderlyUserMemory(
        id=memory_id,  # ✅ Unique ID per memory
        memory_text=memory_text,
        category=category,
        timestamp=datetime.utcnow().isoformat() + "Z"
    )

    # Generate embedding
    record = await vectorizer.add_vector_to_records(record, ElderlyUserMemory)

    # Store in Azure AI Search
    await collection.upsert(record)

async def search_memory(kernel: Kernel, query):
    """Searches for a memory using both text search and vector search."""

    if "collection" not in kernel.services:
        print("Azure AI Search is not available in Ollama mode.")
        return []

    collection = kernel.services["collection"]

    # **Step 1: Perform Text Search**
    text_results = await collection.text_search(search_text=query)

    # **Step 2: Perform Vector Search (if embeddings are available)**
    vector_results = []
    if "vectorizer" in kernel.services:
        vectorizer = kernel.services["vectorizer"]
        query_vector = (await vectorizer.kernel.get_service("embedding").generate_raw_embeddings([query]))[0]

        vector_results = await collection.vectorized_search(
            vector=query_vector,
            options=VectorSearchOptions(
                vector_field_name="memory_vector",
                similarity_threshold=0.7,
                top_k = 1000
                )
        )

    # **Step 3: Merge Results (Avoid Duplicates)**
    memory_results = set()
    
    async for result in text_results.results:
        memory_results.add(result.record.memory_text)
    
    async for result in vector_results.results:
        memory_results.add(result.record.memory_text)

    return list(memory_results)