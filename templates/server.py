import config

# Set the server flag to True
config.RUNNING_AS_SERVER = True

from fastapi import FastAPI, BackgroundTasks, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
import aiohttp
from contextlib import asynccontextmanager

# Import the chatbot functionality
from chatbot import initialize_chatbot, process_message, reset_chatbot_state

# Import only text-to-speech functionality
from offline_text_to_speech import speak_text_to_bytes
try:
    from azure_text_to_speech import text_to_speech_to_bytes
except ImportError:
    print("Azure speech modules not available. Only offline speech will work.")

# Add session management 
_http_client = None

def get_http_client():
    global _http_client
    if _http_client is None or _http_client.closed:
        _http_client = aiohttp.ClientSession()
    return _http_client

@asynccontextmanager
async def lifespan(app):
    # Startup: Initialize resources
    print("Starting up server...")
    
    # Create any shared resources here
    await initialize_chatbot()
    
    yield
    
    # Shutdown: Clean up resources when server stops
    print("Shutting down server, cleaning up resources...")
    
    # Close the HTTP client if it exists
    global _http_client
    if _http_client is not None and not _http_client.closed:
        await _http_client.close()
        _http_client = None
    
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

class ModelConfig(BaseModel):
    use_ollama: bool
    model_id: str = "phi3.5:latest"  # Default to Phi3

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
        }
    }

@app.post("/api/config")
async def update_config(model_config: ModelConfig, background_tasks: BackgroundTasks):
    """Update model configuration and reinitialize the chatbot"""
    try:
        # Update configuration values
        old_config = config.USE_OLLAMA
        old_model = config.OLLAMA_MODEL_ID if config.USE_OLLAMA else config.AZURE_DEPLOYMENT_NAME
        
        config.USE_OLLAMA = model_config.use_ollama

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
        
        # Check if we're changing mode or just model within the same mode
        needs_reinitialization = old_config != model_config.use_ollama or old_model != (model_config.model_id if model_config.use_ollama else config.AZURE_DEPLOYMENT_NAME)

        if needs_reinitialization:
            # Schedule reinitialization in background to allow response to be sent first
            background_tasks.add_task(initialize_chatbot)
            return {
                "status": "success", 
                "message": f"Configuration updated, switching to {model_name} ({mode} mode)"
            }
        else:
            # If no change, don't reinitialize
            return {
                "status": "info", 
                "message": f"No change needed, already using {model_name} ({mode} mode)"
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
        # Generate audio from text - use current config value
        current_use_ollama = config.USE_OLLAMA
        
        if current_use_ollama:
            print("Using OLLAMA for text-to-speech")
            audio_bytes = speak_text_to_bytes(input_data.message)
        else:
            print("Using Azure for text-to-speech")
            audio_bytes = text_to_speech_to_bytes(input_data.message)
        
        if not audio_bytes or len(audio_bytes) < 100:
            print(f"Warning: Audio output is empty or very small ({len(audio_bytes) if audio_bytes else 0} bytes)")
            
        # Return audio as a regular response instead of streaming
        from fastapi.responses import Response
        return Response(
            content=audio_bytes,
            media_type="audio/wav"
        )
    except Exception as e:
        print(f"Error in text-to-speech endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
