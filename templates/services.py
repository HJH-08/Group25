# services.py
from openai import AsyncOpenAI
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion, AzureChatCompletion
from config import USE_OLLAMA, OLLAMA_BASE_URL, OLLAMA_MODEL_ID, AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT_NAME

def get_chat_service(kernel):
    """Initialize and add the AI chat service to the kernel."""
    
    if USE_OLLAMA:
        service_id = "local-gpt"
        openAIClient = AsyncOpenAI(
            api_key="key",  # Ollama requires a dummy key
            base_url=OLLAMA_BASE_URL,
        )
        chat_service = OpenAIChatCompletion(
            service_id=service_id,
            ai_model_id=OLLAMA_MODEL_ID,
            async_client=openAIClient,
        )
        model_name = f"Ollama Model: {OLLAMA_MODEL_ID}"

    else:
        service_id = "azure"
        chat_service = AzureChatCompletion(
            service_id=service_id,
            api_key=AZURE_API_KEY,
            deployment_name=AZURE_DEPLOYMENT_NAME,
            endpoint=AZURE_ENDPOINT,
        )
        model_name = f"Azure OpenAI Model: {AZURE_DEPLOYMENT_NAME}"

    kernel.add_service(chat_service)
    return service_id, model_name
