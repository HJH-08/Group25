# kernel_manager.py
from semantic_kernel import Kernel
from semantic_kernel.functions import KernelArguments
from semantic_kernel.contents import ChatHistory
from services import initialize_ai_service
from config import SYSTEM_MESSAGE

def setup_kernel():
    """Initialize the kernel and configure the AI service."""
    kernel = Kernel()
    service_id, model_name, kernel = initialize_ai_service(kernel)
    
    # Set execution settings
    settings = kernel.get_prompt_execution_settings_from_service_id(service_id)
    settings.max_tokens = 150
    settings.temperature = 0.7
    settings.top_p = 0.8
    settings.frequency_penalty = 0.5
    settings.presence_penalty = 0.5

    # Register chatbot function
    chat_function = kernel.add_function(
        plugin_name="ChatBot",
        function_name="Chat",
        prompt="{{$chat_history}}{{$user_input}}",
        template_format="semantic-kernel",
        prompt_execution_settings=settings,
    )

    # Initialize chat history
    chat_history = ChatHistory(system_message=SYSTEM_MESSAGE)

    return kernel, chat_function, chat_history, model_name
