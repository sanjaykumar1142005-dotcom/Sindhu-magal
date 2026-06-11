require('dotenv').config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "postgres",
  password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : "postgres",
  port: process.env.DB_PORT || 5432
});

async function checkSchema() {
  try {
    const userRes = await pool.query("SELECT CURRENT_USER, SESSION_USER;");
    console.log("Current and Session User:", userRes.rows);

    const tablesRes = await pool.query(`
      SELECT tablename, tableowner 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    console.log("Tables and Owners:", tablesRes.rows);

    const columnsRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'menu_items';
    `);
    console.log("Columns in menu_items:", columnsRes.rows);

    process.exit(0);
  } catch (err) {
    console.error("Error running checks:", err);
    process.exit(1);
  }
}

checkSchema();
