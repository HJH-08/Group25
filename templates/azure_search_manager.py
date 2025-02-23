from semantic_kernel import Kernel
from data_model import ElderlyUserMemory
from semantic_kernel.data import VectorSearchOptions
from datetime import datetime
import numpy as np
import uuid  # For generating unique memory IDs
from collections import defaultdict

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

async def apply_rrf(text_results, vector_results, k=60, final_top_k=5):
    """Helper function for RRF (Rank Reciprocal Fusion) algorithm."""
    fusion_scores = defaultdict(float)
    doc_map = {}

    async def add_to_fusion(results, weight=1):
        rank = 0
        async for result in results.results:  # ✅ Fixed: Use async iteration
            doc_id = result.record.id
            memory_text = result.record.memory_text  # Extract memory text

            # Store the document mapping
            if doc_id not in doc_map:
                doc_map[doc_id] = memory_text

            # Apply RRF formula
            fusion_scores[doc_id] += weight / (k + rank + 1)
            rank += 1

    await add_to_fusion(text_results, weight=1)
    await add_to_fusion(vector_results, weight=1)

    # **Step 4: Sort by RRF Score**
    sorted_doc_ids = sorted(fusion_scores.keys(), key=lambda doc_id: fusion_scores[doc_id], reverse=True)

    # **Step 5: Retrieve memory_text values in ranked order**
    final_results = [doc_map[doc_id] for doc_id in sorted_doc_ids[:final_top_k]]

    return final_results

async def search_memory(kernel: Kernel, query, top_k=10):
    """Searches for a memory using both text search and vector search."""

    if "collection" not in kernel.services:
        print("Azure AI Search is not available in Ollama mode.")
        return []

    collection = kernel.services["collection"]

    # **Step 1: Perform Text Search**
    text_results = await collection.text_search(search_text=query, top_k=top_k)

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
                top_k = top_k
                )
        )

    # **Step 3: Merge Results (Avoid Duplicates)**
    memory_results = set()
    
    memory_results = await apply_rrf(text_results, vector_results, k=60)

    return list(memory_results)