import "dotenv/config";
import { pool } from "./pool.js";

async function testConnection() {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS time"
    );

    console.log("Conexão com PostgreSQL estabelecida!");
    console.log("Banco:", result.rows[0].database);
    console.log("Horário do banco:", result.rows[0].time);
  } catch (error) {
    console.error("Falha na conexão com PostgreSQL:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();