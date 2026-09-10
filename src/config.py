import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

KEY_VAULT_URL = os.getenv("KEY_VAULT_URL")

def get_secret(secret_name: str, fallback_env_var: str, default_value: str = "") -> str:
    return os.getenv(fallback_env_var, default_value)

POSTGRES_URL = get_secret("POSTGRES-URL", "POSTGRES_URL", "postgresql://finsight_user:finsight_password@127.0.0.1:5433/finsight_db")
MONGO_URI = get_secret("MONGO-URI", "MONGO_URI", "mongodb://localhost:27017")
AZURE_STORAGE_CONNECTION_STRING = get_secret("AZURE-STORAGE-CONNECTION-STRING", "AZURE_STORAGE_CONNECTION_STRING", "")