import asyncio

from semantic_kernel import Kernel
from semantic_kernel.connectors.ai.open_ai import OpenAIChatCompletion, AzureChatCompletion
from semantic_kernel.contents import ChatHistory
from semantic_kernel.functions import KernelArguments

# Configuration
USE_OLLAMA = True
OLLAMA_BASE_URL = "http://localhost:11434/v1"
OLLAMA_MODEL_ID = "phi3:latest" 
AZURE_API_KEY = "MY_AZURE_API_KEY"
AZURE_ENDPOINT = "https://team25.openai.azure.com/"
AZURE_DEPLOYMENT_NAME = "gpt-4"

# System message
system_message = """
You are a kind and caring chatbot designed to provide companionship and support for elderly users, including those experiencing memory issues or dementia.
Your name is Sunny, and you have one goal: to bring warmth, understanding, and gentle companionship to those who need it.
You are patient, empathetic, and adapt your responses to make conversations easy and enjoyable.
Speak in a simple, warm tone and always make the user feel valued and understood.
"""

# Create kernel
kernel = Kernel()

# Configure services
if USE_OLLAMA:
    from openai import AsyncOpenAI
    service_id = "local-gpt"
    openAIClient = AsyncOpenAI(
        api_key="key",  # This cannot be an empty string, use a fake key
        base_url=OLLAMA_BASE_URL,
    )
    kernel.add_service(
        OpenAIChatCompletion(
            service_id=service_id,
            ai_model_id=OLLAMA_MODEL_ID,
            async_client=openAIClient,
        )
    )
    model_name = f"Ollama Model: {OLLAMA_MODEL_ID}"

else:
    kernel.add_service(
        AzureChatCompletion(
            service_id="azure",
            api_key=AZURE_API_KEY,
            deployment_name=AZURE_DEPLOYMENT_NAME,
            endpoint=AZURE_ENDPOINT,
        )
    )
    model_name = f"Azure OpenAI Model: {AZURE_DEPLOYMENT_NAME}"
    service_id = "azure"

# Prompt execution settings
settings = kernel.get_prompt_execution_settings_from_service_id(service_id)
settings.max_tokens = 150
settings.temperature = 0.7
settings.top_p = 0.8
settings.frequency_penalty = 0.5
settings.presence_penalty = 0.5

# Register the chat function
chat_function = kernel.add_function(
    plugin_name="ChatBot",
    function_name="Chat",
    prompt="{{$chat_history}}{{$user_input}}",
    template_format="semantic-kernel",
    prompt_execution_settings=settings,
)

# Initialize chat history
chat_history = ChatHistory(system_message=system_message)


async def chat() -> bool:
    try:
        user_input = input("User:> ").strip()
    except (KeyboardInterrupt, EOFError):
        print("\n\nExiting chat...")
        return False

    if user_input.lower() in ["exit", "quit"]:
        print("\n\nExiting chat...")
        return False

    # Invoke the kernel function
    try:
        answer = await kernel.invoke(
            chat_function,
            KernelArguments(
                chat_history=chat_history,
                user_input=user_input,
            ),
        )
        # Update the chat history
        chat_history.add_user_message(user_input)
        chat_history.add_assistant_message(str(answer))

        print(f"Sunny:> {answer}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


async def main() -> None:
    print("Welcome to your Companion Chatbot!")
    print(f"Currently using {model_name}.")
    print("Type 'exit' or 'quit' to stop.\n")
    chatting = True
    while chatting:
        chatting = await chat()


if __name__ == "__main__":
    asyncio.run(main())
