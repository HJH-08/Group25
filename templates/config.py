
# --------------- Azure OpenAI Settings ---------------
AZURE_OPENAI_DEPLOYMENT_NAME = "my-gpt-deployment"
AZURE_OPENAI_API_KEY = "YOUR_AZURE_OPENAI_API_KEY"
AZURE_OPENAI_ENDPOINT = "https://team25.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview"

# --------------- Hugging Face (Local or Remote) ---------------
HUGGING_FACE_MODEL_ID = "gpt2"
HUGGING_FACE_TASK = "text-generation"

# --------------- Vector Store Settings ---------------
# Since we are using an in-memory store, no external configs needed here.
# If later you want Pinecone, Qdrant, etc., you can add credentials here.
