import psycopg2
from pymongo import MongoClient
from config import POSTGRES_URL, MONGO_URI

def init_postgres():
    commands = [
        # Mantém o histórico de propostas de crédito dos usuários
        """
        CREATE TABLE IF NOT EXISTS propostas_credito (
            id SERIAL PRIMARY KEY,
            customer_name VARCHAR(150) NOT NULL,
            uf VARCHAR(2),
            porte VARCHAR(100),
            modalidade VARCHAR(100),
            carteira_a_vencer NUMERIC(15,2),
            a_vencer_ate_90_dias NUMERIC(15,2),
            a_vencer_de_91_ate_360_dias NUMERIC(15,2),
            numero_de_operacoes INT,
            requested_amount NUMERIC(15,2) NOT NULL,
            dividas_mensais NUMERIC(15,2),
            estimated_annual_income NUMERIC(15,2),
            pd_score NUMERIC(6,4),
            risk_rating VARCHAR(5),
            status VARCHAR(30) NOT NULL,
            approved_limit NUMERIC(15,2),
            suggested_rate_annual NUMERIC(6,2),
            decision_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        # Recria a carteira histórica do BCB
        "DROP TABLE IF EXISTS carteira_bcb_historica CASCADE;",
        """
        CREATE TABLE carteira_bcb_historica (
            id SERIAL PRIMARY KEY,
            data_base DATE,
            uf VARCHAR(2),
            segmento VARCHAR(50),
            cliente VARCHAR(10),
            cnae_ocupacao VARCHAR(150),
            porte VARCHAR(100),
            modalidade VARCHAR(150),
            submodalidade VARCHAR(200),
            origem VARCHAR(100),
            indexador VARCHAR(100),
            numero_de_operacoes INT,
            carteira_a_vencer NUMERIC(18,2),
            vencido_de_15_ate_90_dias NUMERIC(18,2),
            vencido_acima_de_90_dias NUMERIC(18,2),
            carteira_vencida NUMERIC(18,2),
            carteira_ativa NUMERIC(18,2),
            carteira_inadimplencia NUMERIC(18,2),
            ativo_problematico NUMERIC(18,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        # Recria os indicadores macroeconômicos (atualizados diariamente/mensalmente)
        "DROP TABLE IF EXISTS indicadores_macro_historica CASCADE;",
        """
        CREATE TABLE indicadores_macro_historica (
            id SERIAL PRIMARY KEY,
            data_referencia DATE NOT NULL,
            indicador VARCHAR(50) NOT NULL,
            valor NUMERIC(20,4) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        # Recria as transações do Pix (amostra de 30k)
        "DROP TABLE IF EXISTS pix_transacoes_historica CASCADE;",
        """
        CREATE TABLE pix_transacoes_historica (
            id SERIAL PRIMARY KEY,
            anomes INT,
            pag_pfpj VARCHAR(50),
            rec_pfpj VARCHAR(50),
            pag_regiao VARCHAR(50),
            rec_regiao VARCHAR(50),
            pag_idade VARCHAR(50),
            rec_idade VARCHAR(50),
            formainiciacao VARCHAR(100),
            natureza VARCHAR(100),
            finalidade VARCHAR(100),
            valor NUMERIC(18,2),
            quantidade BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        # Recria as estatísticas de fraudes e MED do Pix
        "DROP TABLE IF EXISTS pix_fraudes_historica CASCADE;",
        """
        CREATE TABLE pix_fraudes_historica (
            id SERIAL PRIMARY KEY,
            anomes INT,
            qtdepixcontestados BIGINT,
            qtdecontestacoesaceitas BIGINT,
            qtdecontestacoesrejeitadas BIGINT,
            qtdecontestacoesaceitasacada100mil NUMERIC(15,4),
            qtdeusuarioscommarcacoesdefraude BIGINT,
            qtdechavespixcommarcacoesdefraude BIGINT,
            valorpixcontestadosaceitos NUMERIC(18,2),
            quantidadedevolvidaintegralmentepormeiodomed BIGINT,
            valorpixdevolvidosintegralmente NUMERIC(18,2),
            quantidadedevolvidaparcialmentepormeiodomed BIGINT,
            valorpixdevolvidosparcialmente NUMERIC(18,2),
            valorpixresidualnaodevolvido NUMERIC(18,2),
            quantidadedenaodevolvidossaldoinsuficiente BIGINT,
            valorpixnaodevolvidossaldoinsuficiente NUMERIC(18,2),
            quantidadedenaodevolvidoscontaencerrada BIGINT,
            valornaodevolvidoscontaencerrada NUMERIC(18,2),
            quantidadedenaodevolvidosmotivosdiversos BIGINT,
            valorpixnaodevolvidosmotivosdiversos NUMERIC(18,2),
            percentualdedevolucao NUMERIC(5,2),
            qtdepixbloqueadoscautelarmenteeliberados BIGINT,
            valorpixbloqueadoscautelarmenteeliberados NUMERIC(18,2),
            qtdepixbloqueadoscautelarmenteedevolvidos BIGINT,
            valorpixbloqueadoscautelarmenteedevolvidos NUMERIC(18,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
    ]
    try:
        conn_args = {}
        if "postgres.database.azure.com" in POSTGRES_URL:
            conn_args["sslmode"] = "require"
        conn = psycopg2.connect(POSTGRES_URL, **conn_args)
        cur = conn.cursor()
        for command in commands:
            cur.execute(command)
        conn.commit()
        cur.close()
        conn.close()
        print("Tabelas essenciais do Dashboard recriadas e limpas com sucesso no PostgreSQL!")
    except Exception as e:
        print(f"Erro ao inicializar PostgreSQL: {e}")

def init_mongo():
    try:
        client = MongoClient(MONGO_URI)
        db = client["finsight_behavioral"]
        if "customer_events" not in db.list_collection_names():
            db.create_collection("customer_events")
        print("Coleção 'customer_events' do MongoDB inicializada!")
    except Exception as e:
        print(f"Erro ao inicializar MongoDB: {e}")

if __name__ == "__main__":
    init_postgres()
    init_mongo()