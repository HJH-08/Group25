# services.py

import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
import semantic_kernel.connectors.ai.hugging_face as sk_hf
from semantic_kernel.memory.semantic_text_memory import SemanticTextMemory
from semantic_kernel.memory.volatile_memory_store import VolatileMemoryStore
from semantic_kernel.core_plugins.text_memory_plugin import TextMemoryPlugin

from semantic_kernel.connectors.ai.open_ai.services.open_ai_text_embedding import OpenAITextEmbedding

from config import (
    AZURE_OPENAI_DEPLOYMENT_NAME,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    HUGGING_FACE_MODEL_ID,
    HUGGING_FACE_TASK
)

def create_kernel():
    """
    Create and configure the Semantic Kernel with Azure GPT and local/remote Hugging Face model.
    """
    kernel = sk.Kernel()

    # ----- Azure OpenAI Chat Completion -----
    kernel.add_service(
        AzureChatCompletion(
        deployment_name=AZURE_OPENAI_DEPLOYMENT_NAME,
        api_key=AZURE_OPENAI_API_KEY,
        endpoint=AZURE_OPENAI_ENDPOINT,
        service_id="chat_completion"
        )
    ) 

    # ----- Hugging Face text completion -----
    kernel.add_service(
        sk_hf.HuggingFaceTextCompletion(
        HUGGING_FACE_MODEL_ID,
        task=HUGGING_FACE_TASK
        )
    )

    embedding_gen = OpenAITextEmbedding(
        service_id="embedding",  # Customize this ID
        ai_model_id="text-embedding-ada-002",
        api_key=AZURE_OPENAI_API_KEY,
    )
    kernel.add_service(embedding_gen)

    # Short-term memory
    short_term_memory = SemanticTextMemory(
        storage=VolatileMemoryStore(),
        embeddings_generator=embedding_gen
    )
    kernel.add_plugin(TextMemoryPlugin(short_term_memory), "ShortTermMemory")

    # Long-term memory
    long_term_memory = SemanticTextMemory(
        storage=VolatileMemoryStore(),
        embeddings_generator=embedding_gen
    )
    kernel.add_plugin(TextMemoryPlugin(long_term_memory), "LongTermMemory")

    return kernel

