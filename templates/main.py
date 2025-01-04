import asyncio
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion, OpenAIChatCompletion
from semantic_kernel.connectors.ai.open_ai import OpenAIChatPromptExecutionSettings
from semantic_kernel.contents import ChatHistory

# Configure your AI service settings here (replace with your actual values)
USE_OPENAI = False  # Set to False if you want to use Azure OpenAI
AZURE_API_KEY = "fake key"
AZURE_ENDPOINT = "https://team25.openai.azure.com/"
AZURE_DEPLOYMENT_NAME = "gpt-4"
OPENAI_API_KEY = "your_openai_api_key"

# This is the system message that gives the chatbot its personality.
system_message = """
You are a chat bot. Your name is Mosscap and
you have one goal: figure out what people need.
Your full name, should you need to know it, is
Splendid Speckled Mosscap. You communicate
effectively, but you tend to answer with long
flowery prose.
"""

# Chat completion service setup
if USE_OPENAI:
    # Configure OpenAI Chat Completion
    chat_completion_service = OpenAIChatCompletion(
        service_id="openai",
        api_key=OPENAI_API_KEY,
        ai_model_id="gpt-3.5-turbo",
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
    # Configure Azure OpenAI Chat Completion
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

# Create a chat history object with the system message
chat_history = ChatHistory(system_message=system_message)


async def chat() -> bool:
    try:
        user_input = input("User:> ")
    except (KeyboardInterrupt, EOFError):
        print("\n\nExiting chat...")
        return False

    if user_input.lower() in ["exit", "quit"]:
        print("\n\nExiting chat...")
        return False

    # Add the user message to the chat history so that the chatbot can respond
    chat_history.add_user_message(user_input)

    try:
        # Get the chat message content from the chat completion service
        response = await chat_completion_service.get_chat_message_content(
            chat_history=chat_history,
            settings=request_settings,
        )

        if response:
            print(f"Mosscap:> {response}")
            # Add the response to the chat history
            chat_history.add_message(response)
    except Exception as e:
        print(f"Error during chat: {e}")

    return True


async def main() -> None:
    # Start the chat loop
    chatting = True
    print("Welcome to your Companion Chatbot!")
    print("This chatbot provides friendly conversation.")
    print("Type 'exit' or 'quit' to stop.\n")
    while chatting:
        chatting = await chat()


if __name__ == "__main__":
    asyncio.run(main())
