from typing import Annotated, Any
from pydantic import BaseModel
from semantic_kernel.data import (
    VectorStoreRecordDataField,
    VectorStoreRecordKeyField,
    VectorStoreRecordVectorField,
    vectorstoremodel
)
from semantic_kernel.connectors.ai.open_ai import OpenAIEmbeddingPromptExecutionSettings

@vectorstoremodel
class ElderlyUserMemory(BaseModel):
    id: Annotated[str, VectorStoreRecordKeyField]  # Unique User ID
    memory_text: Annotated[
        str,
        VectorStoreRecordDataField(
            has_embedding=True, embedding_property_name="memory_vector", is_full_text_searchable=True
        ),
    ]
    memory_vector: Annotated[
        list[float] | None,
        VectorStoreRecordVectorField(
            dimensions=1536,
            local_embedding=True,
            embedding_settings={"embedding": OpenAIEmbeddingPromptExecutionSettings(dimensions=1536)},
        ),
    ] = None
    category: Annotated[str, VectorStoreRecordDataField()]  # e.g., "favorite_activity", "medication"
    timestamp: Annotated[str, VectorStoreRecordDataField()]  # Stores date-time of memory
