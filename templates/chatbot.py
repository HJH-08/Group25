# chatbot.py
import asyncio
from semantic_kernel.functions import KernelArguments
from kernel_manager import setup_kernel

# Initialize kernel and chatbot
kernel, chat_function, chat_history, model_name = setup_kernel()

async def chat():
    """Handles the chatbot conversation loop."""
    try:
        user_input = input("User:> ").strip()
    except (KeyboardInterrupt, EOFError):
        print("\n\nExiting chat...")
        return False

    if user_input.lower() in ["exit", "quit"]:
        print("\n\nExiting chat...")
        return False

    # Invoke the chatbot function
    try:
        answer = await kernel.invoke(
            chat_function,
            KernelArguments(
                chat_history=chat_history,
                user_input=user_input,
            ),
        )

        # Update chat history
        chat_history.add_user_message(user_input)
        chat_history.add_assistant_message(str(answer))

        print(f"Sunny:> {answer}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False
