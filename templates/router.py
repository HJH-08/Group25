# router.py

def choose_skill(user_input: str) -> str:
    """
    Decide which skill (Azure or local) to invoke based on some simple logic.
    Return 'azure_chat' or 'local_chat'.
    You can get more sophisticated if you like.
    """
    # Example heuristic: If user input is long or might need more advanced GPT reasoning, use Azure.
    if len(user_input) > 80:
        return "azure_chat"
    else:
        return "local_chat"
