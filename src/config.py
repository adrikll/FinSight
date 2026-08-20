import os
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

KEY_VAULT_URL = os.getenv("KEY_VAULT_URL")

def get_secret(secret_name: str, fallback_env_var: str, default_value: str = "") -> str:
    if KEY_VAULT_URL:
        try:
            credential = DefaultAzureCredential()
            client = SecretClient(vault_url=KEY_VAULT_URL, credential=credential)
            return client.get_secret(secret_name).value
        except Exception as e:
            print(f"Falha ao buscar '{secret_name}' no Key Vault: {e}")
    
    return os.getenv(fallback_env_var, default_value)

POSTGRES_URL = get_secret("POSTGRES-URL", "POSTGRES_URL", "postgresql://finsight_user:finsight_password@localhost:5433/finsight_db")
MONGO_URI = get_secret("MONGO-URI", "MONGO_URI", "mongodb://localhost:27017")
AZURE_STORAGE_CONNECTION_STRING = get_secret("AZURE-STORAGE-CONNECTION-STRING", "AZURE_STORAGE_CONNECTION_STRING", "")