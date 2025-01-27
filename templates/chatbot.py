import asyncio
from semantic_kernel.functions import KernelArguments
from kernel_manager import setup_kernel
from azure_search_manager import search_memory, store_memory

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

    # **Retrieve previous memories if available**
    memory_results = []
    if "collection" in kernel.services:
        memory_results = await search_memory(kernel, query=user_input)

    # **Incorporate memory into chatbot response**
    if memory_results:
        memory_context = "\nPrevious Memories:\n" + "\n".join(memory_results) + "\n\n"
    else:
        memory_context = ""

    # Invoke the chatbot function with memory context
    try:
        answer = await kernel.invoke(
            chat_function,
            KernelArguments(
                chat_history=chat_history,
                user_input=memory_context + user_input,  # **Inject memory context**
            ),
        )

        # Store the memory for future use
        if "collection" in kernel.services:
            await store_memory(kernel, user_id="user123", memory_text=user_input, category="chat_interaction")

        # Update chat history
        chat_history.add_user_message(user_input)
        chat_history.add_assistant_message(str(answer))

        print(f"Sunny:> {answer}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False
