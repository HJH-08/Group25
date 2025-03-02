import asyncio

from semantic_kernel.functions import KernelArguments
from semantic_kernel.contents import AuthorRole
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from kernel_manager import setup_kernel
from azure_search_manager import search_memory, store_memory
from qdrant_search_manager import search_memory_local, store_memory_local
import config
from offline_memory import load_chat_history, save_chat_history
from semantic_kernel.contents import ChatHistoryTruncationReducer

# Import speech-to-text conditionally based on runtime mode
if not config.RUNNING_AS_SERVER:
    # CLI mode - import full functionality
    if not config.USE_OLLAMA and config.USE_SPEECH_INPUT:
        from azure_speech_to_text import speech_to_text
    if config.USE_OLLAMA and config.USE_SPEECH_INPUT:
        from offline_speech_to_text import offline_speech_to_text
else:
    # Server mode - import stubs or define dummy functions
    def speech_to_text():
        print("Speech-to-text not available in server mode")
        return None, False
        
    def offline_speech_to_text():
        print("Speech-to-text not available in server mode")
        return None, False

# Import text-to-speech for all runtimes
if not config.USE_OLLAMA and config.USE_SPEECH_OUTPUT:
    from azure_text_to_speech import text_to_speech
if config.USE_OLLAMA and config.USE_SPEECH_OUTPUT:
    from offline_text_to_speech import speak_text
    
# Don't run setup_kernel() immediately
kernel = None
chat_function = None
chat_history = None
model_name = None

# Initialize the chat history as truncation reducer
truncation_reducer = ChatHistoryTruncationReducer(target_count=10)

async def initialize_chatbot():
    """Initialize the chatbot lazily when needed."""
    global kernel, chat_function, model_name
    if kernel is None:
        kernel, chat_function, model_name = await setup_kernel()
        print("Welcome to your Companion Chatbot!")
        print(f"Currently using {model_name}.")
        if not config.USE_SPEECH_INPUT:
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
        if not config.USE_OLLAMA and config.USE_SPEECH_INPUT:
            user_input, exit_program = speech_to_text()
            if exit_program:
                print("\n👋 Exiting the chatbot. Goodbye!")
                return False  # Exit the chatbot loop
        elif config.USE_OLLAMA and config.USE_SPEECH_INPUT:
            user_input, exit_program = offline_speech_to_text()
            if exit_program:
                print("\n👋 Exiting the chatbot. Goodbye!")
                return False  # Exit the chatbot loop
        else:
            user_input = input("User:> ").strip()

        if not user_input:
            print("No input detected. Please try again.")
            return True

        user_input = user_input.replace("stop listening", "").strip()
        
    except (KeyboardInterrupt, EOFError):
        print("\n\nExiting chat...")
        return False

    if user_input.lower() in ["exit", "quit"]:
        print("\n\nExiting chat...")
        return False

    # Add the user message to the truncation reducer and reduce the chat history if needed
    truncation_reducer.add_user_message(user_input)
    await truncation_reducer.reduce()

    # **Retrieve previous memories if available**
    memory_results = []
    if "collection" in kernel.services:
        memory_results = await search_memory(kernel, query=user_input)
    elif "qdrant_client" in kernel.services:
        memory_results = await search_memory_local(kernel, query=user_input)

    # **Update the chat history with past memories (if available)**
    if memory_results:
        past_memory = "\n\n[Past Memories that MAY be useful]:\n" + "\n".join(memory_results) + "\n"
    else:
        past_memory = ""

    # **Invoke the chatbot function**
    try:
        answer = ""
        first_chunk = True  # Track whether it's the first chunk
        async for chunk in kernel.invoke_stream(
            chat_function, 
            KernelArguments(
                truncation_reducer=truncation_reducer,
                user_input=user_input,
                past_memory=past_memory,
                system_message = config.SYSTEM_MESSAGE
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
                if not (config.USE_OLLAMA and config.USE_SPEECH_OUTPUT):
                    print(new_text, end="", flush=True)
                answer += new_text
                
            
        if not config.USE_OLLAMA and config.USE_SPEECH_OUTPUT:
            text_to_speech(answer)  # Process full response at once
            

        if config.USE_OLLAMA and config.USE_SPEECH_OUTPUT:
            print(answer)
            speak_text(text=answer)
            

        """ To artificially slow down streaming (optional), comment/uncomment the following line: """
        # await asyncio.sleep(0.1)
        
        print()

        # Add the assistant message to the truncation reducer
        truncation_reducer.add_assistant_message(answer)

        # Categorise the input 
        category = categorize_input(user_input)
        
        # Only store past memories if the input is not a question
        if category != "question":
            if "collection" in kernel.services:
                await store_memory(kernel, user_id=config.USER_ID, memory_text=user_input, category=category)
            elif "qdrant_client" in kernel.services:
                await store_memory_local(kernel, user_id=config.USER_ID, memory_text=user_input, category=category)

        # ✅ Save new chat history **only for Ollama**
#         if USE_OLLAMA:
#             chat_history.add_user_message(user_input)
#             chat_history.add_assistant_message(str(answer))
#             save_chat_history(USER_ID, [chat_history.messages[-2], chat_history.messages[-1]])

    except Exception as e:
        print(f"Error: {e}")
        return False

    return True  # Return after processing the entire message

async def process_message(user_input: str) -> str:
    """Process a single message and return the response as a string.
    This function is designed for API integration."""
    
    await initialize_chatbot()
    
    if not user_input:
        return "No input detected. Please try again."
    
    # Add the user message to the truncation reducer
    truncation_reducer.add_user_message(user_input)
    await truncation_reducer.reduce()

    # Retrieve previous memories if available
    memory_results = []
    if "collection" in kernel.services:
        memory_results = await search_memory(kernel, query=user_input)
    elif "qdrant_client" in kernel.services:
        memory_results = await search_memory_local(kernel, query=user_input)

    # Update with past memories (if available)
    if memory_results:
        past_memory = "\n\n[Past Memories that MAY be useful]:\n" + "\n".join(memory_results) + "\n"
    else:
        past_memory = ""

    # Process the message
    try:
        answer = ""
        async for chunk in kernel.invoke_stream(
            chat_function, 
            KernelArguments(
                truncation_reducer=truncation_reducer,
                user_input=user_input,
                past_memory=past_memory,
                system_message=config.SYSTEM_MESSAGE
            )
        ):
            if not isinstance(chunk, list):
                continue

            for msg in chunk:
                if not (hasattr(msg, "items") and msg.items):
                    continue
                    
                new_text = msg.items[0].text
                answer += new_text

        # Add the assistant message to the truncation reducer
        truncation_reducer.add_assistant_message(answer)

        # Categorize and store memories if needed
        category = categorize_input(user_input)
        if category != "question":
            if "collection" in kernel.services:
                await store_memory(kernel, user_id=config.USER_ID, memory_text=user_input, category=category)
            elif "qdrant_client" in kernel.services:
                await store_memory_local(kernel, user_id=config.USER_ID, memory_text=user_input, category=category)

        return answer

    except Exception as e:
        return f"Error processing message: {str(e)}"
    
def reset_chatbot_state():
    """Reset the chatbot's global state variables to force reinitialization."""
    global kernel, chat_function, model_name
    kernel = None
    chat_function = None
    model_name = None
    # Reset the truncation reducer too to start a fresh conversation
    global truncation_reducer
    truncation_reducer = ChatHistoryTruncationReducer(target_count=10)