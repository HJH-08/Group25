import config
import os
import sys
import aiohttp
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import the chatbot functionality
from chatbot import initialize_chatbot, process_message, reset_chatbot_state

# Import Qdrant manager
from qdrant_manager import QdrantManager

# Import text-to-speech functionality
from offline_text_to_speech import speak_text_to_bytes
try:
    from azure_text_to_speech import text_to_speech_to_bytes
except ImportError:
    print("Azure speech modules not available. Only offline speech will work.")

# Set the server flag to True
config.RUNNING_AS_SERVER = True

# Add session management 
_http_client = None
_qdrant_manager = QdrantManager()

def get_http_client():
    global _http_client
    if _http_client is None or _http_client.closed:
        _http_client = aiohttp.ClientSession()
    return _http_client

@asynccontextmanager
async def lifespan(app):
    # Startup: Initialize resources
    print("Starting up server...")
    
    # Start Qdrant server first
    if not _qdrant_manager.start_server():
        print("Warning: Failed to start Qdrant server. Vector search may not work.")
    
    # Initialize the chatbot after Qdrant is ready
    await initialize_chatbot()
    
    yield
    
    # Shutdown: Clean up resources when server stops
    print("Shutting down server, cleaning up resources...")
    
    # Close the HTTP client if it exists
    global _http_client
    if _http_client is not None and not _http_client.closed:
        await _http_client.close()
        _http_client = None
    
    # Terminate Qdrant server if running
    _qdrant_manager.stop_server()
    
    # Close any other resources
    print("Resources cleaned up successfully")

# Create the app with lifespan manager
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    message: str
    gender: str = "male"

class ModelConfig(BaseModel):
    use_ollama: bool
    model_id: str = "phi3.5:latest"  # Default to Phi3
    use_speech: bool = True  # Field for speech toggle
    avatar_type: str = "male"  # New field for avatar selection

@app.post("/api/chat")
async def chat(input_data: UserInput):
    # Process the user message through the chatbot
    response = await process_message(input_data.message)
    return {"response": response}

@app.get("/api/config")
async def get_config():
    """Get current configuration"""
    return {
        "use_ollama": config.USE_OLLAMA,
        "current_model": config.OLLAMA_MODEL_ID if config.USE_OLLAMA else config.AZURE_DEPLOYMENT_NAME,
        "available_models": {
            "offline": list(config.AVAILABLE_OLLAMA_MODELS.items()),
            "online": [config.AZURE_DEPLOYMENT_NAME]
        },
        "use_speech_output": config.USE_SPEECH_OUTPUT,
        "avatar_type": getattr(config, 'AVATAR_TYPE', 'male')  # Add avatar type to response
    }

@app.post("/api/config")
async def update_config(model_config: ModelConfig, background_tasks: BackgroundTasks):
    """Update model configuration and reinitialize the chatbot"""
    try:
        # Update configuration values
        old_config = config.USE_OLLAMA
        old_model = config.OLLAMA_MODEL_ID if config.USE_OLLAMA else config.AZURE_DEPLOYMENT_NAME
        old_speech = config.USE_SPEECH_OUTPUT
        old_avatar = getattr(config, 'AVATAR_TYPE', 'male')
        
        # Update settings
        config.USE_OLLAMA = model_config.use_ollama
        config.USE_SPEECH_OUTPUT = model_config.use_speech
        
        # Add support for avatar_type
        config.AVATAR_TYPE = model_config.avatar_type

        if model_config.use_ollama:
            # Validate that the model is in our available models list
            valid_models = [model for _, model in config.AVAILABLE_OLLAMA_MODELS.items()]
            if model_config.model_id not in valid_models:
                return {
                    "status": "error", 
                    "message": f"Invalid model: {model_config.model_id}. Available offline models: {', '.join(valid_models)}"
                }
            config.OLLAMA_MODEL_ID = model_config.model_id

        # Reset chatbot internal state
        reset_chatbot_state()

        # Determine mode/message for response
        mode = "Offline" if model_config.use_ollama else "Online"
        model_name = model_config.model_id if model_config.use_ollama else config.AZURE_DEPLOYMENT_NAME
        speech_status = "enabled" if model_config.use_speech else "disabled"
        avatar_type = model_config.avatar_type
        
        # Check if we're changing mode, model, or speech settings
        needs_reinitialization = (
            old_config != model_config.use_ollama or 
            old_model != (model_config.model_id if model_config.use_ollama else config.AZURE_DEPLOYMENT_NAME) or
            old_speech != model_config.use_speech
        )

        # Add info about avatar change to response
        avatar_changed = old_avatar != model_config.avatar_type
        avatar_message = f", avatar changed to {avatar_type}" if avatar_changed else ""

        if needs_reinitialization:
            # Schedule reinitialization in background to allow response to be sent first
            background_tasks.add_task(initialize_chatbot)
            return {
                "status": "success", 
                "message": f"Configuration updated: {model_name} ({mode} mode), speech {speech_status}{avatar_message}"
            }
        else:
            # Even if only avatar changed, we don't need to reinitialize the chatbot
            if avatar_changed:
                return {
                    "status": "success", 
                    "message": f"Avatar updated to {avatar_type}, using {model_name} ({mode} mode)"
                }
            else:
                # If no change at all
                return {
                    "status": "info", 
                    "message": f"No change needed, using {model_name} ({mode} mode), speech {speech_status}"
                }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error updating configuration: {str(e)}"
        }

# For text-to-speech
@app.post("/api/text-to-speech")
async def convert_text_to_speech(input_data: UserInput):
    """Convert text to speech and return audio bytes"""
    try:
        # Check if speech is disabled in settings
        if not config.USE_SPEECH_OUTPUT:
            print("Speech output is disabled in settings, returning empty audio")
            from fastapi.responses import Response
            return Response(content=b"", media_type="audio/wav")
        
        # Validate input
        if not input_data or not input_data.message or not input_data.message.strip():
            print("Empty message received for text-to-speech")
            from fastapi.responses import Response
            return Response(content=b"", media_type="audio/wav")
        
        # Ensure gender is strictly "male" or "female", defaulting to "female"
        gender = input_data.gender if input_data.gender in ["male", "female"] else "female"

        # Generate audio from text - use current config value
        current_use_ollama = config.USE_OLLAMA
        audio_bytes = None
        
        try:
            if current_use_ollama:
                print("Using OLLAMA for text-to-speech")
                audio_bytes = speak_text_to_bytes(input_data.message, gender=gender)
            else:
                print("Using Azure for text-to-speech")
                audio_bytes = text_to_speech_to_bytes(input_data.message, gender=gender)
                
            # Make absolutely sure we have valid audio data
            if not audio_bytes:
                print("Warning: Audio output is empty")
                audio_bytes = b""  # Ensure we have at least empty bytes
            elif len(audio_bytes) < 100:
                print(f"Warning: Audio output is very small ({len(audio_bytes)} bytes)")
                # But we'll still return it
        except Exception as tts_error:
            print(f"Error generating speech: {str(tts_error)}")
            import traceback
            traceback.print_exc()
            audio_bytes = b""  # Return empty audio on failure
            
        # Return audio as a regular response
        from fastapi.responses import Response
        return Response(
            content=audio_bytes,
            media_type="audio/wav"
        )
    except Exception as e:
        print(f"Error in text-to-speech endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return empty audio rather than an error response
        from fastapi.responses import Response
        return Response(
            content=b"",
            media_type="audio/wav" 
        )

