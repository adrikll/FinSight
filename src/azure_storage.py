import os
from azure.storage.blob import BlobServiceClient

# Puxa a string de conexão do Azure
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
CONTAINER_NAME = os.getenv("AZURE_BLOB_CONTAINER", "finsight-artifacts")

def get_blob_service_client():
    if not AZURE_STORAGE_CONNECTION_STRING:
        print("AZURE_STORAGE_CONNECTION_STRING não configurada. Operando em modo local.")
        return None
    try:
        return BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    except Exception as e:
        print(f"Erro ao conectar ao Azure Blob Storage: {e}")
        return None

def upload_file_to_azure(file_path: str, blob_name: str) -> bool:
    """Envia arquivos locais (modelos, CSVs, relatórios) para o Azure Blob Storage."""
    client = get_blob_service_client()
    if not client:
        return False
    try:
        container_client = client.get_container_client(CONTAINER_NAME)
        if not container_client.exists():
            container_client.create_container()
            
        blob_client = container_client.get_blob_client(blob_name)
        with open(file_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
        print(f"Arquivo {blob_name} enviado com sucesso para o Azure Blob Storage!")
        return True
    except Exception as e:
        print(f"Falha no upload para o Azure: {e}")
        return False