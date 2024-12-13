import requests

# Configuration
API_KEY = "YOUR_API_KEY"  # Replace with your actual API key
ENDPOINT = "https://team25.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview"  # Replace with your endpoint

headers = {
    "Content-Type": "application/json",
    "api-key": API_KEY,
}

def send_request(prompt):
    # Prepare the payload
    payload = {
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "top_p": 0.95,
        "max_tokens": 800
    }
    
    # Send the request
    try:
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        response.raise_for_status()  # Check for HTTP request errors
        result = response.json()
        # Extract the AI's reply
        return result["choices"][0]["message"]["content"]
    except requests.RequestException as e:
        return f"An error occurred: {e}"

# Interactive loop
print("Type your prompt below. Type 'exit' to quit.")
while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        print("Goodbye!")
        break
    # Send the prompt and display the reply
    reply = send_request(user_input)
    print(f"AI: {reply}")
