from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

def main():
    print("Loading model. This may take a while...")

    # Load the pre-trained model and tokenizer (offline)
    model_name = "microsoft/DialoGPT-small"  # Offline conversational model
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)

    # Ensure pad_token_id is set
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token_id = tokenizer.eos_token_id

    print("Chatbot is ready! Type 'exit' to quit.")

    # Chat loop
    chat_history_ids = None  # To keep track of chat history
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Goodbye!")
            break

        # Tokenize the user input
        new_input_ids = tokenizer.encode(user_input + tokenizer.eos_token, return_tensors="pt")

        # Append new user input to chat history (if any)
        bot_input_ids = new_input_ids if chat_history_ids is None else torch.cat([chat_history_ids, new_input_ids], dim=-1)

        # Generate response using the model
        attention_mask = (bot_input_ids != tokenizer.pad_token_id).long()  # Create a valid attention mask
        chat_history_ids = model.generate(
            bot_input_ids,
            attention_mask=attention_mask,  # Pass the attention mask
            max_length=1000,
            pad_token_id=tokenizer.pad_token_id,
            do_sample=True,
            top_p=0.92,
            top_k=50
        )

        # Decode the response
        bot_reply = tokenizer.decode(chat_history_ids[:, bot_input_ids.shape[-1]:][0], skip_special_tokens=True)
        print(f"Bot: {bot_reply}")

if __name__ == "__main__":
    main()
