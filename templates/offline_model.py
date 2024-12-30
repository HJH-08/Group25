from transformers import AutoModelForCausalLM, AutoTokenizer

class OfflineModel:
    def __init__(self, model_name="microsoft/DialoGPT-small"):
        print("Loading offline model...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)
        print("Offline model loaded!")

    def complete(self, prompt, max_tokens=100, **kwargs):
        # Tokenize the prompt
        input_ids = self.tokenizer.encode(prompt, return_tensors="pt")
        # Generate a response
        output_ids = self.model.generate(
            input_ids,
            max_length=max_tokens + len(input_ids[0]),
            pad_token_id=self.tokenizer.eos_token_id,
            **kwargs
        )
        # Decode and return the response
        response = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
        return response
