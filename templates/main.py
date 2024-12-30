# main.py

import asyncio
import semantic_kernel as sk

from services import create_kernel
from memory_store import setup_memory
from router import choose_skill

def main():
    asyncio.run(run_chatbot())

async def run_chatbot():
    # 1. Create the kernel and register services
    kernel = create_kernel()

    # 2. Setup in-memory vector store
    kernel = setup_memory(kernel)

    # 3. Import the Azure GPT skill and the local skill
    azure_chat_skill = kernel.import_semantic_skill_from_directory(
        skill_directory="skills",
        skill_name="azure_chat"
    )
    local_chat_skill = kernel.import_semantic_skill_from_directory(
        skill_directory="skills",
        skill_name="local_chat"
    )

    print("Welcome to your Companion Chatbot!")
    print("This chatbot provides gentle conversation for an elderly person with memory issues.")
    print("Type 'exit' to quit.\n")

    while True:
        user_input = input("User: ")
        if user_input.lower() in ["exit", "quit"]:
            print("Bot: It was nice talking with you. Take care!")
            break

        # ---- 1) Save user message to memory ----
        await kernel.memory.save_information_async(
            collection="chat_history",
            text=f"User says: {user_input}",
            id=f"user-msg-{hash(user_input)}"
        )

        # ---- 2) Retrieve relevant context from memory ----
        # We'll search the chat_history collection for content relevant to the current user input
        relevant_records = await kernel.memory.search_async(
            collection="chat_history",
            query=user_input,
            limit=2
        )

        # Combine relevant records into a string
        historical_context = "\n".join([r.text for r in relevant_records])

        # ---- 3) Decide which skill to use ----
        chosen_skill_name = choose_skill(user_input)

        if chosen_skill_name == "azure_chat":
            skill_function = azure_chat_skill["skprompt"]
        else:
            skill_function = local_chat_skill["skprompt"]

        # ---- 4) Prepare the final input for the skill prompt, injecting memory context ----
        combined_input = f"{historical_context}\n\nCurrent user message:\n{user_input}"

        # ---- 5) Call the skill to get a response ----
        response = await kernel.run_async(combined_input, skill_function)

        # ---- 6) Print and save the bot's response ----
        bot_reply = str(response).strip()
        print("Bot:", bot_reply)

        # Store the bot response in memory as well
        await kernel.memory.save_information_async(
            collection="chat_history",
            text=f"Bot says: {bot_reply}",
            id=f"bot-msg-{hash(bot_reply)}"
        )

if __name__ == "__main__":
    main()
