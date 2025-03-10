import config
import os
import sys
import aiohttp
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from chatbot import initialize_chatbot, process_message, reset_chatbot_state
from qdrant_manager import QdrantManager
from offline_text_to_speech import speak_text_to_bytes
try:
    from azure_text_to_speech import text_to_speech_to_bytes
except ImportError:
    print("Azure speech modules not available. Only offline speech will work.")

config.RUNNING_AS_SERVER = True

_http_client = None
_qdrant_manager = QdrantManager()

def get_http_client():
    global _http_client
    if _http_client is None or _http_client.closed:
        _http_client = aiohttp.ClientSession()
    return _http_client

@asynccontextmanager
async def lifespan(app):
    print("Starting up server...")
    
    if not _qdrant_manager.start_server():
        print("Warning: Failed to start Qdrant server. Vector search may not work.")
    
    await initialize_chatbot()
    
    yield
    
    print("Shutting down server...")
    
    global _http_client
    if _http_client is not None and not _http_client.closed:
        await _http_client.close()
        _http_client = None
    
    _qdrant_manager.stop_server()

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
    model_id: str = "phi3.5:latest"
    use_speech: bool = True
    avatar_type: str = "male"

@app.post("/api/chat")
async def chat(input_data: UserInput):
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
        "avatar_type": getattr(config, 'AVATAR_TYPE', 'male')
    }

@app.post("/api/config")
async def update_config(model_config: ModelConfig, background_tasks: BackgroundTasks):
    """Update model configuration and reinitialize the chatbot"""
    try:
        old_config = config.USE_OLLAMA
        old_model = config.OLLAMA_MODEL_ID if config.USE_OLLAMA else config.AZURE_DEPLOYMENT_NAME
        old_speech = config.USE_SPEECH_OUTPUT
        old_avatar = getattr(config, 'AVATAR_TYPE', 'male')
        
        config.USE_OLLAMA = model_config.use_ollama
        config.USE_SPEECH_OUTPUT = model_config.use_speech
        config.AVATAR_TYPE = model_config.avatar_type

        if model_config.use_ollama:
            valid_models = [model for _, model in config.AVAILABLE_OLLAMA_MODELS.items()]
            if model_config.model_id not in valid_models:
                print(f"Invalid model selected: {model_config.model_id}")
                return {
                    "status": "error", 
                    "message": f"Invalid model: {model_config.model_id}. Available offline models: {', '.join(valid_models)}"
                }
            config.OLLAMA_MODEL_ID = model_config.model_id

        reset_chatbot_state()

        mode = "Offline" if model_config.use_ollama else "Online"
        model_name = model_config.model_id if model_config.use_ollama else config.AZURE_DEPLOYMENT_NAME
        speech_status = "enabled" if model_config.use_speech else "disabled"
        avatar_type = model_config.avatar_type
        
        needs_reinitialization = (
            old_config != model_config.use_ollama or 
            old_model != (model_config.model_id if model_config.use_ollama else config.AZURE_DEPLOYMENT_NAME) or
            old_speech != model_config.use_speech
        )

        avatar_changed = old_avatar != model_config.avatar_type
        avatar_message = f", avatar changed to {avatar_type}" if avatar_changed else ""

        if needs_reinitialization:
            print(f"Configuration changed, reinitializing chatbot: {model_name} ({mode})")
            background_tasks.add_task(initialize_chatbot)
            return {
                "status": "success", 
                "message": f"Configuration updated: {model_name} ({mode} mode), speech {speech_status}{avatar_message}"
            }
        elif avatar_changed:
            print(f"Avatar type changed to {avatar_type}")
            return {
                "status": "success", 
                "message": f"Avatar updated to {avatar_type}, using {model_name} ({mode} mode)"
            }
        else:
            return {
                "status": "info", 
                "message": f"No change needed, using {model_name} ({mode} mode), speech {speech_status}"
            }
    except Exception as e:
        print(f"Error updating configuration: {str(e)}")
        return {
            "status": "error",
            "message": f"Error updating configuration: {str(e)}"
        }

@app.post("/api/text-to-speech")
async def convert_text_to_speech(input_data: UserInput):
    """Convert text to speech and return audio bytes"""
    try:
        from fastapi.responses import Response
        
        if not config.USE_SPEECH_OUTPUT:
            return Response(content=b"", media_type="audio/wav")
        
        if not input_data or not input_data.message or not input_data.message.strip():
            return Response(content=b"", media_type="audio/wav")
        
        avatar_gender = getattr(config, 'AVATAR_TYPE', 'male')
        gender = avatar_gender if avatar_gender in ["male", "female"] else "male"
        
        audio_bytes = None
        
        try:
            if config.USE_OLLAMA:
                audio_bytes = speak_text_to_bytes(input_data.message, gender=gender)
            else:
                audio_bytes = text_to_speech_to_bytes(input_data.message, gender=gender)
                
            if not audio_bytes:
                print("Warning: No audio generated")
                audio_bytes = b""
        except Exception as e:
            print(f"Error in text-to-speech processing: {str(e)}")
            import traceback
            traceback.print_exc()
            audio_bytes = b""
        
        return Response(content=audio_bytes, media_type="audio/wav")
    except Exception as e:
        print(f"Error in text-to-speech endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        from fastapi.responses import Response
        return Response(content=b"", media_type="audio/wav")

