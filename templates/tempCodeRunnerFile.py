# main.py

import asyncio
from chatbot import chat
from kernel_manager import setup_kernel  # Import the function, not model_name directly

async def main():
    _, _, _, model_name = setup_kernel()  # Retrieve model_name from function
    print("Welcome to your Companion Chatbot!")
    print(f"Currently using {model_name}.")
    print("Type 'exit' or 'quit' to stop.\n")

    chatting = True
    while chatting:
        chatting = await chat()

if __name__ == "__main__":
    asyncio.run(main())
