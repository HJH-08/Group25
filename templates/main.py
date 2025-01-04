import asyncio
from semantic_kernel import Kernel
from semantic_kernel.contents import ChatHistory
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion, OpenAIChatCompletion
from semantic_kernel.connectors.ai.open_ai import OpenAIChatPromptExecutionSettings
from semantic_kernel.functions import KernelArguments


# Configuration
# Configure your AI service settings here (replace with your actual values)
USE_OPENAI = False  # Set to False if you want to use Azure OpenAI
AZURE_API_KEY = "FYXJqqnHsEJUblXHV5qnZYW43SeUYiY5yy7iQpunOK4HfDQ2CjPGJQQJ99ALACYeBjFXJ3w3AAABACOGbxod"
AZURE_ENDPOINT = "https://team25.openai.azure.com/"
AZURE_DEPLOYMENT_NAME = "gpt-4"
OPENAI_API_KEY = "your_openai_api_key"

# System message
system_message = """
You are a chat bot. Your name is Mosscap and
you have one goal: figure out what people need.
Your full name, should you need to know it, is
Splendid Speckled Mosscap. You communicate
effectively, but you tend to answer with long
flowery prose.
"""

# Initialize chat completion service
if USE_OPENAI:
    chat_completion_service = OpenAIChatCompletion(
        service_id="openai",
        api_key=OPENAI_API_KEY,
        ai_model_id="gpt-3.5-turbo",  # Adjust model ID as needed
    )
    request_settings = OpenAIChatPromptExecutionSettings(
        service_id="openai",
        max_tokens=150,
        temperature=0.7,
        top_p=1.0,
        frequency_penalty=0.5,
        presence_penalty=0.5,
    )
else:
    chat_completion_service = AzureChatCompletion(
        service_id="azure",
        api_key=AZURE_API_KEY,
        deployment_name=AZURE_DEPLOYMENT_NAME,
        endpoint=AZURE_ENDPOINT,
    )
    request_settings = OpenAIChatPromptExecutionSettings(
        service_id="azure",
        max_tokens=150,
        temperature=0.7,
        top_p=1.0,
        frequency_penalty=0.5,
        presence_penalty=0.5,
    )

# Create kernel
kernel = Kernel()

# Add the chat completion service to the kernel
kernel.add_service(chat_completion_service)

# Register the chat function
chat_function = kernel.add_function(
    plugin_name="ChatBot",
    function_name="Chat",
    prompt="{{$chat_history}}{{$user_input}}",
    template_format="semantic-kernel",
)


async def chat() -> bool:
    try:
        user_input = input("User:> ").strip()
    except (KeyboardInterrupt, EOFError):
        print("\n\nExiting chat...")
        return False

    if user_input.lower() in ["exit", "quit"]:
        print("\n\nExiting chat...")
        return False

    # Prepare chat history
    chat_history = ChatHistory(system_message=system_message)
    chat_history.add_user_message(user_input)

    # Wrap input in KernelArguments
    kernel_arguments = KernelArguments(
        chat_history=chat_history,
        user_input=user_input,
    )

    # Invoke the kernel function
    try:
        answer = await kernel.invoke(
            plugin_name="ChatBot",
            function_name="Chat",
            arguments=kernel_arguments,
        )
        if answer:
            print(f"Mosscap:> {answer}")
            return True
    except Exception as e:
        print(f"Error: {e}")
        return False


async def main() -> None:
    print("Welcome to your Companion Chatbot!")
    print("Type 'exit' or 'quit' to stop.\n")
    chatting = True
    while chatting:
        chatting = await chat()


if __name__ == "__main__":
    asyncio.run(main())
