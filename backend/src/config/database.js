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
        DROP TABLE IF EXISTS restaurant_stock CASCADE;
        DROP TABLE IF EXISTS restaurant_purchases CASCADE;
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

      CREATE TABLE IF NOT EXISTS restaurant_sales (
        id SERIAL PRIMARY KEY,
        food_name VARCHAR(100) NOT NULL,
        amount INTEGER NOT NULL,
        sale_portion INTEGER NOT NULL,
        stock_portion INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS restaurant_menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL,
        stock INTEGER DEFAULT 100
      );
    `);

    // Ensure stock column exists in restaurant_menu_items for existing databases
    await pool.query(`
      ALTER TABLE restaurant_menu_items ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 100;
    `);

    // Create catering stock levels table (since we don't own menu_items to alter it)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS catering_stock_levels (
        id SERIAL PRIMARY KEY,
        menu_item_id INTEGER UNIQUE NOT NULL,
        stock INTEGER DEFAULT 100
      );
    `);

    // Create logs tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS restaurant_usage_log (
        id SERIAL PRIMARY KEY,
        food_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        reason VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS restaurant_purchase_log (
        id SERIAL PRIMARY KEY,
        food_name VARCHAR(100) NOT NULL,
        portions_added INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS kitchen_usage_log (
        id SERIAL PRIMARY KEY,
        food_name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL,
        reason VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS kitchen_purchase_log (
        id SERIAL PRIMARY KEY,
        food_name VARCHAR(100) NOT NULL,
        portions_added INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS kitchen_purchase_requirements (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL,
        current_stock NUMERIC DEFAULT 0,
        required_quantity NUMERIC DEFAULT 0,
        unit VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        minimum_stock NUMERIC DEFAULT 10,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure minimum_stock column exists in kitchen_purchase_requirements for existing databases
    await pool.query(`
      ALTER TABLE kitchen_purchase_requirements ADD COLUMN IF NOT EXISTS minimum_stock NUMERIC DEFAULT 10;
    `);

    // Ensure unit for leaf/leafe items is Pcs
    await pool.query(`
      UPDATE kitchen_purchase_requirements SET unit = 'Pcs' WHERE LOWER(name) LIKE '%leaf%' OR LOWER(name) LIKE '%leafe%';
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

    // Seed default restaurant menu items if empty
    const checkRestMenu = await pool.query("SELECT COUNT(*) FROM restaurant_menu_items");
    if (parseInt(checkRestMenu.rows[0].count) === 0) {
      console.log("Seeding restaurant menu items...");
      const items = [
        ['Podi Dosa', 50, 'breakfast'],
        ['Plain Roast', 40, 'breakfast'],
        ['Idli (2 Nos)', 20, 'breakfast'],
        ['Medu Vada (1 No)', 10, 'breakfast'],
        ['Poori Masala', 45, 'breakfast'],
        ['Coffee', 15, 'breakfast'],
        ['Tea', 12, 'breakfast'],
        ['Veg Meals', 80, 'lunch'],
        ['Non-Veg Meals', 120, 'lunch'],
        ['Chicken Biryani', 150, 'lunch'],
        ['Egg Fried Rice', 100, 'lunch'],
        ['Parotta (2 Nos)', 40, 'dinner'],
        ['Egg Parotta', 80, 'dinner'],
        ['Chicken Fried Rice', 120, 'dinner'],
        ['Chilli Chicken', 120, 'dinner'],
        ['Onion Uthappam', 50, 'dinner']
      ];

      for (const [name, price, category] of items) {
        await pool.query(
          "INSERT INTO restaurant_menu_items (name, price, category) VALUES ($1, $2, $3)", 
          [name, price, category]
        );
      }
      console.log("✅ Restaurant menu items seeded.");
    }

    // Seed default kitchen purchase requirements if empty
    const checkRequirements = await pool.query("SELECT COUNT(*) FROM kitchen_purchase_requirements");
    if (parseInt(checkRequirements.rows[0].count) === 0) {
      console.log("Seeding kitchen purchase requirements...");
      const reqItems = [
        ['Oil', 'Groceries', 5, 20, 'Liter', 'Pending', 8],
        ['Milk', 'Dairy', 10, 15, 'Liter', 'Pending', 5],
        ['Vegetables', 'Produce', 8, 25, 'Kg', 'Pending', 10],
        ['Chicken', 'Meat', 15, 30, 'Kg', 'Approved', 12],
        ['Mutton', 'Meat', 12, 25, 'Kg', 'Approved', 8],
        ['Prawn', 'Seafood', 5, 15, 'Kg', 'Pending', 4],
        ['Rice', 'Groceries', 50, 100, 'Kg', 'Purchased', 40],
        ['Soft Drinks', 'Beverages', 12, 50, 'Piece', 'Pending', 15],
        ['Eggs', 'Dairy', 60, 120, 'Piece', 'Approved', 40]
      ];

      for (const [name, category, current_stock, required_quantity, unit, status, minimum_stock] of reqItems) {
        await pool.query(
          "INSERT INTO kitchen_purchase_requirements (name, category, current_stock, required_quantity, unit, status, minimum_stock) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (name) DO NOTHING",
          [name, category, current_stock, required_quantity, unit, status, minimum_stock]
        );
      }
      console.log("✅ Kitchen purchase requirements seeded.");
    } else {
      // Ensure Mutton and Prawn exist
      await pool.query(
        "INSERT INTO kitchen_purchase_requirements (name, category, current_stock, required_quantity, unit, status, minimum_stock) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (name) DO NOTHING",
        ['Mutton', 'Meat', 12, 25, 'Kg', 'Approved', 8]
      );
      await pool.query(
        "INSERT INTO kitchen_purchase_requirements (name, category, current_stock, required_quantity, unit, status, minimum_stock) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (name) DO NOTHING",
        ['Prawn', 'Seafood', 5, 15, 'Kg', 'Pending', 4]
      );
    }

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
