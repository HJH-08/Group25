# memory_store.py

import semantic_kernel as sk
from semantic_kernel.memory.volatile_memory_store import VolatileMemoryStore

def setup_memory(kernel: sk.Kernel):
    """
    Attaches an in-memory vector store to the kernel.
    """
    # Use an ephemeral in-memory store
    memory_store = VolatileMemoryStore()
    kernel.register_memory_store(memory_store)
    return kernel
