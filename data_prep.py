import os
import glob
import kagglehub
import polars as pl

PROCESSED_DIR = "data/processed"
PARQUET_FILE = os.path.join(PROCESSED_DIR, "lending_club_sample.parquet")

def download_and_process():
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    print("Baixando dataset do Lending Club via kagglehub...")
    download_path = kagglehub.dataset_download("wordsforthewise/lending-club")
    print(f"Dataset baixado em: {download_path}")

    all_csv_files = glob.glob(os.path.join(download_path, "**", "*.csv"), recursive=True)
    
    real_csv_files = [f for f in all_csv_files if os.path.isfile(f)]

    if not real_csv_files:
        raise FileNotFoundError("Nenhum arquivo CSV válido foi encontrado na pasta do download.")

    # Prioriza o arquivo contendo 'accepted' no nome
    target_csv = real_csv_files[0]
    for f in real_csv_files:
        if "accepted" in os.path.basename(f).lower():
            target_csv = f
            break

    print(f"Lendo e processando o arquivo: {target_csv}")

    #Leitura otimizada com Polars
    df = pl.read_csv(target_csv, infer_schema_length=10000, ignore_errors=True)

    #Filtrar apenas contratos finalizados
    df_filtered = df.filter(
        pl.col("loan_status").is_in(["Fully Paid", "Charged Off"])
    )

    #Criar a variável Target (Default = 1, Fully Paid = 0)
    df_filtered = df_filtered.with_columns(
        pl.when(pl.col("loan_status") == "Charged Off")
        .then(1)
        .otherwise(0)
        .alias("target_default")
    )

    #Seleção de Features Relevantes
    selected_columns = [
        "member_id", "loan_amnt", "term", "int_rate", "installment", "grade", "sub_grade",
        "emp_length", "home_ownership", "annual_inc", "verification_status", "purpose",
        "dti", "delinq_2yrs", "earliest_cr_line", "inq_last_6mths", "open_acc",
        "pub_rec", "revol_bal", "revol_util", "total_acc", "target_default"
    ]

    df_clean = df_filtered.select([c for c in selected_columns if c in df_filtered.columns])

    #Amostragem representativa (200.000 registros) e escrita em Parquet
    df_sample = df_clean.sample(n=200000, seed=42)
    df_sample.write_parquet(PARQUET_FILE)

    print(f"Sucesso! {df_sample.height} linhas exportadas para '{PARQUET_FILE}'.")

if __name__ == "__main__":
    download_and_process()