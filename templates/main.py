# main.py

import asyncio
from chatbot import chat
from kernel_manager import setup_kernel  # Import the function, not model_name directly

async def main():
    chatting = True
    while chatting:
        chatting = await chat()

if __name__ == "__main__":
    asyncio.run(main())
