from fastapi import FastAPI, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import asyncio

# Import the chatbot functionality
from chatbot import initialize_chatbot, process_message

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Change this if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserInput(BaseModel):
    message: str

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