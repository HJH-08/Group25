# main.py

import asyncio
from services import create_kernel
from router import choose_skill

def main():
    asyncio.run(run_chatbot())

async def run_chatbot():
    # 1. Create the kernel and register services/plugins
    kernel = create_kernel()

    # Access the memory plugins (short-term and long-term)
    short_term_memory = kernel.get_plugin("ShortTermMemory")
    long_term_memory = kernel.get_plugin("LongTermMemory")

    # 2. Import the Azure GPT skill and the local skill
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
        user_input = input("User: ").strip()
        if user_input.lower() in ["exit", "quit"]:
            print("Bot: It was nice talking with you. Take care!")
            break

        # ---- 1) Save user message to short-term memory ----
        await short_term_memory.save_information_async(
            collection="chat_history",
            text=f"User says: {user_input}",
            id=f"user-msg-{hash(user_input)}"
        )

        # ---- 2) Retrieve relevant context from short-term memory ----
        relevant_records = await short_term_memory.search_async(
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

        # ---- 7) Save bot response to short-term memory ----
        await short_term_memory.save_information_async(
            collection="chat_history",
            text=f"Bot says: {bot_reply}",
            id=f"bot-msg-{hash(bot_reply)}"
        )

        # ---- 8) Optionally, move key information to long-term memory ----
        # Example: If user mentions something important, save to long-term memory
        if "important" in user_input.lower():
            await long_term_memory.save_information_async(
                collection="important_topics",
                text=f"User mentioned: {user_input}",
                id=f"important-{hash(user_input)}"
            )


if __name__ == "__main__":
    main()
