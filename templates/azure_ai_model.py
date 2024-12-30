from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion

def create_azure_chat_completion(deployment_name, api_key, base_url):
    return AzureChatCompletion(
        deployment_name=deployment_name,
        api_key=api_key,
        base_url=base_url
    )
