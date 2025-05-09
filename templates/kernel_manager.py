# kernel_manager.py
from semantic_kernel import Kernel
from semantic_kernel.functions import KernelArguments
from semantic_kernel.contents import ChatHistory
from services import initialize_ai_service
from config import SYSTEM_MESSAGE, USER_ID, USE_OLLAMA
from semantic_kernel.contents import AuthorRole
from offline_memory import load_chat_history

async def setup_kernel():
    """Initialize the kernel and configure the AI service."""
    kernel = Kernel()
    service_id, model_name, kernel = await initialize_ai_service(kernel)
    
    # Set execution settings
    settings = kernel.get_prompt_execution_settings_from_service_id(service_id)
    settings.max_tokens = 256
    settings.temperature = 0.7
    settings.top_p = 0.8
    settings.frequency_penalty = 0.5
    settings.presence_penalty = 0.5

    # Register chatbot function
    chat_function = kernel.add_function(
        plugin_name="ChatBot",
        function_name="Chat",
        prompt="""
        <<INSTRUCTIONS>>
        This is a conversation between you, a kind AI companion, and a user.
        A description of who you are and how you should behave:
        {{ $system_message }}

        Use the chat history to maintain context and provide relevant responses:
        {{ $truncation_reducer }}
        
        Use past memory to recall relevant past conversation, only use when necessary and related to the current conversation:
        {{ $past_memory }}

        **STRICT INSTRUCTION:**  
        - **DO NOT assume relationships between unrelated topics unless the user explicitly requests a connection.**  
        - **DO NOT blend or mix topics from past memory or chat history unless directly relevant.**  
        - **If the user switches topics, treat it as a new, separate conversation.**  
        - **Only respond to the user message and nothing else. DO NOT create information unless from past memory or chat history.**
        - **Keep responses 2-3 sentences max unless asked for more.**
        <<END INSTUCTIONS>>

        Current user message:
        {{ $user_input }}

        **Your Response:**  
        """,
        template_format="semantic-kernel",
        prompt_execution_settings=settings,
    )

    # Initialize chat history
    # chat_history = ChatHistory(system_message=SYSTEM_MESSAGE)

    # **Load past chat history only for Ollama**

    # if USE_OLLAMA:
    #     # Load previous chat history from JSON
    #     past_chat = load_chat_history(USER_ID)
    #     for msg in past_chat.messages:
    #         if msg.role == AuthorRole.USER:
    #             chat_history.add_user_message(msg.content)
    #         elif msg.role == AuthorRole.ASSISTANT:
    #             chat_history.add_assistant_message(msg.content)
    #         elif msg.role == AuthorRole.SYSTEM:
    #             chat_history.add_system_message(msg.content)


    return kernel, chat_function, model_name