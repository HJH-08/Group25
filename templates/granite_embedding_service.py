from typing import List, Any
import numpy as np
import torch
from pydantic import Field
from transformers import AutoModel, AutoTokenizer
from semantic_kernel.connectors.ai.embeddings.embedding_generator_base import EmbeddingGeneratorBase
from semantic_kernel.connectors.ai.prompt_execution_settings import PromptExecutionSettings

class GraniteEmbeddingService(EmbeddingGeneratorBase):
    """A service that generates text embeddings using the Granite model."""

    service_id: str
    ai_model_id: str
    device: str = Field(default="cpu", exclude=True)

    def __init__(
        self,
        service_id: str,
        ai_model_id: str = "ibm-granite/granite-embedding-30m-english",
        device: str = "cpu",
    ):
        """Initialize the Granite embedding service with service_id and ai_model_id."""
        super().__init__(service_id=service_id, ai_model_id=ai_model_id)
        object.__setattr__(self, "device", device)
        object.__setattr__(self, "tokenizer", AutoTokenizer.from_pretrained(ai_model_id))
        object.__setattr__(
            self, "model", AutoModel.from_pretrained(ai_model_id).to(self.device)
        )

    def generate_embedding(self, text: str) -> np.ndarray:
        """Generate a single text embedding as a NumPy array."""
        tokens = self.tokenizer(
            text, return_tensors="pt", padding=True, truncation=True
        ).to(self.device)
        with torch.no_grad():
            output = self.model(**tokens)
        return output.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()

    async def generate_embeddings(
        self,
        texts: List[str],
        settings: "PromptExecutionSettings | None" = None,
        **kwargs: Any,
    ) -> np.ndarray:
        """Returns embeddings for the given texts as an ndarray (expected by Semantic Kernel)."""
        embeddings = [self.generate_embedding(text) for text in texts]
        return np.array(embeddings)

    async def generate_raw_embeddings(
        self,
        texts: List[str],
        settings: "PromptExecutionSettings | None" = None,
        **kwargs: Any,
    ) -> Any:
        """Returns embeddings in raw format (fallbacks to `generate_embeddings`)."""
        return await self.generate_embeddings(texts, settings, **kwargs)