import pytest
import chatbot

@pytest.mark.asyncio
async def test_process_message_real_response():
    # Input from user
    user_input = "Hello, how are you doing?"

    
    response = await chatbot.process_message(user_input)

    # Expected key phrases from both online and offline responses
    expected_phrases = [
        "hello",
        "i'm here",
        "ready to chat",
        "doing well",
    ]

    # Pass if at least one expected phrase appears
    assert any(phrase in response.lower() for phrase in expected_phrases), \
        f"Unexpected response: {response}"
