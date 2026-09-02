import psycopg2
from src.config import POSTGRES_URL

def limpar_tabelas_obsoletas():
    tabelas_para_remover = [
        "cenarios_simulados",
        "propostas_credito" # Se não for mais utilizada no dashboard atual
    ]
    
    try:
        conn_args = {}
        if "postgres.database.azure.com" in POSTGRES_URL:
            conn_args["sslmode"] = "require"
        conn = psycopg2.connect(POSTGRES_URL, **conn_args)
        cur = conn.cursor()
        
        for tabela in tabelas_para_remover:
            cur.execute(f"DROP TABLE IF EXISTS {tabela} CASCADE;")
            print(f"🗑️ Tabela obsoleta '{tabela}' removida com sucesso do Azure.")
            
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Limpeza do banco de dados concluída!")
    except Exception as e:
        print(f"❌ Erro ao limpar tabelas: {e}")

if __name__ == "__main__":
    limpar_tabelas_obsoletas()