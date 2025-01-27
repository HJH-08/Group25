from semantic_kernel import Kernel
from data_model import ElderlyUserMemory

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
    """Searches for a memory using Azure AI Search (if available)."""

    if "collection" not in kernel.services:
        print("Azure AI Search is not available in Ollama mode.")
        return []

    collection = kernel.services["collection"]
    results = await collection.text_search(search_text=query)

    return [result.record.memory_text async for result in results.results]