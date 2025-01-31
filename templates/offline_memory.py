import json
import os
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from semantic_kernel.contents import AuthorRole
from semantic_kernel.contents.chat_history import ChatHistory

CHAT_HISTORY_FILE = "chat_history.json"

def load_chat_history(user_id):
    """Load chat history from JSON for a specific user."""
    if not os.path.exists(CHAT_HISTORY_FILE):
        return ChatHistory(messages=[])

    with open(CHAT_HISTORY_FILE, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
            user_messages = data.get(user_id, [])
            return ChatHistory(
                messages=[
                    ChatMessageContent(role=AuthorRole(msg["role"]), content=msg["content"])
                    for msg in user_messages
                ]
            )
        except json.JSONDecodeError:
            return ChatHistory(messages=[])

def save_chat_history(user_id, new_messages):
    """Append new messages to chat history instead of overwriting."""
    if not isinstance(new_messages, list):
        new_messages = [new_messages]  # Ensure it's a list

    # Load existing chat history
    chat_data = {}
    if os.path.exists(CHAT_HISTORY_FILE):
        with open(CHAT_HISTORY_FILE, "r", encoding="utf-8") as f:
            try:
                chat_data = json.load(f)
            except json.JSONDecodeError:
                chat_data = {}

    # Ensure user's chat history exists
    if user_id not in chat_data:
        chat_data[user_id] = []

    # Convert messages to JSON format and append
    chat_data[user_id].extend([
        {
            "role": msg.role.value,  # USER, ASSISTANT, SYSTEM
            "content": msg.content
        } for msg in new_messages
    ])

    # Save back to file
    with open(CHAT_HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(chat_data, f, ensure_ascii=False, indent=4)
