from fastapi import FastAPI, Depends, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
import sys
import importlib
import config

# Import the chatbot functionality
from chatbot import initialize_chatbot, process_message, reset_chatbot_state

app = FastAPI()

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

# Initialize the chatbot on startup
@app.on_event("startup")
async def startup_event():
    await initialize_chatbot()
    print("Chatbot initialized and ready to process messages")

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