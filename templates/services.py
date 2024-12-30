# services.py

import semantic_kernel as sk
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.connectors.ai.hugging_face import HuggingFaceTextCompletion

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
    azure_config = {
        "deployment_name": AZURE_OPENAI_DEPLOYMENT_NAME,
        "api_key": AZURE_OPENAI_API_KEY,
        "endpoint": AZURE_OPENAI_ENDPOINT
    }
    azure_chat = AzureChatCompletion(**azure_config)
    kernel.add_chat_service("azure-gpt", azure_chat)

    # ----- Hugging Face text completion -----
    hf_text_completion = HuggingFaceTextCompletion(
        model_id=HUGGING_FACE_MODEL_ID,
        task=HUGGING_FACE_TASK
    )
    kernel.add_text_completion_service("hf-gpt2", hf_text_completion)

    return kernel
