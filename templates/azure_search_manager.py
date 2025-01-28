from semantic_kernel import Kernel
from data_model import ElderlyUserMemory
from semantic_kernel.data import VectorSearchOptions

async def store_memory(kernel: Kernel, user_id, memory_text, category):
    """Stores a memory in Azure AI Search (if available)."""

    if "collection" not in kernel.services:
        print("Azure AI Search is not available in Ollama mode.")
        return

    vectorizer = kernel.services["vectorizer"]
    collection = kernel.services["collection"]

    record = ElderlyUserMemory(
        id=user_id,
        memory_text=memory_text,
        category=category,
        timestamp="2024-01-27T10:00:00Z"
    )

    record = await vectorizer.add_vector_to_records(record, ElderlyUserMemory)
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
            options=VectorSearchOptions(vector_field_name="memory_vector")
        )

    # **Step 3: Merge Results (Avoid Duplicates)**
    memory_results = set()
    
    async for result in text_results.results:
        memory_results.add(result.record.memory_text)
    
    async for result in vector_results.results:
        memory_results.add(result.record.memory_text)

    return list(memory_results)