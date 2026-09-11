import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
postgres_url = os.getenv("POSTGRES_URL")

try:
  conn = psycopg2.connect(postgres_url)
  conn.autocommit = True
  cur = conn.cursor()

  # Remove e recria o schema public do zero, limpando absolutamente tudo
  cur.execute("DROP SCHEMA public CASCADE;")
  cur.execute("CREATE SCHEMA public;")
  print(
      "Schema public do banco da Azure limpo e recriado com sucesso (zero"
      " tabelas residuais)!"
  )

  cur.close()
  conn.close()
except Exception as e:
  print(f"Erro ao limpar o banco: {e}")