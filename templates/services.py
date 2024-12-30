# services.py

import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
import semantic_kernel.connectors.ai.hugging_face as sk_hf

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

    return kernel

create_kernel()