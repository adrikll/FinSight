import psycopg2
from config import POSTGRES_URL

def limpar_tabelas_incorretas():
    conn = psycopg2.connect(POSTGRES_URL)
    cur = conn.cursor()
    
    print("🗑️ Removendo dados volumosos e incorretos do Azure...")
    cur.execute("TRUNCATE TABLE pix_transacoes_historica RESTART IDENTITY CASCADE;")
    cur.execute("TRUNCATE TABLE pix_fraudes_historica RESTART IDENTITY CASCADE;")
    
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Bancos limpos com sucesso! O armazenamento foi liberado.")

if __name__ == "__main__":
    limpar_tabelas_incorretas()