import pytest
from httpx import AsyncClient
from server import app 

@pytest.mark.asyncio
async def test_mode_switch_to_offline():
    # Simulate frontend sending change request
    payload = {
        "use_ollama": True, # Tells backend to switch to OFFLINE mode
        "model_id": "phi3.5:latest", # Choice of Offline mode
        "use_speech": True,
        "avatar_type": "male"
    }

    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/config", json=payload)

        # Check response status
        assert response.status_code == 200, f"Unexpected status code: {response.status_code}"

        # Check payload structure
        data = response.json()
        assert "status" in data and data["status"] == "success", "Mode switch did not succeed"
        assert "message" in data
        assert "Offline" in data["message"] or "phi3" in data["message"].lower()

