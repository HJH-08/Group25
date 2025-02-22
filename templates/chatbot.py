import asyncio

from semantic_kernel.functions import KernelArguments
from semantic_kernel.contents import AuthorRole
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from kernel_manager import setup_kernel
from azure_search_manager import search_memory, store_memory
from qdrant_search_manager import search_memory_local, store_memory_local
from config import USER_ID, USE_OLLAMA, USE_SPEECH_INPUT, USE_SPEECH_OUTPUT
from offline_memory import load_chat_history, save_chat_history
#from offline_speech_to_text import offline_speech_to_text


# Import speech-to-text only if Azure is used
if not USE_OLLAMA and USE_SPEECH_INPUT:
    from azure_speech_to_text import speech_to_text
if not USE_OLLAMA and USE_SPEECH_OUTPUT:
    from azure_text_to_speech import text_to_speech
if USE_OLLAMA and USE_SPEECH_OUTPUT:
    from offline_text_to_speech import speak_text
if USE_OLLAMA and USE_SPEECH_INPUT:
    from offline_speech_to_text import offline_speech_to_text
    
# Don't run setup_kernel() immediately
kernel = None
chat_function = None
chat_history = None
model_name = None

async def initialize_chatbot():
    """Initialize the chatbot lazily when needed."""
    global kernel, chat_function, chat_history, model_name
    if kernel is None:
        kernel, chat_function, chat_history, model_name = await setup_kernel()
        print("Welcome to your Companion Chatbot!")
        print(f"Currently using {model_name}.")
        if not USE_SPEECH_INPUT:
            print("Type 'exit' or 'quit' to stop.\n")

def categorize_input(user_input):
    """Classify the type of input dynamically."""
    user_input_lower = user_input.lower()

    # If it contains a question mark, assume it's a question
    if "?" in user_input_lower:
        return "question"

    # If it mentions preferences, assume it's a preference
    if any(word in user_input_lower for word in ["like", "love", "enjoy", "favorite", "prefer"]):
        return "preference"

    # Otherwise, treat it as a general conversation
    return "chat_interaction"

async def chat():
    """Handles the chatbot conversation loop."""
    await initialize_chatbot()
    try:
        if not USE_OLLAMA and USE_SPEECH_INPUT:
            user_input, exit_program = speech_to_text()
            if exit_program:
                print("\n👋 Exiting the chatbot. Goodbye!")
                return False  # Exit the chatbot loop
        elif USE_OLLAMA and USE_SPEECH_INPUT:
            user_input, exit_program = offline_speech_to_text()
            if exit_program:
                print("\n👋 Exiting the chatbot. Goodbye!")
                return False  # Exit the chatbot loop
        else:
            user_input = input("User:> ").strip()

        if not user_input:
            print("No input detected. Please try again.")
            return True
        
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
    elif "collection_local" in kernel.services:
        memory_results = await search_memory_local(kernel, query=user_input)

    # **Update the chat history with past memories (if available)**
    if memory_results:
        past_memory = "\n\n[Past Memories that MAY be useful]:\n" + "\n".join(memory_results) + "\n"
        chat_history.add_system_message(past_memory)
    else:
        past_memory = ""

    # **Invoke the chatbot function**
    try:
        answer = ""
        async for chunk in kernel.invoke_stream(
            chat_function, 
            KernelArguments(
                chat_history=chat_history, user_input=user_input
                )
        ):
            if not isinstance(chunk, list):
                continue

            for msg in chunk:
                if not (hasattr(msg, "items") and msg.items):
                    continue

                new_text = msg.items[0].text
                if answer == "":
                    print("Companio:> ", end="", flush=True)
                if not (USE_OLLAMA and USE_SPEECH_OUTPUT):
                    print(new_text, end="", flush=True)
                answer += new_text
            
        if not USE_OLLAMA and USE_SPEECH_OUTPUT:
            text_to_speech(answer)  # Process full response at once
            

        if USE_OLLAMA and USE_SPEECH_OUTPUT:
            speak_text(text=answer)
            print("Companio:> " + answer)

        """ To artificially slow down streaming (optional), comment/uncomment the following line: """
        # await asyncio.sleep(0.1)

        print()

        category = categorize_input(user_input)
        
        # Store the memory for future use
        if "collection" in kernel.services:
            await store_memory(kernel, user_id=USER_ID, memory_text=user_input, category=category)
        elif "collection_local" in kernel.services:
            await store_memory_local(kernel, user_id=USER_ID, memory_text=user_input, category=category)

        # # ✅ Save new chat history **only for Ollama**
        if USE_OLLAMA:
            chat_history.add_user_message(user_input)
            chat_history.add_assistant_message(str(answer))
            save_chat_history(USER_ID, [chat_history.messages[-2], chat_history.messages[-1]])
            
    except Exception as e:
        print(f"Error: {e}")
        return False

    return True