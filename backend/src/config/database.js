const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "postgres",
  password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : "postgres",
  port: process.env.DB_PORT || 5432
});

pool.on('error', (err) => {
  console.error("Unexpected error on database pool client ❌:", err);
});

const initializeDatabase = async () => {
  try {
    // 1. Drop all obsolete restaurant-related tables
    try {
      await pool.query(`
        DROP TABLE IF EXISTS order_items CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS purchases CASCADE;
        DROP TABLE IF EXISTS portion_configs CASCADE;
        DROP TABLE IF EXISTS stock_movements CASCADE;
        DROP TABLE IF EXISTS suppliers CASCADE;
        DROP TABLE IF EXISTS purchase_entries CASCADE;
        DROP TABLE IF EXISTS inventory_stock CASCADE;
      `);
      console.log("Obsolete Restaurant database tables cleaned up successfully 🧹");
    } catch (dropErr) {
      console.warn("Warning: Failed to clean up some obsolete tables:", dropErr.message);
    }

    // 2. Ensure core tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user'
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL
      );
    `);

    // 3. Drop obsolete restaurant/inventory columns from menu_items if they exist
    try {
      const colsRes = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'menu_items' 
          AND column_name IN ('quantity', 'date', 'is_catering');
      `);
      
      if (colsRes.rows.length > 0) {
        await pool.query(`
          ALTER TABLE menu_items DROP COLUMN IF EXISTS quantity;
          ALTER TABLE menu_items DROP COLUMN IF EXISTS date;
          ALTER TABLE menu_items DROP COLUMN IF EXISTS is_catering;
        `);
        console.log("Obsolete columns dropped from menu_items ✅");
      }
    } catch (alterErr) {
      console.warn("Warning: Could not alter menu_items table to drop obsolete columns (this is fine if they do not exist or you lack ownership):", alterErr.message);
    }
    console.log("Core tables initialized and checked ✅");

    // 4. Seed default admin account
    await pool.query(`
      INSERT INTO users (email, password, role) 
      VALUES ('admin@gmail.com', 'admin', 'admin') 
      ON CONFLICT (email) DO UPDATE SET password = 'admin', role = 'admin';
    `);
    console.log("Admin user seeded/updated successfully! 👑");

  } catch (error) {
    console.error("Database initialization error ❌:", error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
};
