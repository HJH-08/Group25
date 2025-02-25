# backend/server.py
import os
import asyncio
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn


from chatbot import initialize_chatbot, chat_function, chat_history
from kernel_manager import setup_kernel
from semantic_kernel.functions import KernelArguments

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


kernel = None

@app.on_event("startup")
async def startup_event():
    global kernel
    kernel, chat_function, chat_history, model_name = await setup_kernel()
    print(f"Chatbot backend is initialized using {model_name}.")

@app.post("/api/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    user_input = data.get("message", "")
    if not user_input:
        return JSONResponse({"error": "No input provided"}, status_code=400)

    response_text = ""
    try:
        async for chunk in kernel.invoke_stream(
            chat_function,
            KernelArguments(chat_history=chat_history, user_input=user_input)
        ):
            if not isinstance(chunk, list):
                continue
            for msg in chunk:
                if not (hasattr(msg, "items") and msg.items):
                    continue
                response_text += msg.items[0].text
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

    return {"response": response_text}


frontend_build_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "build")
if os.path.exists(frontend_build_path):
    app.mount("/", StaticFiles(directory=frontend_build_path, html=True), name="static")
    print("Serving static frontend from:", frontend_build_path)
else:
    @app.get("/")
    def read_root():
        return {"message": "Backend is running. Frontend build not found."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
