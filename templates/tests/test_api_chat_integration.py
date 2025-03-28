import pytest
from httpx import AsyncClient
from server import app 

expected_phrases = [
    "hello",
    "i'm here",
    "ready to chat",
    "doing well",
]

@pytest.mark.asyncio
async def test_chat_endpoint_returns_expected_response():
    async with AsyncClient(app=app, base_url="http://test") as client:
        user_input = {"message": "Hello, how are you doing?"}
        response = await client.post("/api/chat", json=user_input)
        
        assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
        
        data = response.json()
        assert "response" in data, "Missing 'response' key in API response"
        
        chatbot_reply = data["response"].lower()
        
        # Check if at least one expected phrase appears in the chatbot reply
        assert any(phrase in chatbot_reply for phrase in expected_phrases), \
            f"Unexpected chatbot reply: {chatbot_reply}"
