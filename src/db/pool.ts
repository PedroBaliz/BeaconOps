import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "A variável DATABASE_URL não foi definida no arquivo .env."
  );
}

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error("Erro inesperado na conexão com PostgreSQL:", error.message);
});