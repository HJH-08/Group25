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
class ElderlyUserMemoryLocal(BaseModel):
    id: Annotated[str, VectorStoreRecordKeyField]  # Unique User ID
    memory_text: Annotated[
        str,
        VectorStoreRecordDataField(
            has_embedding=True, embedding_property_name="vector", is_full_text_searchable=True
        ),
    ]
    vector: Annotated[
        list[float] | None,
        VectorStoreRecordVectorField(
            dimensions=384,
            local_embedding=True,
            embedding_settings={"embedding": OpenAIEmbeddingPromptExecutionSettings(dimensions=384)},
        ),
    ] = None
    category: Annotated[str, VectorStoreRecordDataField()]  # e.g., "favorite_activity", "medication"
    timestamp: Annotated[str, VectorStoreRecordDataField()]  # Stores date-time of memory
    
    @classmethod
    def from_dict(cls, data: dict) -> "ElderlyUserMemoryLocal":
        """
        Implements the FromDictMethodProtocol.
        This method is invoked when deserializing a record.
        It extracts nested fields from 'payload' into the top-level dictionary.
        """
        payload = data.get("payload")
        if isinstance(payload, dict):
            # Merge the payload into the top-level dictionary
            # (In case of key conflicts, payload values will override top-level ones.)
            data = {**data, **payload}
        # Use Pydantic’s built-in validation to create the model instance.
        return cls.model_validate(data)
